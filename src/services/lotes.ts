// Servicio de lotes de salida: reemplaza las lecturas/escrituras de la colección
// 'lotes' de Firestore por la tabla 'lotes' de Supabase (ver
// supabase/migrations/0001_schema.sql). Los paquetes se vinculan mediante los
// campos aditivos loteId/loteCodigo del paquete y cada movimiento queda
// registrado en 'eventos' con tipoCambio 'lote'.
//
// Notas de mapeo:
// - El identificador de fila es el `id` uuid (equivalente al doc.id de Firestore).
// - `fecha_estimada_salida`/`fecha_estimada_llegada` son columnas `date`; Postgres
//   acepta el string 'YYYY-MM-DD' que envían los formularios.
// - `fecha_real_salida`/`fecha_real_llegada` son timestamptz.
// - createdAt/updatedAt/fechaRealSalida/fechaRealLlegada se exponen como objetos
//   tipo Timestamp de Firestore ({ toDate() }) por compatibilidad.

import { supabase, auth } from '../supabase';
import { cambiarEstado, type PaqueteParaCambio } from './estados';
import { updatePaquete } from './paquetes';
import { addEvento } from './eventos';
import { registrarAuditoria } from './auditoria';
import type { EstadoLote } from '../constants/estados';

function uuidOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value);
  if (s === '' || s === 'unknown' || s === 'self') return null;
  return s;
}

export function generarCodigoLote(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `LOTE-${date}-${random}`;
}

export interface LoteRow {
  id: string;
  codigo: string;
  estado: string;
  ruta: string | null;
  contenedor: string | null;
  oficina_origen: string | null;
  oficina_destino: string | null;
  responsable: string | null;
  notas: string | null;
  fecha_estimada_salida: string | null;
  fecha_estimada_llegada: string | null;
  fecha_real_salida: string | null;
  fecha_real_llegada: string | null;
  total_paquetes: number;
  peso_total: number;
  peso_tasable_total: number;
  volumen_total_cm3: number;
  valor_declarado_total: number;
  ingresos_estimados: number;
  costes_estimados: number | null;
  beneficio_estimado: number | null;
  creado_por: string | null;
  created_at?: string;
  updated_at?: string;
}

export type FlatLote = {
  id: string;
  codigo: string;
  estado: string;
  ruta: string | null;
  contenedor: string | null;
  oficinaOrigen: string | null;
  oficinaDestino: string | null;
  responsable: string | null;
  notas: string | null;
  fechaEstimadaSalida: string | null;
  fechaEstimadaLlegada: string | null;
  fechaRealSalida?: { toDate: () => Date };
  fechaRealLlegada?: { toDate: () => Date };
  totalPaquetes: number;
  pesoTotal: number;
  pesoTasableTotal: number;
  volumenTotalCm3: number;
  valorDeclaradoTotal: number;
  ingresosEstimados: number;
  costesEstimados: number | null;
  beneficioEstimado: number | null;
  creadoPor: string | null;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
  [key: string]: unknown;
};

