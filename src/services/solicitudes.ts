// Servicio de solicitudes de envío del portal cliente (tabla 'solicitudes' de
// Supabase). El cliente crea solicitudes; el equipo interno las revisa y las
// convierte en paquetes reutilizando el flujo de Recepción.

import { supabase } from '../supabase';
import { auth } from '../supabase';
import { registrarAuditoria } from './auditoria';
import { getClienteByEmail, createCliente } from './clientes';

/**
 * Busca el cliente de Supabase vinculado al usuario por email y lo crea si no
 * existe (mismo patrón que usa MisDestinatarios).
 */
export async function obtenerOCrearClienteDoc(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user?.email) return null;
  const existente = await getClienteByEmail(user.email);
  if (existente) return existente.id;
  const nuevo = await createCliente({
    nombre: user.displayName || user.email,
    documentoIdentidad: '',
    telefonoEspana: '',
    email: user.email,
    direccion: '',
    localidad: '',
    codigoPostal: '',
    agenteId: null,
  });
  return nuevo.id;
}

export interface NuevaSolicitudInput {
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  destinatarioId: string;
  destinatarioNombre: string;
  destinatarioProvincia: string;
  contenido: string;
  tipoEnvio: string;
  pesoEstimado: number | null;
  observaciones: string;
}

interface SolicitudRow {
  id: string;
  cliente_uid: string | null;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  destinatario_id: string | null;
  destinatario_nombre: string | null;
  destinatario_provincia: string | null;
  contenido: string | null;
  tipo_envio: string | null;
  peso_estimado: number | null;
  observaciones: string | null;
  estado: string;
  nota_interna: string | null;
  nota_para_cliente: string | null;
  tracking: string | null;
  created_at?: string;
  updated_at?: string;
}

export type FlatSolicitud = {
  id: string;
  clienteUid: string | null;
  clienteId: string | null;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono?: string;
  destinatarioId: string | null;
  destinatarioNombre: string;
  destinatarioProvincia?: string;
  contenido: string;
  tipoEnvio: string;
  pesoEstimado?: number | null;
  observaciones?: string;
  estado: string;
  notaInterna?: string;
  notaParaCliente?: string;
  tracking?: string | null;
  // createdAt se expone como un objeto tipo Timestamp de Firestore
  // ({ toDate(), toMillis() }) para preservar las llamadas existentes.
  createdAt?: { toDate: () => Date; toMillis: () => number };
};

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value || value === 'unknown' || value === 'self' || value === '') return null;
  return value;
}

function rowToSolicitud(row: SolicitudRow): FlatSolicitud {
  const createdAt = row.created_at
    ? { toDate: () => new Date(row.created_at as string), toMillis: () => new Date(row.created_at as string).getTime() }
    : undefined;
  return {
    id: row.id,
    clienteUid: row.cliente_uid,
    clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre || '',
    clienteEmail: row.cliente_email || '',
    clienteTelefono: row.cliente_telefono || '',
    destinatarioId: row.destinatario_id,
    destinatarioNombre: row.destinatario_nombre || '',
    destinatarioProvincia: row.destinatario_provincia || '',
    contenido: row.contenido || '',
    tipoEnvio: row.tipo_envio || '',
    pesoEstimado: row.peso_estimado,
    observaciones: row.observaciones || '',
    estado: row.estado,
    notaInterna: row.nota_interna || '',
    notaParaCliente: row.nota_para_cliente || '',
    tracking: row.tracking,
    createdAt,
  };
}

export interface ListSolicitudesOptions {
  clienteUid?: string;
}

// Equivalente a onSnapshot: carga inicial + canal realtime sobre 'solicitudes'.
// Las entradas vienen ordenadas por fecha de creación descendente.
export function subscribeSolicitudes(
  opts: ListSolicitudesOptions,
  cb: (solicitudes: FlatSolicitud[]) => void,
): () => void {
  let active = true;
  const load = () => {
    let q = supabase.from('solicitudes').select('*').order('created_at', { ascending: false });
    if (opts.clienteUid) q = q.eq('cliente_uid', opts.clienteUid);
    q.then(({ data, error }) => {
      if (error) {
        console.error('Error cargando solicitudes:', error.message);
        return;
      }
      if (active) cb((data as SolicitudRow[]).map(rowToSolicitud));
    });
  };
  load();
  const channel = supabase
    .channel(`solicitudes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function crearSolicitud(input: NuevaSolicitudInput): Promise<string> {
  const { data, error } = await supabase.from('solicitudes').insert({
    cliente_uid: uuidOrNull(auth.currentUser?.uid),
    cliente_id: uuidOrNull(input.clienteId),
    cliente_nombre: input.clienteNombre,
    cliente_email: input.clienteEmail,
    cliente_telefono: input.clienteTelefono,
    destinatario_id: uuidOrNull(input.destinatarioId),
    destinatario_nombre: input.destinatarioNombre,
    destinatario_provincia: input.destinatarioProvincia,
    contenido: input.contenido,
    tipo_envio: input.tipoEnvio,
    peso_estimado: input.pesoEstimado,
    observaciones: input.observaciones,
    estado: 'Nueva',
    nota_interna: '',
    nota_para_cliente: '',
    tracking: null,
  }).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function actualizarEstadoSolicitud(
  solicitudId: string,
  estado: string,
  extra?: { notaInterna?: string; notaParaCliente?: string }
): Promise<void> {
  const patch: Record<string, unknown> = { estado };
  if (extra?.notaInterna !== undefined) patch.nota_interna = extra.notaInterna;
  if (extra?.notaParaCliente !== undefined) patch.nota_para_cliente = extra.notaParaCliente;
  const { error } = await supabase.from('solicitudes').update(patch).eq('id', solicitudId);
  if (error) throw error;
  await registrarAuditoria({
    accion: 'cambio_solicitud',
    entidad: 'solicitud',
    entidadId: solicitudId,
    descripcion: `Solicitud actualizada a "${estado}"`,
    valorNuevo: estado,
    motivo: extra?.notaParaCliente || null,
  });
}

/** Marca la solicitud como convertida y enlaza el tracking del paquete creado. */
export async function marcarSolicitudConvertida(solicitudId: string, tracking: string): Promise<void> {
  const { error } = await supabase.from('solicitudes').update({
    estado: 'Convertida en paquete',
    tracking,
  }).eq('id', solicitudId);
  if (error) throw error;
}
