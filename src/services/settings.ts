// Reemplaza la colección 'settings' de Firestore (documentos singleton tipo
// 'negocio', 'global', 'precios', 'influencer_levels') por la tabla 'settings'
// de Supabase, donde cada documento es una fila: key = nombre del documento,
// value = jsonb con su contenido.

import { supabase } from '../supabase';

/** Lee el documento de settings con la clave dada. Devuelve null si no existe. */
export async function getSetting<T = Record<string, unknown>>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.error(`Error cargando settings/${key}:`, error.message);
    return null;
  }
  if (!data) return null;
  return (data as { value: T }).value;
}

/**
 * Guarda (upsert) el documento de settings con la clave dada. Con merge=true
 * (por defecto) combina con el valor existente, equivalente a setDoc(..., { merge: true }).
 */
export async function setSetting(
  key: string,
  value: Record<string, unknown>,
  merge = true,
): Promise<void> {
  let payload = value;
  if (merge) {
    const current = await getSetting(key);
    payload = { ...(current || {}), ...value };
  }
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: payload }, { onConflict: 'key' });
  if (error) throw error;
}