export function rowToLote(row: LoteRow): FlatLote {
  const ts = (v: string | null | undefined) => (v ? { toDate: () => new Date(v) } : undefined);
  return {
    id: row.id,
    codigo: row.codigo,
    estado: row.estado,
    ruta: row.ruta,
    contenedor: row.contenedor,
    oficinaOrigen: row.oficina_origen,
    oficinaDestino: row.oficina_destino,
    responsable: row.responsable,
    notas: row.notas,
    fechaEstimadaSalida: row.fecha_estimada_salida,
    fechaEstimadaLlegada: row.fecha_estimada_llegada,
    fechaRealSalida: ts(row.fecha_real_salida),
    fechaRealLlegada: ts(row.fecha_real_llegada),
    totalPaquetes: row.total_paquetes,
    pesoTotal: row.peso_total,
    pesoTasableTotal: row.peso_tasable_total,
    volumenTotalCm3: row.volumen_total_cm3,
    valorDeclaradoTotal: row.valor_declarado_total,
    ingresosEstimados: row.ingresos_estimados,
    costesEstimados: row.costes_estimados,
    beneficioEstimado: row.beneficio_estimado,
    creadoPor: row.creado_por,
    createdAt: ts(row.created_at),
    updatedAt: ts(row.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export interface ListLotesOptions {
  estados?: string[]; // filtra por estado IN (...)
}

export async function listLotes(opts: ListLotesOptions = {}): Promise<FlatLote[]> {
  let q = supabase.from('lotes').select('*');
  if (opts.estados && opts.estados.length > 0) q = q.in('estado', opts.estados);
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) {
    console.error('Error cargando lotes:', error.message);
    return [];
  }
  return (data as LoteRow[]).map(rowToLote);
}

// Equivalente a onSnapshot de Firestore: carga inicial + suscripción realtime.
export function subscribeLotes(
  opts: ListLotesOptions,
  cb: (lotes: FlatLote[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  let active = true;
  const load = () => {
    listLotes(opts).then((lotes) => {
      if (active) cb(lotes);
    }).catch((err) => {
      if (active && onError) onError(err);
    });
  };
  load();
  const channel = supabase
    .channel(`lotes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Totales y mutaciones
// ---------------------------------------------------------------------------

export interface PaqueteEnLote extends PaqueteParaCambio {
  pesoTasable?: number | null;
  volumenCm3?: number | null;
  valorDeclarado?: number | null;
  precioFinal?: number | null;
}

export interface TotalesLote {
  totalPaquetes: number;
  pesoTotal: number;
  pesoTasableTotal: number;
  volumenTotalCm3: number;
  valorDeclaradoTotal: number;
  ingresosEstimados: number;
}

export function calcularTotalesLote(paquetes: PaqueteEnLote[]): TotalesLote {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    totalPaquetes: paquetes.length,
    pesoTotal: r2(paquetes.reduce((s, p) => s + (p.peso || 0), 0)),
    pesoTasableTotal: r2(paquetes.reduce((s, p) => s + (p.pesoTasable || p.peso || 0), 0)),
    volumenTotalCm3: Math.round(paquetes.reduce((s, p) => s + (p.volumenCm3 || 0), 0)),
    valorDeclaradoTotal: r2(paquetes.reduce((s, p) => s + (p.valorDeclarado || 0), 0)),
    ingresosEstimados: r2(paquetes.reduce((s, p) => s + (p.precioFinal || 0), 0)),
  };
}

export interface NuevoLoteInput {
  codigo: string;
  ruta: string;
  contenedor: string;
  oficinaOrigen: string;
  oficinaDestino: string;
  responsable: string;
  fechaEstimadaSalida: string;
  fechaEstimadaLlegada: string;
  costesEstimados: number | null;
  notas: string;
}

export async function crearLote(input: NuevoLoteInput): Promise<string> {
  const row = {
    codigo: input.codigo,
    estado: 'Abierto',
    ruta: input.ruta,
    contenedor: input.contenedor,
    oficina_origen: input.oficinaOrigen,
    oficina_destino: input.oficinaDestino,
    responsable: input.responsable,
    notas: input.notas,
    // Columnas date: '' no es válido, se convierte a null.
    fecha_estimada_salida: input.fechaEstimadaSalida || null,
    fecha_estimada_llegada: input.fechaEstimadaLlegada || null,
    costes_estimados: input.costesEstimados,
    total_paquetes: 0,
    peso_total: 0,
    peso_tasable_total: 0,
    volumen_total_cm3: 0,
    valor_declarado_total: 0,
    ingresos_estimados: 0,
    creado_por: uuidOrNull(auth.currentUser?.uid),
  };
  const { data, error } = await supabase.from('lotes').insert(row).select('id').single();
  if (error) {
    console.error('Error creando lote:', error.message);
    throw error;
  }
  const nuevoId = (data as { id: string }).id;
  await registrarAuditoria({
    accion: 'crear_lote',
    entidad: 'lote',
    entidadId: input.codigo,
    descripcion: `Lote ${input.codigo} creado (${input.ruta || 'sin ruta'})`,
  });
  return nuevoId;
}

/** Agrega paquetes a un lote: marca cada paquete y registra evento por cada uno. */
export async function agregarPaquetesALote(
  loteId: string,
  loteCodigo: string,
  paquetes: PaqueteEnLote[]
): Promise<number> {
  if (paquetes.length === 0) return 0;
  const operadorId = auth.currentUser?.uid || 'unknown';

  await Promise.all(paquetes.map(async (paquete) => {
    await updatePaquete(paquete.id, {
      loteId,
      loteCodigo,
      estado: 'Asignado a lote',
    });
    await addEvento({
      paqueteId: paquete.tracking,
      estado: 'Asignado a lote',
      estadoAnterior: paquete.estado || null,
      notas: `Paquete asignado al lote ${loteCodigo}`,
      motivo: null,
      tipoCambio: 'lote',
      operadorId,
    });
  }));

  await supabase.from('lotes').update({ updated_at: new Date().toISOString() }).eq('id', loteId);

  await registrarAuditoria({
    accion: 'agregar_a_lote',
    entidad: 'lote',
    entidadId: loteCodigo,
    descripcion: `${paquetes.length} paquete(s) agregados al lote ${loteCodigo}: ${paquetes.slice(0, 20).map(p => p.tracking).join(', ')}${paquetes.length > 20 ? '…' : ''}`,
  });
  return paquetes.length;
}

/** Quita un paquete del lote sin alterar su estado actual; queda registrado en el historial. */
export async function quitarPaqueteDeLote(loteId: string, loteCodigo: string, paquete: PaqueteEnLote): Promise<void> {
  const operadorId = auth.currentUser?.uid || 'unknown';
  const nuevoEstado = paquete.estado === 'Asignado a lote' ? 'Recepción' : paquete.estado;

  await updatePaquete(paquete.id, {
    loteId: null,
    loteCodigo: null,
    estado: nuevoEstado,
  });
  await addEvento({
    paqueteId: paquete.tracking,
    estado: nuevoEstado,
    estadoAnterior: paquete.estado || null,
    notas: `Paquete retirado del lote ${loteCodigo}`,
    motivo: null,
    tipoCambio: 'lote',
    operadorId,
  });
  await supabase.from('lotes').update({ updated_at: new Date().toISOString() }).eq('id', loteId);

  await registrarAuditoria({
    accion: 'quitar_de_lote',
    entidad: 'lote',
    entidadId: loteCodigo,
    descripcion: `Paquete ${paquete.tracking} retirado del lote ${loteCodigo}`,
  });
}

/** Persiste los totales calculados en la fila del lote. */
export async function guardarTotalesLote(loteId: string, totales: TotalesLote, costesEstimados?: number | null): Promise<void> {
  const beneficioEstimado = Math.round((totales.ingresosEstimados - (costesEstimados || 0)) * 100) / 100;
  const { error } = await supabase.from('lotes').update({
    total_paquetes: totales.totalPaquetes,
    peso_total: totales.pesoTotal,
    peso_tasable_total: totales.pesoTasableTotal,
    volumen_total_cm3: totales.volumenTotalCm3,
    valor_declarado_total: totales.valorDeclaradoTotal,
    ingresos_estimados: totales.ingresosEstimados,
    beneficio_estimado: beneficioEstimado,
    updated_at: new Date().toISOString(),
  }).eq('id', loteId);
  if (error) {
    console.error('Error guardando totales del lote:', error.message);
    throw error;
  }
}

/**
 * Cambia el estado del lote y, opcionalmente, aplica un estado a todos sus
 * paquetes (reutilizando el servicio de estados, tipoCambio 'lote').
 */
export async function cambiarEstadoLote(
  loteId: string,
  loteCodigo: string,
  nuevoEstado: EstadoLote,
  paquetes: PaqueteEnLote[],
  opciones?: { estadoPaquetes?: string; motivo?: string }
): Promise<void> {
  const ahora = new Date().toISOString();
  const update: Record<string, unknown> = {
    estado: nuevoEstado,
    updated_at: ahora,
  };
  if (nuevoEstado === 'En Tránsito') update.fecha_real_salida = ahora;
  if (nuevoEstado === 'Recibido') update.fecha_real_llegada = ahora;
  const { error } = await supabase.from('lotes').update(update).eq('id', loteId);
  if (error) {
    console.error('Error cambiando estado del lote:', error.message);
    throw error;
  }

  await registrarAuditoria({
    accion: 'cambio_estado_lote',
    entidad: 'lote',
    entidadId: loteCodigo,
    descripcion: `Lote ${loteCodigo} → ${nuevoEstado}${opciones?.estadoPaquetes ? ` (paquetes → ${opciones.estadoPaquetes})` : ''}`,
    valorNuevo: nuevoEstado,
    motivo: opciones?.motivo || null,
  });

  if (opciones?.estadoPaquetes && paquetes.length > 0) {
    await cambiarEstado(paquetes, opciones.estadoPaquetes, {
      tipoCambio: 'lote',
      motivo: opciones.motivo || `Lote ${loteCodigo} → ${nuevoEstado}`,
      nota: `Aplicado por cambio de estado del lote ${loteCodigo}`,
    });
  }
}
