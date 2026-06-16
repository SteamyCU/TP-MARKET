// Registro de auditoría (tabla 'auditoria' de Supabase): traza inmutable de las
// acciones importantes del negocio. registrarAuditoria nunca lanza errores
// para no interrumpir la operación principal que está auditando.

import { supabase } from '../supabase';
import { auth } from '../supabase';

export type AccionAuditoria =
  | 'crear_paquete'
  | 'cambio_estado'
  | 'cobro'
  | 'crear_gasto'
  | 'eliminar_gasto'
  | 'crear_lote'
  | 'agregar_a_lote'
  | 'quitar_de_lote'
  | 'cambio_estado_lote'
  | 'cambio_solicitud'
  | 'cambio_etiquetas_cliente'
  | 'cambio_datos_cliente'
  | 'crear_incidencia'
  | 'cambio_incidencia'
  | 'importacion';

export interface EntradaAuditoria {
  accion: AccionAuditoria;
  /** Tipo de entidad afectada: paquete, lote, cliente, gasto, solicitud... */
  entidad: string;
  /** Identificador legible (tracking, código de lote, nombre...) */
  entidadId: string;
  descripcion: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  motivo?: string | null;
}

// Convierte el sentinel 'unknown' (usuario sin sesión) en null, ya que la
// columna 'usuario' es uuid con FK a profiles.
function uuidOrNull(value: string | null | undefined): string | null {
  if (!value || value === 'unknown' || value === 'self' || value === '') return null;
  return value;
}

export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  try {
    const { error } = await supabase.from('auditoria').insert({
      accion: entrada.accion,
      entidad: entrada.entidad,
      entidad_id: entrada.entidadId.slice(0, 200),
      descripcion: entrada.descripcion.slice(0, 500),
      valor_anterior: entrada.valorAnterior?.slice(0, 500) ?? null,
      valor_nuevo: entrada.valorNuevo?.slice(0, 500) ?? null,
      motivo: entrada.motivo?.slice(0, 500) ?? null,
      usuario: uuidOrNull(auth.currentUser?.uid),
      usuario_email: auth.currentUser?.email || '',
    });
    if (error) throw error;
  } catch (error) {
    // La auditoría nunca debe romper la operación que la origina
    console.error('No se pudo registrar la entrada de auditoría:', error);
  }
}

export interface FlatAuditoria {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  descripcion: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  motivo?: string | null;
  usuario: string | null;
  usuarioEmail?: string;
  // fecha se expone como objeto tipo Timestamp de Firestore ({ toDate(), toMillis() })
  // para preservar las llamadas .toDate()/.toMillis() de los componentes.
  fecha?: { toDate: () => Date; toMillis: () => number };
}

interface AuditoriaRow {
  id: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  descripcion: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  motivo: string | null;
  usuario: string | null;
  usuario_email: string | null;
  fecha: string;
}

function rowToAuditoria(row: AuditoriaRow): FlatAuditoria {
  const fecha = row.fecha
    ? { toDate: () => new Date(row.fecha), toMillis: () => new Date(row.fecha).getTime() }
    : undefined;
  return {
    id: row.id,
    accion: row.accion,
    entidad: row.entidad,
    entidadId: row.entidad_id,
    descripcion: row.descripcion,
    valorAnterior: row.valor_anterior,
    valorNuevo: row.valor_nuevo,
    motivo: row.motivo,
    usuario: row.usuario,
    usuarioEmail: row.usuario_email || '',
    fecha,
  };
}

// Equivalente a onSnapshot ordenado por fecha desc con límite. Carga inicial +
// canal realtime sobre la tabla 'auditoria'.
export function subscribeAuditoria(
  cb: (entradas: FlatAuditoria[]) => void,
  opts: { limit?: number } = {},
): () => void {
  let active = true;
  const load = () => {
    let q = supabase.from('auditoria').select('*').order('fecha', { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    q.then(({ data, error }) => {
      if (error) {
        console.error('Error cargando auditoría:', error.message);
        return;
      }
      if (active) cb((data as AuditoriaRow[]).map(rowToAuditoria));
    });
  };
  load();
  const channel = supabase
    .channel(`auditoria-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'auditoria' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
