// Servicio del Programa de Viajeros (Fase 25).
//
// Marketplace donde clientes que viajan publican kilos de equipaje disponibles
// para que otros clientes envíen paquetes Express con ellos.
//
// Reglas:
//   - Solo un perfil con identidad verificada (documento subido a
//     profiles.extra->>'documentoIdentidadUrl') puede publicar un viaje.
//   - Al publicar, el viajero acepta explícitamente la cláusula de exención de
//     responsabilidad (acepto_terminos = true, obligatorio).

import { supabase } from '../supabase';
import { getProfile } from './profiles';

export type EstadoOfertaViajero = 'activa' | 'pausada' | 'completada' | 'cancelada';

export interface OfertaViajero {
  id: string;
  viajero_id: string;
  provincia_destino: string;
  fecha_salida: string;
  kilos_disponibles: number;
  kilos_reservados: number;
  precio_kg: number;
  notas: string | null;
  estado: EstadoOfertaViajero;
  acepto_terminos: boolean;
  created_at: string;
  // Enriquecido (no es columna): nombre del viajero para el tablero.
  viajero_nombre?: string;
}

export interface NuevaOfertaViajero {
  provincia_destino: string;
  fecha_salida: string;
  kilos_disponibles: number;
  precio_kg: number;
  notas?: string;
  acepto_terminos: boolean;
}

export interface FiltroOfertas {
  provincia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

/** Kilos que quedan libres en una oferta. */
export function getKilosRestantes(oferta: OfertaViajero): number {
  return Math.max(0, oferta.kilos_disponibles - oferta.kilos_reservados);
}

/** true si el perfil tiene el documento de identidad subido/verificado. */
export function tieneIdentidadVerificada(profile: Record<string, unknown> | null | undefined): boolean {
  return Boolean(profile?.documentoIdentidadUrl);
}

// Añade el nombre del viajero a cada oferta a partir de su perfil.
async function enriquecerConViajero(ofertas: OfertaViajero[]): Promise<OfertaViajero[]> {
  const ids = [...new Set(ofertas.map((o) => o.viajero_id))];
  if (ids.length === 0) return ofertas;
  const { data } = await supabase.from('profiles').select('id, email, extra').in('id', ids);
  const porId = new Map(
    ((data as { id: string; email: string | null; extra: Record<string, unknown> | null }[]) || []).map((p) => [
      p.id,
      (p.extra?.name as string) || p.email || 'Viajero',
    ]),
  );
  return ofertas.map((o) => ({ ...o, viajero_nombre: porId.get(o.viajero_id) || 'Viajero' }));
}

/**
 * Ofertas activas con kilos libres, ordenadas por fecha de salida ascendente.
 * Acepta filtros opcionales por provincia y rango de fechas de salida.
 */
export async function getOfertasActivas(filtro: FiltroOfertas = {}): Promise<OfertaViajero[]> {
  let q = supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('estado', 'activa')
    .order('fecha_salida', { ascending: true });

  if (filtro.provincia) q = q.eq('provincia_destino', filtro.provincia);
  if (filtro.fechaDesde) q = q.gte('fecha_salida', filtro.fechaDesde);
  if (filtro.fechaHasta) q = q.lte('fecha_salida', filtro.fechaHasta);

  const { data, error } = await q;
  if (error) throw error;

  // Solo las que aún tienen kilos libres (kilos_disponibles > kilos_reservados).
  const conKilos = ((data as OfertaViajero[]) || []).filter(
    (o) => o.kilos_disponibles > o.kilos_reservados,
  );
  return enriquecerConViajero(conKilos);
}

/** Ofertas publicadas por un usuario (todas, sin filtrar por estado). */
export async function getMisOfertas(uid: string): Promise<OfertaViajero[]> {
  const { data, error } = await supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('viajero_id', uid)
    .order('fecha_salida', { ascending: true });
  if (error) throw error;
  return (data as OfertaViajero[]) || [];
}

/**
 * Publica un viaje. Verifica primero que el perfil tenga identidad verificada
 * (documento subido) y que se hayan aceptado los términos; si no, lanza un
 * error claro. Inserta la oferta con acepto_terminos = true.
 */
export async function crearOferta(uid: string, datos: NuevaOfertaViajero): Promise<OfertaViajero> {
  const perfil = await getProfile(uid);
  if (!tieneIdentidadVerificada(perfil)) {
    throw new Error(
      'Para publicar un viaje necesitas verificar tu identidad. Sube tu documento desde Mi Perfil.',
    );
  }
  if (!datos.acepto_terminos) {
    throw new Error('Debes aceptar los términos del Programa de Viajeros para publicar tu viaje.');
  }
  if (!(datos.kilos_disponibles > 0)) {
    throw new Error('Indica cuántos kilos tienes disponibles.');
  }
  if (!(datos.precio_kg > 0)) {
    throw new Error('Indica un precio por kilo válido.');
  }

  const { data, error } = await supabase
    .from('ofertas_viajero')
    .insert({
      viajero_id: uid,
      provincia_destino: datos.provincia_destino,
      fecha_salida: datos.fecha_salida,
      kilos_disponibles: datos.kilos_disponibles,
      precio_kg: datos.precio_kg,
      notas: datos.notas?.trim() || null,
      acepto_terminos: true,
      estado: 'activa',
    })
    .select()
    .single();
  if (error) throw error;
  return data as OfertaViajero;
}

/** Cambia el estado de una oferta (pausar/cancelar/completar/reactivar). */
export async function actualizarEstadoOferta(id: string, estado: EstadoOfertaViajero): Promise<void> {
  const { error } = await supabase.from('ofertas_viajero').update({ estado }).eq('id', id);
  if (error) throw error;
}
