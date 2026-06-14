// Servicio de paquetes: lecturas/escrituras de la tabla 'paquetes' de Supabase
// (ver supabase/migrations/0001_schema.sql), reemplazando la colección
// 'paquetes' de Firestore. El mapeo entre el formato "plano camelCase" usado por
// el resto de la app y las columnas snake_case se hace campo a campo.
//
// IMPORTANTE sobre identificación: el identificador de negocio del paquete es el
// `tracking` (text unique). El `id` de la fila es un uuid autogenerado y es el
// que los componentes guardan como `id` (equivalente al doc.id de Firestore).
// Las tablas 'eventos' y 'pagos' referencian al paquete por su TRACKING, no por
// el uuid (igual que en Firestore). Por eso los eventos se registran con
// paqueteId = tracking.
//
import { supabase, auth } from '../supabase';
import { getSetting, setSetting } from './settings';
import { CONFIG_NEGOCIO_DEFAULT, type ConfigNegocio } from '../lib/calculos';
import { setEmpresa } from '../lib/empresa';
import { registrarAuditoria } from './auditoria';
import { addEvento } from './eventos';
import { addPago } from './pagos';
import type { EntregaPaquete, MedidasPaquete } from '../types/models';
import type { EstadoPago } from '../constants/estados';

export function generarTracking(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TP-ES-${date}-${random}`;
}

/** Lee settings/negocio y lo combina con los valores por defecto. */
export async function cargarConfigNegocio(): Promise<ConfigNegocio> {
  try {
    const data = await getSetting<Partial<ConfigNegocio>>('negocio');
    if (data) {
      const config: ConfigNegocio = {
        ...CONFIG_NEGOCIO_DEFAULT,
        ...data,
        recargosTipoEnvio: {
          ...CONFIG_NEGOCIO_DEFAULT.recargosTipoEnvio,
          ...(data.recargosTipoEnvio || {}),
        },
        empresa: {
          ...CONFIG_NEGOCIO_DEFAULT.empresa,
          ...(data.empresa || {}),
        },
      };
      setEmpresa(config.empresa, config.condicionesRecibo);
      return config;
    }
  } catch (error) {
    console.error('No se pudo cargar settings/negocio, usando valores por defecto:', error);
  }
  return CONFIG_NEGOCIO_DEFAULT;
}

/** Guarda la configuración del negocio (solo admin según las políticas RLS). */
export async function guardarConfigNegocio(config: ConfigNegocio): Promise<void> {
  await setSetting('negocio', config as unknown as Record<string, unknown>, true);
  setEmpresa(config.empresa, config.condicionesRecibo);
}

// ---------------------------------------------------------------------------
// Tipos y mapeo
// ---------------------------------------------------------------------------

export interface PaqueteRow {
  id: string;
  tracking: string;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  destinatario_id: string | null;
  destinatario_nombre: string | null;
  destinatario_direccion: string | null;
  destinatario_telefono: string | null;
  destinatario_documento: string | null;
  peso: number | null;
  origen: string | null;
  destino: string | null;
  contenido: string | null;
  descripcion: string | null;
  medidas: unknown | null;
  tipo_envio: string | null;
  volumen_cm3: number | null;
  peso_volumetrico: number | null;
  peso_tasable: number | null;
  valor_declarado: number | null;
  precio_sugerido: number | null;
  precio_final: number | null;
  precio_aplicado: number | null;
  estado: string;
  estado_pago: string;
  importe_pagado: number;
  importe_pendiente: number;
  metodo_pago: string | null;
  entrega: unknown | null;
  detalles_incidencia: string | null;
  lote_id: string | null;
  lote_codigo: string | null;
  operador_id: string | null;
  referido_por: string | null;
  partner_id: string | null;
  es_b2b: boolean;
  created_at?: string;
  updated_at?: string;
}

export type FlatPaquete = {
  id: string;
  tracking: string;
  clienteId: string | null;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  destinatarioId: string | null;
  destinatarioNombre: string | null;
  destinatarioDireccion: string | null;
  destinatarioTelefono: string | null;
  destinatarioDocumento: string | null;
  peso: number | null;
  origen: string | null;
  destino: string | null;
  contenido: string | null;
  descripcion: string | null;
  medidas: unknown | null;
  tipoEnvio: string | null;
  volumenCm3: number | null;
  pesoVolumetrico: number | null;
  pesoTasable: number | null;
  valorDeclarado: number | null;
  precioSugerido: number | null;
  precioFinal: number | null;
  precioAplicado: number | null;
  estado: string;
  estadoPago: string;
  importePagado: number;
  importePendiente: number;
  metodoPago: string | null;
  entrega: unknown | null;
  detallesIncidencia: string | null;
  loteId: string | null;
  loteCodigo: string | null;
  operadorId: string | null;
  referidoPor: string | null;
  partnerId: string | null;
  esB2B: boolean;
  // createdAt/updatedAt se exponen como objetos tipo Timestamp de Firestore
  // ({ toDate() }) para preservar el código que llamaba a .toDate().
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
  [key: string]: unknown;
};

function uuidOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value);
  if (s === '' || s === 'unknown' || s === 'self') return null;
  return s;
}

export function rowToPaquete(row: PaqueteRow): FlatPaquete {
  const createdAt = row.created_at ? { toDate: () => new Date(row.created_at as string) } : undefined;
  const updatedAt = row.updated_at ? { toDate: () => new Date(row.updated_at as string) } : undefined;
  return {
    id: row.id,
    tracking: row.tracking,
    clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre,
    clienteTelefono: row.cliente_telefono,
    destinatarioId: row.destinatario_id,
    destinatarioNombre: row.destinatario_nombre,
    destinatarioDireccion: row.destinatario_direccion,
    destinatarioTelefono: row.destinatario_telefono,
    destinatarioDocumento: row.destinatario_documento,
    peso: row.peso,
    origen: row.origen,
    destino: row.destino,
    contenido: row.contenido,
    descripcion: row.descripcion,
    medidas: row.medidas,
    tipoEnvio: row.tipo_envio,
    volumenCm3: row.volumen_cm3,
    pesoVolumetrico: row.peso_volumetrico,
    pesoTasable: row.peso_tasable,
    valorDeclarado: row.valor_declarado,
    precioSugerido: row.precio_sugerido,
    precioFinal: row.precio_final,
    precioAplicado: row.precio_aplicado,
    estado: row.estado,
    estadoPago: row.estado_pago,
    importePagado: row.importe_pagado,
    importePendiente: row.importe_pendiente,
    metodoPago: row.metodo_pago,
    entrega: row.entrega,
    detallesIncidencia: row.detalles_incidencia,
    loteId: row.lote_id,
    loteCodigo: row.lote_codigo,
    operadorId: row.operador_id,
    referidoPor: row.referido_por,
    partnerId: row.partner_id,
    esB2B: row.es_b2b,
    createdAt,
    updatedAt,
  };
}

// Mapeo de claves planas camelCase → columnas snake_case. Las columnas uuid FK
// (cliente_id, destinatario_id, lote_id, operador_id, referido_por, partner_id)
// pasan por uuidOrNull para convertir sentinels '' / 'unknown' / 'self' a null.
const UUID_COLUMNS = new Set([
  'cliente_id', 'destinatario_id', 'lote_id', 'operador_id', 'referido_por', 'partner_id',
]);

const FIELD_MAP: Record<string, string> = {
  tracking: 'tracking',
  clienteId: 'cliente_id',
  clienteNombre: 'cliente_nombre',
  clienteTelefono: 'cliente_telefono',
  destinatarioId: 'destinatario_id',
  destinatarioNombre: 'destinatario_nombre',
  destinatarioDireccion: 'destinatario_direccion',
  destinatarioTelefono: 'destinatario_telefono',
  destinatarioDocumento: 'destinatario_documento',
  peso: 'peso',
  origen: 'origen',
  destino: 'destino',
  contenido: 'contenido',
  descripcion: 'descripcion',
  medidas: 'medidas',
  tipoEnvio: 'tipo_envio',
  volumenCm3: 'volumen_cm3',
  pesoVolumetrico: 'peso_volumetrico',
  pesoTasable: 'peso_tasable',
  valorDeclarado: 'valor_declarado',
  precioSugerido: 'precio_sugerido',
  precioFinal: 'precio_final',
  precioAplicado: 'precio_aplicado',
  estado: 'estado',
  estadoPago: 'estado_pago',
  importePagado: 'importe_pagado',
  importePendiente: 'importe_pendiente',
  metodoPago: 'metodo_pago',
  entrega: 'entrega',
  detallesIncidencia: 'detalles_incidencia',
  loteId: 'lote_id',
  loteCodigo: 'lote_codigo',
  operadorId: 'operador_id',
  referidoPor: 'referido_por',
  partnerId: 'partner_id',
  esB2B: 'es_b2b',
};

function flatFieldsToColumns(fields: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(FIELD_MAP)) {
    if (fields[key] !== undefined) {
      patch[column] = UUID_COLUMNS.has(column) ? uuidOrNull(fields[key]) : fields[key];
    }
  }
  return patch;
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export interface ListPaquetesOptions {
  estado?: string;
  clienteId?: string;
  partnerId?: string;
  referidoPor?: string;
  loteId?: string;
  destino?: string;
  conDeuda?: boolean; // importe_pendiente > 0
  limit?: number;
}

function applyFilters(opts: ListPaquetesOptions) {
  let q = supabase.from('paquetes').select('*');
  if (opts.estado) q = q.eq('estado', opts.estado);
  if (opts.clienteId) q = q.eq('cliente_id', opts.clienteId);
  if (opts.partnerId) q = q.eq('partner_id', opts.partnerId);
  if (opts.referidoPor) q = q.eq('referido_por', opts.referidoPor);
  if (opts.loteId) q = q.eq('lote_id', opts.loteId);
  if (opts.destino) q = q.eq('destino', opts.destino);
  if (opts.conDeuda) q = q.gt('importe_pendiente', 0);
  q = q.order('created_at', { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  return q;
}

export async function listPaquetes(opts: ListPaquetesOptions = {}): Promise<FlatPaquete[]> {
  const { data, error } = await applyFilters(opts);
  if (error) {
    console.error('Error cargando paquetes:', error.message);
    return [];
  }
  return (data as PaqueteRow[]).map(rowToPaquete);
}

// Equivalente a onSnapshot de Firestore: carga inicial + suscripción realtime.
export function subscribePaquetes(
  opts: ListPaquetesOptions,
  cb: (paquetes: FlatPaquete[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  let active = true;
  const load = () => {
    listPaquetes(opts).then((paquetes) => {
      if (active) cb(paquetes);
    }).catch((err) => {
      if (active && onError) onError(err);
    });
  };
  load();
  const channel = supabase
    .channel(`paquetes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'paquetes' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function getPaqueteByTracking(tracking: string): Promise<FlatPaquete | null> {
  const { data, error } = await supabase.from('paquetes').select('*').eq('tracking', tracking).maybeSingle();
  if (error || !data) return null;
  return rowToPaquete(data as PaqueteRow);
}

export async function getPaquete(id: string): Promise<FlatPaquete | null> {
  const { data, error } = await supabase.from('paquetes').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToPaquete(data as PaqueteRow);
}

/** Actualiza un paquete por su uuid (el `id` que los componentes guardan). */
export async function updatePaquete(id: string, fields: Record<string, unknown>): Promise<void> {
  const patch = flatFieldsToColumns(fields);
  patch.updated_at = new Date().toISOString();
  const { error } = await supabase.from('paquetes').update(patch).eq('id', id);
  if (error) throw error;
}

/** Actualiza un paquete localizándolo por su tracking. */
export async function updatePaqueteByTracking(tracking: string, fields: Record<string, unknown>): Promise<void> {
  const patch = flatFieldsToColumns(fields);
  patch.updated_at = new Date().toISOString();
  const { error } = await supabase.from('paquetes').update(patch).eq('tracking', tracking);
  if (error) throw error;
}

export async function deletePaquete(id: string): Promise<void> {
  const { error } = await supabase.from('paquetes').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Creación de paquete
// ---------------------------------------------------------------------------

export interface NuevoPaqueteInput {
  tracking: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  destinatarioId: string;
  destinatarioNombre: string;
  destinatarioDireccion: string;
  destinatarioTelefono: string;
  destinatarioDocumento: string;
  peso: number;
  origen: string;
  destino: string;
  contenido: string;
  medidas: MedidasPaquete;
  estado: string;
  detallesIncidencia: string | null;
  fechaRegistro: Date;
  partnerId: string | null;
  precioAplicado: number | null;
  // Campos Fase 1
  tipoEnvio: string;
  descripcion: string;
  volumenCm3: number | null;
  pesoVolumetrico: number | null;
  pesoTasable: number | null;
  valorDeclarado: number | null;
  precioSugerido: number | null;
  precioFinal: number | null;
  estadoPago: EstadoPago;
  importePagado: number;
  metodoPago: string;
  entrega: EntregaPaquete;
}

export async function crearPaquete(input: NuevoPaqueteInput): Promise<string> {
  const operadorId = auth.currentUser?.uid || 'unknown';
  const precioFinal = input.precioFinal ?? input.precioSugerido ?? null;
  const importePagado = input.estadoPago === 'Pagado'
    ? (precioFinal ?? input.importePagado)
    : input.estadoPago === 'Pendiente' ? 0 : input.importePagado;
  const importePendiente = precioFinal !== null
    ? Math.max(Math.round((precioFinal - importePagado) * 100) / 100, 0)
    : 0;

  const detallesIncidencia = input.estado === 'Incidencia' ? input.detallesIncidencia : null;

  const row = flatFieldsToColumns({
    tracking: input.tracking,
    clienteId: input.clienteId,
    clienteNombre: input.clienteNombre,
    clienteTelefono: input.clienteTelefono,
    destinatarioId: input.destinatarioId,
    destinatarioNombre: input.destinatarioNombre,
    destinatarioDireccion: input.destinatarioDireccion,
    destinatarioTelefono: input.destinatarioTelefono,
    destinatarioDocumento: input.destinatarioDocumento,
    peso: input.peso,
    origen: input.origen,
    destino: input.destino,
    contenido: input.contenido,
    medidas: input.medidas,
    estado: input.estado,
    detallesIncidencia,
    operadorId,
    referidoPor: operadorId,
    partnerId: input.partnerId,
    precioAplicado: input.precioAplicado,
    esB2B: !!input.partnerId,
    tipoEnvio: input.tipoEnvio,
    descripcion: input.descripcion,
    volumenCm3: input.volumenCm3,
    pesoVolumetrico: input.pesoVolumetrico,
    pesoTasable: input.pesoTasable,
    valorDeclarado: input.valorDeclarado,
    precioSugerido: input.precioSugerido,
    precioFinal,
    estadoPago: input.estadoPago,
    importePagado,
    importePendiente,
    metodoPago: input.metodoPago,
    entrega: input.entrega,
  });
  row.created_at = input.fechaRegistro.toISOString();
  row.updated_at = input.fechaRegistro.toISOString();

  const { data: created, error } = await supabase.from('paquetes').insert(row).select('id').single();
  if (error) {
    console.error('Error creando paquete:', error.message);
    throw error;
  }
  const nuevoId = (created as { id: string }).id;

  // Pago inicial (tabla 'pagos' en Supabase, paqueteId = tracking).
  if (importePagado > 0) {
    await addPago({
      paqueteId: input.tracking,
      monto: importePagado,
      metodo: input.metodoPago,
      estado: input.estadoPago === 'Parcial' ? 'Pagado' : input.estadoPago,
      fecha: input.fechaRegistro,
      agenteId: operadorId,
    });
  }

  // Evento inicial de historial (tabla 'eventos' en Supabase, paqueteId = tracking).
  await addEvento({
    paqueteId: input.tracking,
    estado: input.estado,
    notas: input.estado === 'Incidencia'
      ? `Paquete recibido con incidencia: ${input.detallesIncidencia || ''}`
      : 'Paquete recibido en oficina',
    timestamp: input.fechaRegistro,
    operadorId,
  });

  await registrarAuditoria({
    accion: 'crear_paquete',
    entidad: 'paquete',
    entidadId: input.tracking,
    descripcion: `Paquete registrado para ${input.clienteNombre} → ${input.destinatarioNombre} (${input.destino})`,
    valorNuevo: `precio ${precioFinal ?? '—'} € · pagado ${importePagado} € · pago ${input.estadoPago}`,
  });

  return nuevoId;
}
