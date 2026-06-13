import { supabase } from '../supabase';

// Reemplaza las lecturas/escrituras de la colección 'users' de Firestore por la
// tabla 'profiles' de Supabase. En Supabase los campos planos del antiguo doc de
// usuario (name, telefono, precioPorKilo, codigoReferido, etc.) viven dentro de la
// columna jsonb 'extra'; aquí se aplanan para que el resto de la app siga viendo
// el mismo formato que tenía con Firestore.

export interface ProfileRow {
  id: string;
  email: string | null;
  role: string;
  extra: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export type FlatProfile = {
  id: string;
  email: string | null;
  role: string;
  // createdAt se expone como un objeto tipo Timestamp de Firestore ({ toDate() })
  // para que el código existente que llamaba a createdAt.toDate() siga funcionando.
  createdAt?: { toDate: () => Date };
  [key: string]: unknown;
};

export function rowToProfile(row: ProfileRow): FlatProfile {
  const { extra, created_at, updated_at, ...rest } = row;
  void updated_at;
  const createdAt = created_at ? { toDate: () => new Date(created_at) } : undefined;
  return { ...(extra || {}), ...rest, createdAt };
}

export interface ListProfilesOptions {
  role?: string;
  roles?: string[];
  // Filtra por un campo guardado dentro de la columna jsonb 'extra'
  // (p. ej. { extraKey: 'referidoPor', extraValue: uid }).
  extraKey?: string;
  extraValue?: string;
}

export async function listProfiles(opts: ListProfilesOptions = {}): Promise<FlatProfile[]> {
  let q = supabase.from('profiles').select('*');
  if (opts.role) q = q.eq('role', opts.role);
  if (opts.roles && opts.roles.length) q = q.in('role', opts.roles);
  if (opts.extraKey && opts.extraValue !== undefined) {
    q = q.eq(`extra->>${opts.extraKey}`, opts.extraValue);
  }
  const { data, error } = await q;
  if (error) {
    console.error('Error cargando profiles:', error.message);
    return [];
  }
  return (data as ProfileRow[]).map(rowToProfile);
}

// Equivalente a onSnapshot de Firestore: hace una carga inicial e intenta
// suscribirse a cambios en la tabla (requiere realtime habilitado en 'profiles').
// Devuelve una función para cancelar la suscripción.
export function subscribeProfiles(
  opts: ListProfilesOptions,
  cb: (profiles: FlatProfile[]) => void,
): () => void {
  let active = true;
  const load = () => {
    listProfiles(opts).then((profiles) => {
      if (active) cb(profiles);
    });
  };
  load();
  const channel = supabase
    .channel(`profiles-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function getProfile(id: string): Promise<FlatProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data as ProfileRow);
}

// Actualiza un perfil por id. 'role'/'email' van a columnas; el resto se mezcla
// dentro de 'extra' (sin perder los campos existentes).
export async function updateProfileFields(id: string, fields: Record<string, unknown>): Promise<void> {
  const { role, email, id: _id, createdAt: _c, updatedAt: _u, ...extraFields } = fields as Record<string, unknown> & {
    role?: string;
    email?: string;
    id?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  void _id;
  void _c;
  void _u;
  const { data: current } = await supabase.from('profiles').select('extra').eq('id', id).maybeSingle();
  const mergedExtra = { ...(((current as { extra?: Record<string, unknown> } | null)?.extra) || {}), ...extraFields };
  const patch: Record<string, unknown> = { extra: mergedExtra };
  if (role !== undefined) patch.role = role;
  if (email !== undefined) patch.email = email;
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

// Crea un perfil de staff/partner creado por un admin (sin cuenta de Auth todavía;
// se genera un id nuevo). El email permite vincularlo cuando la persona se registre.
export async function createStaffProfile(
  role: string,
  email: string,
  fields: Record<string, unknown> = {},
): Promise<FlatProfile> {
  const { role: _r, email: _e, id: _id, ...extra } = fields as Record<string, unknown> & {
    role?: string;
    email?: string;
    id?: string;
  };
  void _r;
  void _e;
  void _id;
  const { data, error } = await supabase
    .from('profiles')
    .insert({ role, email, extra })
    .select()
    .single();
  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}
