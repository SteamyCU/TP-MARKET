// Solicitudes de contacto de los programas de negocio (Partner, Franquicia y
// Punto de Entrega), enviadas desde los formularios públicos y guardadas en la
// tabla `contactos_partners` de Supabase. El campo `tipo_solicitud` distingue
// el modelo y `datos` guarda las preguntas específicas de cada formulario.

import { supabase } from '../supabase';

export type TipoSolicitud = 'partner' | 'franquicia' | 'punto_de_entrega';

export interface NuevoContactoPartner {
  nombre: string;
  empresa?: string | null;
  email: string;
  telefono: string;
  ciudad?: string;
  tipo_negocio?: string;
  volumen_estimado?: string;
  tiene_local?: boolean | null;
  mensaje?: string;
  tipo_solicitud?: TipoSolicitud;
  datos?: Record<string, unknown>;
}

export async function crearContactoPartner(input: NuevoContactoPartner): Promise<void> {
  const { error } = await supabase.from('contactos_partners').insert({
    nombre: input.nombre,
    empresa: input.empresa ?? null,
    email: input.email,
    telefono: input.telefono,
    ciudad: input.ciudad ?? null,
    tipo_negocio: input.tipo_negocio ?? null,
    volumen_estimado: input.volumen_estimado ?? null,
    tiene_local: input.tiene_local ?? null,
    mensaje: input.mensaje ?? null,
    tipo_solicitud: input.tipo_solicitud ?? 'partner',
    datos: input.datos ?? {},
  });
  if (error) throw error;
}
