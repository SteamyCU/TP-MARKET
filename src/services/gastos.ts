// Servicio de gastos operativos: reemplaza las lecturas/escrituras de la
// colección 'gastos' de Firestore por la tabla 'gastos' de Supabase (ver
// supabase/migrations/0001_schema.sql). Costes por lote, ruta o categoría para
// calcular el beneficio real del negocio.
//
// Notas de mapeo:
// - `lote_id` es el uuid de la fila del lote; `lote_codigo` es el código legible
//   (se conservan ambos como hacía el código Firestore).
// - `fecha` es columna `date`; Postgres acepta el string 'YYYY-MM-DD' del form.
// - createdAt/fecha se exponen como objetos tipo Timestamp de Firestore
//   ({ toDate() }) para preservar el código que llamaba a .toDate() / toDateSafe.

import { supabase, auth } from '../supabase';
import { registrarAuditoria } from './auditoria';

function uuidOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value);
  if (s === '' || s === 'unknown' || s === 'self') return null;
  return s;
}

export interface GastoRow {
  id: string;
  concepto: string;
  categoria: string | null;
  monto: number;
  fecha: string;
  lote_id: string | null;
  lote_codigo: string | null;
  ruta: string | null;
  notas: string | null;
  creado_por: string | null;
  created_at?: string;
}

export type FlatGasto = {
  id: string;
  concepto: string;
  categoria: string | null;
  monto: number;
  // fecha se expone como objeto tipo Timestamp de Firestore ({ toDate() }).
  fecha?: { toDate: () => Date };
  loteId: string | null;
  loteCodigo: string | null;
  ruta: string | null;
  notas: string | null;
  creadoPor: string | null;
  createdAt?: { toDate: () => Date };
  [key: string]: unknown;
};

export function rowToGasto(row: GastoRow): FlatGasto {
  const ts = (v: string | null | undefined) => (v ? { toDate: () => new Date(v) } : undefined);
  return {
    id: row.id,
    concepto: row.concepto,
    categoria: row.categoria,
    monto: row.monto,
    fecha: ts(row.fecha),
    loteId: row.lote_id,
    loteCodigo: row.lote_codigo,
    ruta: row.ruta,
    notas: row.notas,
    creadoPor: row.creado_por,
    createdAt: ts(row.created_at),
  };
}

export async function listGastos(): Promise<FlatGasto[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) {
    console.error('Error cargando gastos:', error.message);
    return [];
  }
  return (data as GastoRow[]).map(rowToGasto);
}

// Equivalente a onSnapshot de Firestore: carga inicial + suscripción realtime.
export function subscribeGastos(
  cb: (gastos: FlatGasto[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  let active = true;
  const load = () => {
    listGastos().then((gastos) => {
      if (active) cb(gastos);
    }).catch((err) => {
      if (active && onError) onError(err);
    });
  };
  load();
  const channel = supabase
    .channel(`gastos-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export interface NuevoGastoInput {
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  loteId: string | null;
  loteCodigo: string | null;
  ruta: string;
  notas: string;
}

export async function registrarGasto(input: NuevoGastoInput): Promise<string> {
  const row = {
    concepto: input.concepto,
    categoria: input.categoria,
    monto: input.monto,
    // Columna date: acepta el string 'YYYY-MM-DD' directamente.
    fecha: input.fecha,
    lote_id: uuidOrNull(input.loteId),
    lote_codigo: input.loteCodigo,
    ruta: input.ruta,
    notas: input.notas,
    creado_por: uuidOrNull(auth.currentUser?.uid),
  };
  const { data, error } = await supabase.from('gastos').insert(row).select('id').single();
  if (error) {
    console.error('Error registrando gasto:', error.message);
    throw error;
  }
  const nuevoId = (data as { id: string }).id;
  await registrarAuditoria({
    accion: 'crear_gasto',
    entidad: 'gasto',
    entidadId: input.concepto,
    descripcion: `Gasto "${input.concepto}" (${input.categoria})${input.loteCodigo ? ` · lote ${input.loteCodigo}` : ''}`,
    valorNuevo: `${input.monto.toFixed(2)} €`,
  });
  return nuevoId;
}

export async function eliminarGasto(gastoId: string, descripcion?: string): Promise<void> {
  const { error } = await supabase.from('gastos').delete().eq('id', gastoId);
  if (error) {
    console.error('Error eliminando gasto:', error.message);
    throw error;
  }
  await registrarAuditoria({
    accion: 'eliminar_gasto',
    entidad: 'gasto',
    entidadId: gastoId,
    descripcion: `Gasto eliminado${descripcion ? `: ${descripcion}` : ''}`,
  });
}
