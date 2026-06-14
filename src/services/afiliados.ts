// Reemplaza la colección 'solicitudesAfiliado' de Firestore (alta de
// agente/influencer) por la tabla 'solicitudes_afiliado' de Supabase, y la
// lógica de validación de códigos de referido que antes consultaba la colección
// 'influencers' (ahora son perfiles con role='influencer' y extra.codigoReferido).

import { supabase } from '../supabase';
import { listProfiles, getProfile, updateProfileFields } from './profiles';

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
  activo: boolean;
  beneficio: BeneficioReferido;
}

/**
 * Busca el influencer dueño de un código de referido. Antes consultaba la
 * colección 'influencers' por el campo 'codigo'; ahora busca perfiles con
 * extra.codigoReferido == code. Devuelve null si no existe.
 */
export async function buscarInfluencerPorCodigo(code: string): Promise<InfluencerReferidor | null> {
  const perfiles = await listProfiles({ extraKey: 'codigoReferido', extraValue: code.toUpperCase() });
  const influencer = perfiles[0];
  if (!influencer) return null;
  return {
    id: influencer.id,
    activo: influencer.activo !== false,
    beneficio: (influencer.beneficio as BeneficioReferido) || { tipo: 'descuento', valor: 5 },
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
