// Reemplaza la colección 'solicitudesAfiliado' de Firestore (alta de
// agente/influencer) por la tabla 'solicitudes_afiliado' de Supabase, y la
// lógica de validación de códigos de referido que antes consultaba la colección
// 'influencers' (ahora son perfiles con role='influencer' y extra.codigoReferido).

import { supabase } from '../supabase';
import { getProfile, updateProfileFields } from './profiles';
import { buscarCupon } from './cupones';

export interface NuevaSolicitudAfiliado {
  uid: string;
  email: string | null;
  role: string;
  nombre: string;
  telefono: string;
  // Resto de campos variables del formulario (pais, ciudad, zonaCobertura,
  // experiencia, redSocialPrincipal, usuarioRedSocial, linkPerfil, seguidores,
  // comunidadRelacionada, referidor...). Se guardan en la columna 'datos'.
  datos: Record<string, unknown>;
}

export async function crearSolicitudAfiliado(input: NuevaSolicitudAfiliado): Promise<void> {
  const { error } = await supabase.from('solicitudes_afiliado').insert({
    uid: input.uid,
    email: input.email,
    nombre: input.nombre,
    telefono: input.telefono,
    role_solicitado: input.role,
    status: 'pendiente',
    datos: input.datos,
  });
  if (error) throw error;
}

// --------------------- LECTURA Y GESTIÓN (admin) ---------------------------

export type StatusSolicitudAfiliado = 'pendiente' | 'aprobado' | 'rechazado';

export interface SolicitudAfiliado {
  id: string;
  uid: string | null;
  email: string | null;
  nombre: string | null;
  telefono: string | null;
  role_solicitado: string;
  status: StatusSolicitudAfiliado;
  datos: Record<string, unknown>;
  created_at: string;
}

export async function getSolicitudesAfiliado(): Promise<SolicitudAfiliado[]> {
  const { data, error } = await supabase
    .from('solicitudes_afiliado')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SolicitudAfiliado[];
}

export async function contarSolicitudesAfiliadoPendientes(): Promise<number> {
  const { count, error } = await supabase
    .from('solicitudes_afiliado')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendiente');
  if (error) throw error;
  return count || 0;
}

async function enviarNotificacionSolicitud(
  email: string,
  nombre: string,
  resultado: 'aprobado' | 'rechazado',
  rolSolicitado: string,
  motivoRechazo?: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('notificar-solicitud', {
    body: { email, nombre, resultado, rolSolicitado, motivoRechazo },
  });
  if (error) console.error('Error enviando notificación de solicitud:', error.message);
  // No relanzar: si falla el correo la aprobación ya se hizo y no debe bloquearse.
}

/**
 * Aprueba una solicitud: promueve el perfil del solicitante al rol pedido
 * (agente/influencer), copia sus datos del formulario al perfil y marca la
 * solicitud como 'aprobado'. Requiere que el solicitante tenga un perfil (uid).
 */
export async function aprobarSolicitudAfiliado(solicitud: SolicitudAfiliado): Promise<void> {
  if (!solicitud.uid) {
    throw new Error('La solicitud no tiene un usuario vinculado.');
  }
  const { nombre, telefono, role_solicitado, datos } = solicitud;
  await updateProfileFields(solicitud.uid, {
    role: role_solicitado,
    ...(nombre ? { name: nombre } : {}),
    ...(telefono ? { telefono } : {}),
    ...datos,
  });
  const { error } = await supabase
    .from('solicitudes_afiliado')
    .update({ status: 'aprobado' })
    .eq('id', solicitud.id);
  if (error) throw error;

  if (solicitud.email) {
    await enviarNotificacionSolicitud(
      solicitud.email,
      solicitud.nombre || solicitud.email,
      'aprobado',
      role_solicitado,
    );
  }
}

export async function rechazarSolicitudAfiliado(solicitud: SolicitudAfiliado, motivo?: string): Promise<void> {
  const datos = motivo
    ? { ...solicitud.datos, motivo_rechazo: motivo }
    : solicitud.datos;
  const { error } = await supabase
    .from('solicitudes_afiliado')
    .update({ status: 'rechazado', datos })
    .eq('id', solicitud.id);
  if (error) throw error;

  if (solicitud.email) {
    await enviarNotificacionSolicitud(
      solicitud.email,
      solicitud.nombre || solicitud.email,
      'rechazado',
      solicitud.role_solicitado,
      motivo,
    );
  }
}

/**
 * Devuelve una solicitud aprobada o rechazada al estado 'pendiente' para que
 * el admin pueda revisarla de nuevo (Revocar / Revisar de nuevo).
 */
export async function volverAPendienteSolicitudAfiliado(id: string): Promise<void> {
  const { error } = await supabase
    .from('solicitudes_afiliado')
    .update({ status: 'pendiente' })
    .eq('id', id);
  if (error) throw error;
}

/**
 * URL temporal firmada para ver el documento de identidad subido por un
 * solicitante de Agente (bucket privado). Devuelve null si no hay documento.
 */
export async function getUrlDocumentoIdentidad(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('documentos-identidad')
    .createSignedUrl(path, 60 * 10);
  if (error) {
    console.error('Error firmando documento de identidad:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}


/**
 * Sube el documento de identidad (ID/Pasaporte) de un solicitante de Agente al
 * bucket privado 'documentos-identidad', dentro de la carpeta del propio usuario
 * (uid). Devuelve la ruta interna del archivo para guardarla en 'datos.documentoIdentidad'.
 */
export async function subirDocumentoIdentidad(uid: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${uid}/documento-identidad-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('documentos-identidad').upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  return path;
}

// --------------------------- REFERIDOS / INFLUENCERS -----------------------

export interface BeneficioReferido {
  tipo: string;
  valor: number;
}

export interface InfluencerReferidor {
  id: string;
  tipo: 'influencer' | 'general';
  activo: boolean;
  beneficio: BeneficioReferido;
}

/**
 * Busca el cupón por código y lo adapta al formato InfluencerReferidor que
 * usa ProfileCompletion para mostrar el beneficio y registrar el referido.
 * Devuelve null si el código no existe, está inactivo, vencido o agotado.
 */
export async function buscarInfluencerPorCodigo(code: string): Promise<InfluencerReferidor | null> {
  const cupon = await buscarCupon(code);
  if (!cupon) return null;
  return {
    id: cupon.influencer_id || '',
    tipo: cupon.tipo,
    activo: true,
    beneficio: {
      tipo: cupon.descuento_tipo === 'porcentaje' ? 'descuento' : 'fijo',
      valor: cupon.descuento_valor,
    },
  };
}

/**
 * Registra un nuevo referido para el influencer: incrementa su contador
 * totalReferidos (en extra) e inserta una fila en la tabla 'referidos'.
 */
export async function registrarReferido(influencerId: string, clienteUid: string | null): Promise<void> {
  const perfil = await getProfile(influencerId);
  const totalActual = (perfil?.totalReferidos as number) || 0;
  await updateProfileFields(influencerId, { totalReferidos: totalActual + 1 });
  const { error } = await supabase.from('referidos').insert({
    influencer_id: influencerId,
    referido_id: clienteUid,
    datos: { estado: 'registrado' },
  });
  if (error) throw error;
}
