// Servicio de cobros/pagos: reemplaza las lecturas/escrituras de la colección
// 'pagos' de Firestore por la tabla 'pagos' de Supabase (ver
// supabase/migrations/0001_schema.sql).
//
// IMPORTANTE sobre identificación: igual que en Firestore (y que 'eventos'), la
// columna `paquete_id` guarda el TRACKING del paquete (text), no el uuid de la
// fila de 'paquetes'. Por eso los pagos se registran con paqueteId = tracking.
//
// `fecha` (timestamptz) se expone hacia la app como un objeto tipo Timestamp de
// Firestore ({ toDate() }) para preservar el código existente que llamaba a
// `pago.fecha.toDate()`.

import { supabase, auth } from '../supabase';
import { updatePaquete } from './paquetes';
import { registrarAuditoria } from './auditoria';

// Sentinels que en la app representaban "sin valor" pero que en columnas uuid FK
// deben ser null.
function uuidOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value);
  if (s === '' || s === 'unknown' || s === 'self') return null;
  return s;
}

export interface PagoRow {
  id: string;
  paquete_id: string;
  monto: number;
  metodo: string | null;
  estado: string;
  nota: string | null;
  agente_id: string | null;
  fecha?: string;
}

export type FlatPago = {
  id: string;
  paqueteId: string;
  monto: number;
  metodo: string | null;
  estado: string;
  nota: string | null;
  agenteId: string | null;
  // fecha se expone como un objeto tipo Timestamp de Firestore ({ toDate() })
  // para que el código existente que llamaba a fecha.toDate() siga funcionando.
  fecha?: { toDate: () => Date };
  [key: string]: unknown;
};

export function rowToPago(row: PagoRow): FlatPago {
  const fecha = row.fecha ? { toDate: () => new Date(row.fecha as string) } : undefined;
  return {
    id: row.id,
    paqueteId: row.paquete_id,
    monto: row.monto,
    metodo: row.metodo,
    estado: row.estado,
    nota: row.nota,
    agenteId: row.agente_id,
    fecha,
  };
}

export interface ListPagosOptions {
  estado?: string;
  agenteId?: string;
  paqueteId?: string; // tracking
  limit?: number;
}

function applyFilters(opts: ListPagosOptions) {
  let q = supabase.from('pagos').select('*');
  if (opts.estado) q = q.eq('estado', opts.estado);
  if (opts.agenteId) q = q.eq('agente_id', opts.agenteId);
  if (opts.paqueteId) q = q.eq('paquete_id', opts.paqueteId);
  q = q.order('fecha', { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  return q;
}

export async function listPagos(opts: ListPagosOptions = {}): Promise<FlatPago[]> {
  const { data, error } = await applyFilters(opts);
  if (error) {
    console.error('Error cargando pagos:', error.message);
    return [];
  }
  return (data as PagoRow[]).map(rowToPago);
}

// Equivalente a onSnapshot de Firestore: carga inicial + suscripción realtime.
export function subscribePagos(
  opts: ListPagosOptions,
  cb: (pagos: FlatPago[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  let active = true;
  const load = () => {
    listPagos(opts).then((pagos) => {
      if (active) cb(pagos);
    }).catch((err) => {
      if (active && onError) onError(err);
    });
  };
  load();
  const channel = supabase
    .channel(`pagos-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/** Cuenta los pagos en estado 'Pendiente' (usado por el badge del Sidebar). */
export async function contarPagosPendientes(): Promise<number> {
  const { count, error } = await supabase
    .from('pagos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Pendiente');
  if (error) {
    console.error('Error contando pagos pendientes:', error.message);
    return 0;
  }
  return count || 0;
}

// Equivalente a onSnapshot para el contador de pagos pendientes.
export function subscribePagosPendientesCount(
  cb: (count: number) => void,
): () => void {
  let active = true;
  const load = () => {
    contarPagosPendientes().then((n) => {
      if (active) cb(n);
    });
  };
  load();
  const channel = supabase
    .channel(`pagos-pend-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export interface NuevoPagoInput {
  // paqueteId DEBE ser el tracking del paquete.
  paqueteId: string;
  monto: number;
  metodo: string;
  estado?: string;
  nota?: string | null;
  agenteId?: string | null;
  fecha?: Date | string | null;
}

/** Inserta un pago en la tabla 'pagos'. `paqueteId` debe ser el tracking. */
export async function addPago(input: NuevoPagoInput): Promise<string> {
  const row: Record<string, unknown> = {
    paquete_id: input.paqueteId,
    monto: input.monto,
    metodo: input.metodo,
    estado: input.estado ?? 'Pendiente',
    nota: input.nota ?? null,
    agente_id: uuidOrNull(input.agenteId),
  };
  if (input.fecha !== undefined && input.fecha !== null) {
    row.fecha = input.fecha instanceof Date ? input.fecha.toISOString() : input.fecha;
  }
  const { data, error } = await supabase.from('pagos').insert(row).select('id').single();
  if (error) {
    console.error('Error registrando pago:', error.message);
    throw error;
  }
  return (data as { id: string }).id;
}

/** Marca un pago como confirmado (equivalente al antiguo updateDoc de Contabilidad). */
export async function confirmarPago(pagoId: string): Promise<void> {
  const { error } = await supabase.from('pagos').update({ estado: 'Confirmado' }).eq('id', pagoId);
  if (error) {
    console.error('Error confirmando pago:', error.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Registro de cobro sobre un paquete con deuda
// ---------------------------------------------------------------------------

export interface PaqueteConDeuda {
  id: string;
  tracking: string;
  clienteNombre?: string;
  precioFinal?: number | null;
  importePagado?: number;
  importePendiente?: number;
}

export interface NuevoCobroInput {
  paquete: PaqueteConDeuda;
  monto: number;
  metodo: string;
  nota?: string;
}

/**
 * Registra un cobro: crea la fila en 'pagos' (Supabase) y actualiza los importes
 * del paquete.
 */
export async function registrarCobro({ paquete, monto, metodo, nota }: NuevoCobroInput): Promise<void> {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const pagadoActual = paquete.importePagado || 0;
  const pendienteActual = paquete.importePendiente ?? Math.max((paquete.precioFinal || 0) - pagadoActual, 0);

  const nuevoPagado = r2(pagadoActual + monto);
  const nuevoPendiente = r2(Math.max(pendienteActual - monto, 0));

  await addPago({
    paqueteId: paquete.tracking,
    monto: r2(monto),
    metodo,
    estado: 'Pagado',
    nota: nota || null,
    agenteId: auth.currentUser?.uid || 'unknown',
    fecha: new Date(),
  });
  await updatePaquete(paquete.id, {
    importePagado: nuevoPagado,
    importePendiente: nuevoPendiente,
    estadoPago: nuevoPendiente <= 0 ? 'Pagado' : 'Parcial',
  });

  await registrarAuditoria({
    accion: 'cobro',
    entidad: 'paquete',
    entidadId: paquete.tracking,
    descripcion: `Cobro de ${monto.toFixed(2)} € (${metodo}) sobre ${paquete.tracking}`,
    valorAnterior: `pagado ${pagadoActual.toFixed(2)} € · pendiente ${pendienteActual.toFixed(2)} €`,
    valorNuevo: `pagado ${nuevoPagado.toFixed(2)} € · pendiente ${nuevoPendiente.toFixed(2)} €`,
    motivo: nota || null,
  });
}
