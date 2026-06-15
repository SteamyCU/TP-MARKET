// Solicitudes de contacto del programa Partner Logístico, enviadas desde el
// formulario público de /ser-partner y guardadas en la tabla
// `contactos_partners` de Supabase.

import { supabase } from '../supabase';

export interface NuevoContactoPartner {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  tipo_negocio?: string;
  volumen_estimado?: string;
  tiene_local?: boolean | null;
  mensaje?: string;
}

export async function crearContactoPartner(input: NuevoContactoPartner): Promise<void> {
  const { error } = await supabase.from('contactos_partners').insert({
    nombre: input.nombre,
    empresa: input.empresa,
    email: input.email,
    telefono: input.telefono,
    tipo_negocio: input.tipo_negocio ?? null,
    volumen_estimado: input.volumen_estimado ?? null,
    tiene_local: input.tiene_local ?? null,
    mensaje: input.mensaje ?? null,
    tipo_solicitud: 'partner',
  });
  if (error) throw error;
}
