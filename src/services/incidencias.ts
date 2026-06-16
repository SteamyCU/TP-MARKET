// Módulo de incidencias (tabla 'incidencias' de Supabase). Cada incidencia es
// un caso de gestión (paquete dañado, extravío, retraso, reclamación...) con
// tipo, prioridad, estado, responsable asignado, resolución e historial de
// comentarios. Puede estar vinculada opcionalmente a un paquete.

import { supabase, auth } from '../supabase';
import { registrarAuditoria } from './auditoria';
import { updatePaquete } from './paquetes';

export type EstadoIncidencia = 'abierta' | 'en_proceso' | 'resuelta' | 'cerrada';
export type PrioridadIncidencia = 'baja' | 'media' | 'alta' | 'critica';

export interface ComentarioIncidencia {
  fecha: string;
  autor: string; // email del operador
  texto: string;
  tipo: 'creacion' | 'comentario' | 'estado' | 'asignacion';
}

export interface Incidencia {
  id: string;
  codigo: string;
  paqueteId: string | null;
  paqueteTracking: string | null;
  clienteNombre: string | null;
  tipo: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  titulo: string;
  descripcion: string | null;
  resolucion: string | null;
  asignadoA: string | null;
  reportadoPor: string | null;
  historial: ComentarioIncidencia[];
  createdAt: string;
  updatedAt: string;
  resueltaAt: string | null;
}

interface IncidenciaRow {
  id: string;
  codigo: string;
  paquete_id: string | null;
  paquete_tracking: string | null;
  cliente_nombre: string | null;
  tipo: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  titulo: string;
  descripcion: string | null;
  resolucion: string | null;
  asignado_a: string | null;
  reportado_por: string | null;
  historial: ComentarioIncidencia[] | null;
  created_at: string;
  updated_at: string;
  resuelta_at: string | null;
}

function rowToIncidencia(row: IncidenciaRow): Incidencia {
  return {
    id: row.id,
    codigo: row.codigo,
    paqueteId: row.paquete_id,
    paqueteTracking: row.paquete_tracking,
    clienteNombre: row.cliente_nombre,
    tipo: row.tipo,
    prioridad: row.prioridad,
    estado: row.estado,
    titulo: row.titulo,
    descripcion: row.descripcion,
    resolucion: row.resolucion,
    asignadoA: row.asignado_a,
    reportadoPor: row.reportado_por,
    historial: Array.isArray(row.historial) ? row.historial : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resueltaAt: row.resuelta_at,
  };
}

