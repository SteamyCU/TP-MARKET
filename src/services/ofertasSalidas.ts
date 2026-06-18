// Reemplaza las colecciones 'ofertas' y 'salidas' de Firestore por las tablas
// homónimas de Supabase. Ambas tienen columnas fijas más una columna 'datos'
// jsonb donde se guardan los campos variables (precio, destino, tipoSalida,
// creadoPor), igual que el documento flexible que tenían en Firestore.

import { supabase } from '../supabase';

// ----------------------------- OFERTAS -------------------------------------

export type FlatOferta = {
  id: string;
  titulo: string;
  descripcion: string;
  precio?: number | null;
  creadoPor?: string;
  // fechaCreacion se expone con .seconds para preservar
  // `oferta.fechaCreacion?.seconds * 1000` de la UI.
  fechaCreacion?: { seconds: number };
};

interface OfertaRow {
  id: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  datos: Record<string, unknown> | null;
  fecha_creacion?: string;
  created_at?: string;
}

function rowToOferta(row: OfertaRow): FlatOferta {
  const datos = row.datos || {};
  const ts = row.fecha_creacion || row.created_at;
  return {
    id: row.id,
    titulo: row.titulo || '',
    descripcion: row.descripcion || '',
    precio: (datos.precio as number) ?? null,
    creadoPor: datos.creadoPor as string | undefined,
    fechaCreacion: ts ? { seconds: Math.floor(new Date(ts).getTime() / 1000) } : undefined,
  };
}

export function subscribeOfertas(cb: (ofertas: FlatOferta[]) => void): () => void {
  let active = true;
  const load = () => {
    supabase.from('ofertas').select('*').order('fecha_creacion', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error cargando ofertas:', error.message);
          return;
        }
        if (active) cb((data as OfertaRow[]).map(rowToOferta));
      });
  };
  load();
  const channel = supabase
    .channel(`ofertas-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ofertas' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function crearOferta(input: { titulo: string; descripcion: string; precio: number | null; creadoPor?: string }): Promise<void> {
  const { error } = await supabase.from('ofertas').insert({
    titulo: input.titulo,
    descripcion: input.descripcion,
    estado: 'Activa',
    datos: { precio: input.precio, creadoPor: input.creadoPor ?? null },
  });
  if (error) throw error;
}

export async function eliminarOferta(id: string): Promise<void> {
  const { error } = await supabase.from('ofertas').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------- SALIDAS -------------------------------------

export type FlatSalida = {
  id: string;
  fecha: string;
  destino: string;
  estado: string;
  tipoSalida: 'aerea' | 'express';
  creadoPor?: string;
};

interface SalidaRow {
  id: string;
  fecha: string | null;
  estado: string;
  datos: Record<string, unknown> | null;
  created_at?: string;
}

function rowToSalida(row: SalidaRow): FlatSalida {
  const datos = row.datos || {};
  return {
    id: row.id,
    fecha: row.fecha || '',
    destino: (datos.destino as string) || '',
    estado: row.estado,
    tipoSalida: (datos.tipoSalida as 'aerea' | 'express') || 'aerea',
    creadoPor: datos.creadoPor as string | undefined,
  };
}

export function subscribeSalidas(cb: (salidas: FlatSalida[]) => void): () => void {
  let active = true;
  const load = () => {
    supabase.from('salidas').select('*').order('fecha', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error cargando salidas:', error.message);
          return;
        }
        if (active) cb((data as SalidaRow[]).map(rowToSalida));
      });
  };
  load();
  const channel = supabase
    .channel(`salidas-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'salidas' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function crearSalida(input: { fecha: string; destino: string; estado: string; tipoSalida: 'aerea' | 'express'; creadoPor?: string }): Promise<void> {
  const { error } = await supabase.from('salidas').insert({
    fecha: input.fecha || null,
    estado: input.estado,
    datos: { destino: input.destino, tipoSalida: input.tipoSalida, creadoPor: input.creadoPor ?? null },
  });
  if (error) throw error;
}

export async function eliminarSalida(id: string): Promise<void> {
  const { error } = await supabase.from('salidas').delete().eq('id', id);
  if (error) throw error;
}

// Estados que NO cuentan como una salida vigente (se excluyen del badge público).
const ESTADOS_SALIDA_INACTIVOS = [
  'cancelada', 'cancelado', 'finalizada', 'finalizado',
  'completada', 'completado', 'inactiva', 'inactivo',
];

/**
 * Devuelve la próxima salida vigente de cada tipo para el badge público del home.
 * "Vigente" = fecha >= hoy y estado no cancelado/finalizado. Como la consulta
 * viene ordenada por fecha ascendente, el primer match de cada tipo es el más
 * próximo. Si no hay ninguna de un tipo, ese campo es null.
 */
export async function getProximasSalidas(): Promise<{ regular: FlatSalida | null; express: FlatSalida | null }> {
  // La columna `fecha` es un date plano; comparamos contra hoy en local (YYYY-MM-DD).
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('salidas')
    .select('*')
    .gte('fecha', hoyStr)
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error cargando próximas salidas:', error.message);
    return { regular: null, express: null };
  }

  const vigentes = (data as SalidaRow[])
    .map(rowToSalida)
    .filter((s) => s.fecha && !ESTADOS_SALIDA_INACTIVOS.includes(s.estado.trim().toLowerCase()));

  return {
    regular: vigentes.find((s) => s.tipoSalida === 'aerea') ?? null,
    express: vigentes.find((s) => s.tipoSalida === 'express') ?? null,
  };
}
