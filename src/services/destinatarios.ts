// Reemplaza las lecturas/escrituras de la colección 'destinatarios' de Firestore
// por la tabla 'destinatarios' de Supabase (ver supabase/migrations/0001_schema.sql).
// Igual que en 'clientes', el mapeo entre el formato "plano camelCase" usado por
// el resto de la app y las columnas snake_case se hace campo a campo.

import { supabase } from '../supabase';

export interface DestinatarioRow {
  id: string;
  cliente_id: string;
  nombre: string;
  carnet_pasaporte: string | null;
  telefono_cuba: string | null;
  telefono_secundario: string | null;
  email: string | null;
  direccion: string | null;
  provincia: string | null;
  municipio: string | null;
  codigo_postal: string | null;
  created_at?: string;
  updated_at?: string;
}

export type FlatDestinatario = {
  id: string;
  clienteId: string;
  nombre: string;
  carnetPasaporte: string | null;
  telefonoCuba: string | null;
  telefonoSecundario: string | null;
  email: string | null;
  direccion: string | null;
  provincia: string | null;
  municipio: string | null;
  codigoPostal: string | null;
  // createdAt se expone como un objeto tipo Timestamp de Firestore ({ toDate() })
  // para que el código existente que llamaba a createdAt.toDate() siga funcionando.
  createdAt?: { toDate: () => Date };
  [key: string]: unknown;
};

export function rowToDestinatario(row: DestinatarioRow): FlatDestinatario {
  const createdAt = row.created_at ? { toDate: () => new Date(row.created_at as string) } : undefined;
  return {
    id: row.id,
    clienteId: row.cliente_id,
    nombre: row.nombre,
    carnetPasaporte: row.carnet_pasaporte,
    telefonoCuba: row.telefono_cuba,
    telefonoSecundario: row.telefono_secundario,
    email: row.email,
    direccion: row.direccion,
    provincia: row.provincia,
    municipio: row.municipio,
    codigoPostal: row.codigo_postal,
    createdAt,
  };
}

// Convierte los campos planos camelCase a las columnas snake_case de la tabla
// 'destinatarios'. Solo incluye en el resultado los campos presentes en `fields`.
function flatFieldsToColumns(fields: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    clienteId: 'cliente_id',
    nombre: 'nombre',
    carnetPasaporte: 'carnet_pasaporte',
    telefonoCuba: 'telefono_cuba',
    telefonoSecundario: 'telefono_secundario',
    email: 'email',
    direccion: 'direccion',
    provincia: 'provincia',
    municipio: 'municipio',
    codigoPostal: 'codigo_postal',
  };
  for (const [key, column] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      patch[column] = fields[key];
    }
  }
  return patch;
}

export interface ListDestinatariosOptions {
  clienteId?: string;
}

export async function listDestinatarios(opts: ListDestinatariosOptions = {}): Promise<FlatDestinatario[]> {
  let q = supabase.from('destinatarios').select('*');
  if (opts.clienteId) q = q.eq('cliente_id', opts.clienteId);
  const { data, error } = await q;
  if (error) {
    console.error('Error cargando destinatarios:', error.message);
    return [];
  }
  return (data as DestinatarioRow[]).map(rowToDestinatario);
}

// Equivalente a onSnapshot de Firestore: hace una carga inicial e intenta
// suscribirse a cambios en la tabla (requiere realtime habilitado en 'destinatarios').
// Devuelve una función para cancelar la suscripción.
export function subscribeDestinatarios(
  opts: ListDestinatariosOptions,
  cb: (destinatarios: FlatDestinatario[]) => void,
): () => void {
  let active = true;
  const load = () => {
    listDestinatarios(opts).then((destinatarios) => {
      if (active) cb(destinatarios);
    });
  };
  load();
  const channel = supabase
    .channel(`destinatarios-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'destinatarios' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/** Carga varios destinatarios por id (usado para exportaciones que necesitan datos completos). */
export async function listDestinatariosByIds(ids: string[]): Promise<FlatDestinatario[]> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return [];
  const { data, error } = await supabase.from('destinatarios').select('*').in('id', unicos);
  if (error) {
    console.error('Error cargando destinatarios por id:', error.message);
    return [];
  }
  return (data as DestinatarioRow[]).map(rowToDestinatario);
}

export async function getDestinatario(id: string): Promise<FlatDestinatario | null> {
  const { data, error } = await supabase.from('destinatarios').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToDestinatario(data as DestinatarioRow);
}

export async function createDestinatario(data: Record<string, unknown>): Promise<FlatDestinatario> {
  const patch = flatFieldsToColumns(data);
  const { data: row, error } = await supabase.from('destinatarios').insert(patch).select().single();
  if (error) throw error;
  return rowToDestinatario(row as DestinatarioRow);
}

export async function updateDestinatario(id: string, fields: Record<string, unknown>): Promise<void> {
  const patch = flatFieldsToColumns(fields);
  const { error } = await supabase.from('destinatarios').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteDestinatario(id: string): Promise<void> {
  const { error } = await supabase.from('destinatarios').delete().eq('id', id);
  if (error) throw error;
}
