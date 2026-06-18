// Bandeja de notificaciones in-app (campanita del Topbar). Cada usuario solo ve
// y gestiona las suyas (RLS por user_id = auth.uid()). La creación de
// notificaciones para OTRO usuario (matching de viajeros) la hace la Edge
// Function `notificar-match-express` con la service role key.

import { supabase } from '../supabase';

export interface Notificacion {
  id: string;
  user_id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  link: string | null;
  leida: boolean;
  created_at: string;
}

/** Crea una notificación (uso same-user / admin; el cross-user va por Edge Function). */
export async function crearNotificacion(
  userId: string,
  titulo: string,
  mensaje: string,
  tipo: string = 'general',
  link?: string,
): Promise<void> {
  const { error } = await supabase.from('notificaciones').insert({
    user_id: userId,
    titulo,
    mensaje,
    tipo,
    link: link ?? null,
  });
  if (error) throw error;
}

/** Últimas notificaciones del usuario, más recientes primero. */
export async function getNotificacionesUsuario(userId: string, limit = 10): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Error cargando notificaciones:', error.message);
    return [];
  }
  return (data as Notificacion[]) || [];
}

/** Número de notificaciones sin leer (para el badge). */
export async function contarNoLeidas(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('leida', false);
  if (error) {
    console.error('Error contando notificaciones:', error.message);
    return 0;
  }
  return count || 0;
}

/** Marca una notificación como leída. */
export async function marcarLeida(id: string): Promise<void> {
  const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
  if (error) throw error;
}

/** Marca todas las notificaciones del usuario como leídas. */
export async function marcarTodasLeidas(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('user_id', userId)
    .eq('leida', false);
  if (error) throw error;
}
