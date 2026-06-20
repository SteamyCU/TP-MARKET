// Reemplaza las lecturas/escrituras de la colección 'clientes' de Firestore por
// la tabla 'clientes' de Supabase. A diferencia de 'profiles', esta es una tabla
// relacional con columnas fijas en snake_case (ver supabase/migrations/0001_schema.sql);
// aquí el mapeo entre el formato "plano camelCase" usado por el resto de la app y
// las columnas snake_case se hace campo a campo.

import { supabase } from '../supabase';

export interface ClienteRow {
  id: string;
  user_id: string | null;
  nombre: string;
  email: string | null;
  documento_identidad: string | null;
  telefono_espana: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  pais: string | null;
  agente_id: string | null;
  referido_por: string | null;
  etiquetas_marketing: string[] | null;
  contactos: unknown[] | null;
  created_at?: string;
  updated_at?: string;
}

export type FlatCliente = {
  id: string;
  userId?: string | null;
  nombre: string;
  email: string | null;
  documentoIdentidad: string | null;
  telefonoEspana: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  pais: string | null;
  agenteId: string | null;
  referidoPor?: string | null;
  referido_por?: string | null;
  etiquetasMarketing: string[];
  contactos: unknown[];
  // createdAt se expone como un objeto tipo Timestamp de Firestore ({ toDate() })
  // para que el código existente que llamaba a createdAt.toDate() siga funcionando.
  createdAt?: { toDate: () => Date };
  [key: string]: unknown;
};

export function rowToCliente(row: ClienteRow): FlatCliente {
  const createdAt = row.created_at ? { toDate: () => new Date(row.created_at as string) } : undefined;
  return {
    id: row.id,
    userId: row.user_id,
    nombre: row.nombre,
    email: row.email,
    documentoIdentidad: row.documento_identidad,
    telefonoEspana: row.telefono_espana,
    direccion: row.direccion,
    localidad: row.localidad,
    provincia: row.provincia,
    codigoPostal: row.codigo_postal,
    pais: row.pais,
    agenteId: row.agente_id,
    referidoPor: row.referido_por,
    referido_por: row.referido_por,
    etiquetasMarketing: row.etiquetas_marketing || [],
    contactos: row.contactos || [],
    createdAt,
  };
}

// Convierte los campos planos camelCase (los que usa el resto de la app) a las
// columnas snake_case de la tabla 'clientes'. Solo incluye en el resultado los
// campos presentes en `fields` (para usos parciales en updates).
function flatFieldsToColumns(fields: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    userId: 'user_id',
    nombre: 'nombre',
    email: 'email',
    documentoIdentidad: 'documento_identidad',
    telefonoEspana: 'telefono_espana',
    direccion: 'direccion',
    localidad: 'localidad',
    provincia: 'provincia',
    codigoPostal: 'codigo_postal',
    pais: 'pais',
    agenteId: 'agente_id',
    referidoPor: 'referido_por',
    referido_por: 'referido_por',
    etiquetasMarketing: 'etiquetas_marketing',
    contactos: 'contactos',
  };
  for (const [key, column] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      patch[column] = fields[key];
    }
  }
  return patch;
}

export interface ListClientesOptions {
  email?: string;
  agenteId?: string;
}

export async function listClientes(opts: ListClientesOptions = {}): Promise<FlatCliente[]> {
  let q = supabase.from('clientes').select('*');
  if (opts.email) q = q.eq('email', opts.email);
  if (opts.agenteId) q = q.eq('agente_id', opts.agenteId);
  const { data, error } = await q;
  if (error) {
    console.error('Error cargando clientes:', error.message);
    return [];
  }
  return (data as ClienteRow[]).map(rowToCliente);
}

// Equivalente a onSnapshot de Firestore: hace una carga inicial e intenta
// suscribirse a cambios en la tabla (requiere realtime habilitado en 'clientes').
// Devuelve una función para cancelar la suscripción.
export function subscribeClientes(
  opts: ListClientesOptions,
  cb: (clientes: FlatCliente[]) => void,
): () => void {
  let active = true;
  const load = () => {
    listClientes(opts).then((clientes) => {
      if (active) cb(clientes);
    });
  };
  load();
  const channel = supabase
    .channel(`clientes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/** Carga varios clientes por id (usado para exportaciones que necesitan datos completos). */
export async function listClientesByIds(ids: string[]): Promise<FlatCliente[]> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return [];
  const { data, error } = await supabase.from('clientes').select('*').in('id', unicos);
  if (error) {
    console.error('Error cargando clientes por id:', error.message);
    return [];
  }
  return (data as ClienteRow[]).map(rowToCliente);
}

export async function getCliente(id: string): Promise<FlatCliente | null> {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToCliente(data as ClienteRow);
}

/** Busca el cliente vinculado a un email (usado para encontrar el cliente de un usuario del portal). */
export async function getClienteByEmail(email: string): Promise<FlatCliente | null> {
  const { data, error } = await supabase.from('clientes').select('*').eq('email', email).maybeSingle();
  if (error || !data) return null;
  return rowToCliente(data as ClienteRow);
}

export async function createCliente(data: Record<string, unknown>): Promise<FlatCliente> {
  const patch = flatFieldsToColumns(data);
  const { data: row, error } = await supabase.from('clientes').insert(patch).select().single();
  if (error) throw error;
  return rowToCliente(row as ClienteRow);
}

export async function updateCliente(id: string, fields: Record<string, unknown>): Promise<void> {
  const patch = flatFieldsToColumns(fields);
  const { error } = await supabase.from('clientes').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}

/** Agrega un contacto comercial al array jsonb 'contactos' (equivalente a arrayUnion). */
export async function addContactoCliente(id: string, contacto: Record<string, unknown>): Promise<void> {
  const { data: current, error: fetchError } = await supabase.from('clientes').select('contactos').eq('id', id).maybeSingle();
  if (fetchError) throw fetchError;
  const contactos = ((current as { contactos?: unknown[] } | null)?.contactos) || [];
  const { error } = await supabase.from('clientes').update({ contactos: [...contactos, contacto] }).eq('id', id);
  if (error) throw error;
}
