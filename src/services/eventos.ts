// Reemplaza las lecturas/escrituras de la colección 'eventos' de Firestore por
// la tabla 'eventos' de Supabase (ver supabase/migrations/0001_schema.sql).
//
// IMPORTANTE sobre identificación: igual que en Firestore, la columna
// `paquete_id` guarda el TRACKING del paquete (text), no el uuid de la fila de
// 'paquetes'. Por eso los filtros y escrituras usan el tracking.
//
// IMPORTANTE sobre la columna "timestamp": en Postgres `timestamp` es palabra
// reservada y la columna está declarada entre comillas. supabase-js permite
// usar la clave `timestamp` con normalidad. Aquí se expone hacia la app como un
// objeto tipo Timestamp de Firestore ({ toDate() }) para preservar el código
// existente que llamaba a `evento.timestamp.toDate()`.

import { supabase } from '../supabase';

export interface EventoRow {
  id: string;
  paquete_id: string;
  estado: string;
  estado_anterior: string | null;
  notas: string | null;
  motivo: string | null;
  tipo_cambio: string | null;
  ubicacion: string | null;
  operador_id: string | null;
  timestamp?: string;
}

export type FlatEvento = {
  id: string;
  paqueteId: string;
  estado: string;
  estadoAnterior: string | null;
  notas: string | null;
  motivo: string | null;
  tipoCambio: string | null;
  ubicacion: string | null;
  operadorId: string | null;
  // timestamp se expone como un objeto tipo Timestamp de Firestore ({ toDate() })
  // para que el código existente que llamaba a timestamp.toDate() siga funcionando.
  timestamp?: { toDate: () => Date };
  [key: string]: unknown;
};

// Sentinels que en la app representaban "sin valor" pero que en columnas uuid FK
// deben ser null.
function uuidOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value);
  if (s === '' || s === 'unknown' || s === 'self') return null;
  return s;
}

export function rowToEvento(row: EventoRow): FlatEvento {
  const ts = row.timestamp ? { toDate: () => new Date(row.timestamp as string) } : undefined;
  return {
    id: row.id,
    paqueteId: row.paquete_id,
    estado: row.estado,
    estadoAnterior: row.estado_anterior,
    notas: row.notas,
    motivo: row.motivo,
    tipoCambio: row.tipo_cambio,
    ubicacion: row.ubicacion,
    operadorId: row.operador_id,
    timestamp: ts,
  };
}

export interface NuevoEvento {
  // paqueteId DEBE ser el tracking del paquete.
  paqueteId: string;
  estado: string;
  estadoAnterior?: string | null;
  notas?: string | null;
  motivo?: string | null;
  tipoCambio?: string | null;
  ubicacion?: string | null;
  operadorId?: string | null;
  // Si no se especifica, Postgres usa now() por defecto.
  timestamp?: Date | string | null;
}

/** Construye la fila snake_case a insertar en 'eventos' a partir de un NuevoEvento. */
export function eventoToRow(ev: NuevoEvento): Record<string, unknown> {
  const row: Record<string, unknown> = {
    paquete_id: ev.paqueteId,
    estado: ev.estado,
    estado_anterior: ev.estadoAnterior ?? null,
    notas: ev.notas ?? null,
    motivo: ev.motivo ?? null,
    tipo_cambio: ev.tipoCambio ?? null,
    ubicacion: ev.ubicacion ?? null,
    operador_id: uuidOrNull(ev.operadorId),
  };
  if (ev.timestamp !== undefined && ev.timestamp !== null) {
    row.timestamp = ev.timestamp instanceof Date ? ev.timestamp.toISOString() : ev.timestamp;
  }
  return row;
}

/** Historial de eventos de un paquete, ordenado del más reciente al más antiguo. */
export async function listEventos(tracking: string): Promise<FlatEvento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('paquete_id', tracking)
    .order('timestamp', { ascending: false });
  if (error) {
    console.error('Error cargando eventos:', error.message);
    return [];
  }
  return (data as EventoRow[]).map(rowToEvento);
}

// Equivalente a onSnapshot de Firestore: carga inicial + suscripción realtime.
export function subscribeEventos(
  tracking: string,
  cb: (eventos: FlatEvento[]) => void,
): () => void {
  let active = true;
  const load = () => {
    listEventos(tracking).then((eventos) => {
      if (active) cb(eventos);
    });
  };
  load();
  const channel = supabase
    .channel(`eventos-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/** Inserta un evento de historial. `paqueteId` debe ser el tracking del paquete. */
export async function addEvento(ev: NuevoEvento): Promise<void> {
  const { error } = await supabase.from('eventos').insert(eventoToRow(ev));
  if (error) {
    console.error('Error registrando evento:', error.message);
    throw error;
  }
}
