// Tarifas dinámicas de envío y transporte provincial en Cuba, editables desde
// el panel de administración y consumidas por la calculadora pública de la landing.

import { supabase } from '../supabase';

export type Modalidad = 'regular' | 'express';

// Las 15 provincias de Cuba con cobertura. Isla de la Juventud (municipio
// especial) queda fuera por no tener cobertura de transporte.
export const PROVINCIAS_CUBA = [
  'La Habana',
  'Pinar del Río',
  'Artemisa',
  'Mayabeque',
  'Matanzas',
  'Cienfuegos',
  'Villa Clara',
  'Sancti Spíritus',
  'Ciego de Ávila',
  'Camagüey',
  'Las Tunas',
  'Holguín',
  'Granma',
  'Santiago de Cuba',
  'Guantánamo',
];

export interface TarifaEnvio {
  id: string;
  modalidad: Modalidad;
  peso_min: number;
  peso_max: number | null;
  precio_kg: number;
  activo: boolean;
}

export interface TarifaTransporteCuba {
  id: string;
  provincias: string[];
  precio_kg: number;
  activo: boolean;
}

export interface CalculoPrecio {
  pesoKg: number;
  precioKgBase: number;
  precioBase: number;
  recargoProvincialKg: number;
  recargoProvincial: number;
  total: number;
}

export async function getTarifasEnvio(): Promise<TarifaEnvio[]> {
  const { data, error } = await supabase
    .from('tarifas_envio')
    .select('*')
    .order('modalidad', { ascending: true })
    .order('peso_min', { ascending: true });
  if (error) throw error;
  return (data || []) as TarifaEnvio[];
}

export async function getTarifasTransporte(): Promise<TarifaTransporteCuba[]> {
  const { data, error } = await supabase
    .from('tarifas_transporte_cuba')
    .select('*')
    .order('precio_kg', { ascending: true });
  if (error) throw error;
  return (data || []) as TarifaTransporteCuba[];
}

/**
 * Calcula el precio total para un envío. Devuelve null si no hay tarifa
 * activa que cubra el peso o la provincia indicados.
 */
export function calcularPrecio(
  peso: number,
  modalidad: Modalidad,
  provincia: string,
  tarifasEnvio: TarifaEnvio[],
  tarifasTransporte: TarifaTransporteCuba[],
): CalculoPrecio | null {
  const tramo = tarifasEnvio.find((t) =>
    t.activo &&
    t.modalidad === modalidad &&
    peso >= t.peso_min &&
    (t.peso_max === null || peso <= t.peso_max)
  );
  if (!tramo) return null;

  const grupo = tarifasTransporte.find((g) => g.activo && g.provincias.includes(provincia));
  if (!grupo) return null;

  const precioBase = peso * tramo.precio_kg;
  const recargoProvincial = peso * grupo.precio_kg;

  return {
    pesoKg: peso,
    precioKgBase: tramo.precio_kg,
    precioBase,
    recargoProvincialKg: grupo.precio_kg,
    recargoProvincial,
    total: precioBase + recargoProvincial,
  };
}

export async function upsertTarifaEnvio(tarifa: Partial<TarifaEnvio> & { id?: string }): Promise<void> {
  const { error } = await supabase.from('tarifas_envio').upsert(tarifa);
  if (error) throw error;
}

export async function upsertTarifaTransporte(tarifa: Partial<TarifaTransporteCuba> & { id?: string }): Promise<void> {
  const { error } = await supabase.from('tarifas_transporte_cuba').upsert(tarifa);
  if (error) throw error;
}

export async function deleteTarifaEnvio(id: string): Promise<void> {
  const { error } = await supabase.from('tarifas_envio').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteTarifaTransporte(id: string): Promise<void> {
  const { error } = await supabase.from('tarifas_transporte_cuba').delete().eq('id', id);
  if (error) throw error;
}
