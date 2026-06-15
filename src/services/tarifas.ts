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

export type TipoPrecioExpress = 'kg' | 'unidad';

export interface TarifaExpressContenido {
  id: string;
  contenido: string;
  tipo_precio: TipoPrecioExpress;
  precio: number;
  activo: boolean;
  orden: number;
}

// Relaciona las opciones de "tipo de carga" de la calculadora con el
// `contenido` correspondiente en `tarifas_express_contenido`.
export const EXPRESS_CONTENIDO_POR_TIPO: Record<string, string> = {
  Normal: 'Miscelánea Normal',
  Medicinas: 'Medicinas (Exento)',
  Bateria: 'Batería',
  Movil: 'Móvil / Celular',
  Laptop: 'Laptop / PC',
};

export interface CalculoExpressContenido {
  contenido: string;
  tipoPrecio: TipoPrecioExpress;
  precioUnitario: number;
  cantidad: number;
  total: number;
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

/**
 * Calcula el precio de un envío Express según el contenido declarado. Si el
 * precio es por kg se usa el peso del paquete; si es por unidad se usa la
 * cantidad de piezas. Devuelve null si no hay tarifa activa para ese contenido.
 */
export function calcularPrecioExpressContenido(
  contenido: string,
  peso: number,
  cantidad: number,
  tarifasExpressContenido: TarifaExpressContenido[],
): CalculoExpressContenido | null {
  const tarifa = tarifasExpressContenido.find((t) => t.activo && t.contenido === contenido);
  if (!tarifa) return null;

  const cantidadUsada = tarifa.tipo_precio === 'kg' ? peso : cantidad;

  return {
    contenido,
    tipoPrecio: tarifa.tipo_precio,
    precioUnitario: tarifa.precio,
    cantidad: cantidadUsada,
    total: tarifa.precio * cantidadUsada,
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

export async function getTarifasExpressContenido(): Promise<TarifaExpressContenido[]> {
  const { data, error } = await supabase
    .from('tarifas_express_contenido')
    .select('*')
    .order('orden', { ascending: true });
  if (error) throw error;
  return (data || []) as TarifaExpressContenido[];
}

export async function upsertTarifaExpressContenido(tarifa: Partial<TarifaExpressContenido> & { id?: string }): Promise<void> {
  const { error } = await supabase.from('tarifas_express_contenido').upsert(tarifa);
  if (error) throw error;
}

export async function deleteTarifaExpressContenido(id: string): Promise<void> {
  const { error } = await supabase.from('tarifas_express_contenido').delete().eq('id', id);
  if (error) throw error;
}