function generarCodigo(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INC-${rand}`;
}

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value || value === 'unknown' || value === 'self' || value === '') return null;
  return value;
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export async function listIncidencias(): Promise<Incidencia[]> {
  const { data, error } = await supabase
    .from('incidencias')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error cargando incidencias:', error.message);
    return [];
  }
  return (data as IncidenciaRow[]).map(rowToIncidencia);
}

// Carga inicial + suscripción realtime (equivalente a onSnapshot).
export function subscribeIncidencias(
  cb: (incidencias: Incidencia[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  let active = true;
  const load = () => {
    listIncidencias().then((incidencias) => {
      if (active) cb(incidencias);
    }).catch((err) => {
      if (active && onError) onError(err);
    });
  };
  load();
  const channel = supabase
    .channel(`incidencias-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function contarIncidenciasAbiertas(): Promise<number> {
  const { count, error } = await supabase
    .from('incidencias')
    .select('id', { count: 'exact', head: true })
    .in('estado', ['abierta', 'en_proceso']);
  if (error) {
    console.error('Error contando incidencias abiertas:', error.message);
    return 0;
  }
  return count || 0;
}

// ---------------------------------------------------------------------------
// Escrituras
// ---------------------------------------------------------------------------

export interface NuevaIncidencia {
  tipo: string;
  prioridad: PrioridadIncidencia;
  titulo: string;
  descripcion?: string;
  paqueteId?: string | null;
  paqueteTracking?: string | null;
  clienteNombre?: string | null;
  asignadoA?: string | null;
  // Si true y hay paquete vinculado, marca el paquete como 'Incidencia'.
  marcarPaquete?: boolean;
}

export async function crearIncidencia(input: NuevaIncidencia): Promise<Incidencia> {
  const autor = auth.currentUser?.email || 'sistema';
  const reportadoPor = uuidOrNull(auth.currentUser?.uid);
  const historial: ComentarioIncidencia[] = [{
    fecha: new Date().toISOString(),
    autor,
    texto: 'Incidencia creada.',
    tipo: 'creacion',
  }];

  const { data, error } = await supabase
    .from('incidencias')
    .insert({
      codigo: generarCodigo(),
      paquete_id: uuidOrNull(input.paqueteId),
      paquete_tracking: input.paqueteTracking || null,
      cliente_nombre: input.clienteNombre || null,
      tipo: input.tipo,
      prioridad: input.prioridad,
      estado: 'abierta',
      titulo: input.titulo,
      descripcion: input.descripcion || null,
      asignado_a: uuidOrNull(input.asignadoA),
      reportado_por: reportadoPor,
      historial,
    })
    .select('*')
    .single();
  if (error) throw error;

  const incidencia = rowToIncidencia(data as IncidenciaRow);

  // Opcional: reflejar la incidencia en el estado del paquete vinculado.
  if (input.marcarPaquete && input.paqueteId) {
    try {
      await updatePaquete(input.paqueteId, {
        estado: 'Incidencia',
        detallesIncidencia: `[${incidencia.codigo}] ${input.titulo}`,
      });
    } catch (err) {
      console.error('No se pudo marcar el paquete como incidencia:', err);
    }
  }

  await registrarAuditoria({
    accion: 'crear_incidencia',
    entidad: 'incidencia',
    entidadId: incidencia.codigo,
    descripcion: `Incidencia creada: ${input.titulo}`,
    valorNuevo: input.tipo,
  });

  return incidencia;
}

/**
 * Cambia el estado de gestión de una incidencia, registrando el cambio en el
 * historial. Al pasar a 'resuelta' guarda la resolución y la fecha.
 */
export async function cambiarEstadoIncidencia(
  incidencia: Incidencia,
  nuevoEstado: EstadoIncidencia,
  resolucion?: string,
): Promise<void> {
  const autor = auth.currentUser?.email || 'sistema';
  const entrada: ComentarioIncidencia = {
    fecha: new Date().toISOString(),
    autor,
    texto: resolucion
      ? `Estado: ${nuevoEstado}. ${resolucion}`
      : `Estado cambiado a ${nuevoEstado}.`,
    tipo: 'estado',
  };
  const patch: Record<string, unknown> = {
    estado: nuevoEstado,
    historial: [...incidencia.historial, entrada],
  };
  if (nuevoEstado === 'resuelta' || nuevoEstado === 'cerrada') {
    patch.resuelta_at = new Date().toISOString();
    if (resolucion) patch.resolucion = resolucion;
  } else {
    patch.resuelta_at = null;
  }

  const { error } = await supabase.from('incidencias').update(patch).eq('id', incidencia.id);
  if (error) throw error;

  await registrarAuditoria({
    accion: 'cambio_incidencia',
    entidad: 'incidencia',
    entidadId: incidencia.codigo,
    descripcion: `Incidencia ${incidencia.codigo}: ${incidencia.estado} → ${nuevoEstado}`,
    valorAnterior: incidencia.estado,
    valorNuevo: nuevoEstado,
  });
}

export async function asignarIncidencia(incidencia: Incidencia, asignadoA: string | null, nombreResponsable?: string): Promise<void> {
  const autor = auth.currentUser?.email || 'sistema';
  const entrada: ComentarioIncidencia = {
    fecha: new Date().toISOString(),
    autor,
    texto: asignadoA ? `Asignada a ${nombreResponsable || asignadoA}.` : 'Asignación retirada.',
    tipo: 'asignacion',
  };
  const { error } = await supabase
    .from('incidencias')
    .update({ asignado_a: uuidOrNull(asignadoA), historial: [...incidencia.historial, entrada] })
    .eq('id', incidencia.id);
  if (error) throw error;
}

export async function agregarComentarioIncidencia(incidencia: Incidencia, texto: string): Promise<ComentarioIncidencia> {
  const autor = auth.currentUser?.email || 'sistema';
  const entrada: ComentarioIncidencia = {
    fecha: new Date().toISOString(),
    autor,
    texto,
    tipo: 'comentario',
  };
  const { error } = await supabase
    .from('incidencias')
    .update({ historial: [...incidencia.historial, entrada] })
    .eq('id', incidencia.id);
  if (error) throw error;
  return entrada;
}

export async function actualizarPrioridadIncidencia(id: string, prioridad: PrioridadIncidencia): Promise<void> {
  const { error } = await supabase.from('incidencias').update({ prioridad }).eq('id', id);
  if (error) throw error;
}

export async function eliminarIncidencia(id: string): Promise<void> {
  const { error } = await supabase.from('incidencias').delete().eq('id', id);
  if (error) throw error;
}
