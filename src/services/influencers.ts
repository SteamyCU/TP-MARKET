// Servicio del modelo de Influencer (Fase 21).
//
// Modelo de negocio (distinto al de Agente): el influencer solo comparte un
// código/enlace de descuento. No gestiona clientes ni tiene sub-afiliados.
//
// Regla de comisión:
//   1. Solo cuentan los clientes NUEVOS que se registran con su código. Quedan
//      vinculados al influencer mediante profiles.extra->>'referidoPor'.
//   2. Una vez referido, el influencer cobra comisión de TODOS los envíos
//      futuros de ese cliente, indefinidamente, MIENTRAS esté "activo".
//   3. "Activo" = ha traído al menos 1 cliente nuevo en los últimos
//      `ventanaActividadDias` (90 por defecto), ventana móvil.
//   4. Si pasa la ventana sin traer ningún cliente nuevo → inactivo: deja de
//      generar comisión en toda su cartera hasta reactivarse.
//   5. La comisión de cada envío se evalúa con el estado de actividad del
//      influencer en el momento de ese envío (no retroactivo).
//
// La cartera se reconstruye encadenando: profiles (cliente referido) →
// clientes.user_id → clientes.id → paquetes.cliente_id.

import { supabase } from '../supabase';
import { getSetting } from './settings';

const MS_POR_DIA = 1000 * 60 * 60 * 24;

export interface InfluencerConfig {
  comisionPct: number;
  ventanaActividadDias: number;
}

const CONFIG_DEFAULT: InfluencerConfig = {
  comisionPct: 0.05,
  ventanaActividadDias: 90,
};

export interface ClienteReferido {
  id: string;
  nombre: string;
  email: string;
  /** Fecha de registro (ISO). */
  fechaRegistro: string;
  /** true si se registró dentro de la ventana de actividad (cliente "nuevo"). */
  esNuevo: boolean;
  kgEnviados: number;
  numPaquetes: number;
  /** Fecha del último paquete del cliente (ISO) o null. */
  ultimaActividad: string | null;
}

export interface EstadoActividadInfluencer {
  activo: boolean;
  /** Días que quedan hasta perder la actividad (si está activo). */
  diasRestantes: number | null;
  /** Fecha límite para traer un cliente nuevo (ISO) o null. */
  fechaLimite: string | null;
  /** Fecha de registro del cliente referido más reciente (ISO) o null. */
  ultimoClienteFecha: string | null;
}

export interface ComisionesInfluencer {
  totalComisiones: number;
  comisionesEsteMes: number;
  kgGestionadosMes: number;
  clientesNuevosTotal: number;
}

// Filas mínimas que leemos de Supabase para los cálculos.
interface ProfileReferidoRow {
  id: string;
  email: string;
  extra: Record<string, unknown> | null;
  created_at: string;
}

interface PaqueteCarteraRow {
  cliente_id: string | null;
  estado: string;
  peso: number | null;
  peso_tasable: number | null;
  precio_final: number | null;
  precio_aplicado: number | null;
  created_at: string;
}

interface Cartera {
  config: InfluencerConfig;
  referidos: ProfileReferidoRow[];
  /** clienteId (tabla clientes) → profileId del cliente referido. */
  profilePorCliente: Map<string, string>;
  paquetes: PaqueteCarteraRow[];
}

async function getConfig(): Promise<InfluencerConfig> {
  try {
    const cfg = await getSetting<Partial<InfluencerConfig>>('influencer_config');
    return { ...CONFIG_DEFAULT, ...(cfg || {}) };
  } catch {
    return CONFIG_DEFAULT;
  }
}

// Carga única de toda la cartera del influencer (perfiles referidos + paquetes).
async function cargarCartera(influencerId: string): Promise<Cartera> {
  const config = await getConfig();

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, extra, created_at')
    .eq('role', 'cliente')
    .eq('extra->>referidoPor', influencerId)
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error cargando clientes referidos:', profilesError.message);
    return { config, referidos: [], profilePorCliente: new Map(), paquetes: [] };
  }

  const referidos = (profilesData as ProfileReferidoRow[]) || [];
  const profileIds = referidos.map((p) => p.id);

  const profilePorCliente = new Map<string, string>();
  let clienteIds: string[] = [];
  if (profileIds.length > 0) {
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('id, user_id')
      .in('user_id', profileIds);
    for (const c of (clientesData as { id: string; user_id: string | null }[]) || []) {
      if (c.user_id) profilePorCliente.set(c.id, c.user_id);
    }
    clienteIds = [...profilePorCliente.keys()];
  }

  let paquetes: PaqueteCarteraRow[] = [];
  if (clienteIds.length > 0) {
    const { data: paquetesData } = await supabase
      .from('paquetes')
      .select('cliente_id, estado, peso, peso_tasable, precio_final, precio_aplicado, created_at')
      .in('cliente_id', clienteIds);
    paquetes = (paquetesData as PaqueteCarteraRow[]) || [];
  }

  return { config, referidos, profilePorCliente, paquetes };
}

// Fechas de registro (ms) de los clientes referidos, de más reciente a más antiguo.
function fechasRegistroMs(referidos: ProfileReferidoRow[]): number[] {
  return referidos
    .map((r) => new Date(r.created_at).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a);
}

// Estado de actividad a partir de una fecha de referencia (por defecto, ahora).
// Activo si existe algún cliente referido en la ventana [ref - ventana, ref].
function calcularActividad(
  fechasMs: number[],
  ventanaDias: number,
  referenciaMs: number,
): EstadoActividadInfluencer {
  if (fechasMs.length === 0) {
    return { activo: false, diasRestantes: null, fechaLimite: null, ultimoClienteFecha: null };
  }
  // Cliente referido más reciente en o antes de la referencia.
  const ultimoMs = fechasMs.find((t) => t <= referenciaMs) ?? null;
  if (ultimoMs === null) {
    return { activo: false, diasRestantes: null, fechaLimite: null, ultimoClienteFecha: null };
  }
  const ventanaMs = ventanaDias * MS_POR_DIA;
  const fechaLimiteMs = ultimoMs + ventanaMs;
  const activo = referenciaMs <= fechaLimiteMs;
  const diasRestantes = activo
    ? Math.max(0, Math.ceil((fechaLimiteMs - referenciaMs) / MS_POR_DIA))
    : null;
  return {
    activo,
    diasRestantes,
    fechaLimite: new Date(fechaLimiteMs).toISOString(),
    ultimoClienteFecha: new Date(ultimoMs).toISOString(),
  };
}

function valorEnvio(p: PaqueteCarteraRow): number {
  return p.precio_final ?? p.precio_aplicado ?? 0;
}

function pesoEnvio(p: PaqueteCarteraRow): number {
  return p.peso_tasable ?? p.peso ?? 0;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Clientes (profiles role='cliente') referidos por el influencer, enriquecidos. */
export async function getClientesReferidos(influencerId: string): Promise<ClienteReferido[]> {
  const cartera = await cargarCartera(influencerId);
  return construirClientesReferidos(cartera);
}

function construirClientesReferidos(cartera: Cartera): ClienteReferido[] {
  const { config, referidos, profilePorCliente, paquetes } = cartera;
  const ventanaMs = config.ventanaActividadDias * MS_POR_DIA;
  const ahora = Date.now();

  // Agregados de paquetes por profileId.
  const kgPorProfile = new Map<string, number>();
  const numPorProfile = new Map<string, number>();
  const ultimaPorProfile = new Map<string, number>();
  for (const p of paquetes) {
    const profileId = p.cliente_id ? profilePorCliente.get(p.cliente_id) : undefined;
    if (!profileId) continue;
    kgPorProfile.set(profileId, (kgPorProfile.get(profileId) || 0) + pesoEnvio(p));
    numPorProfile.set(profileId, (numPorProfile.get(profileId) || 0) + 1);
    const t = new Date(p.created_at).getTime();
    if (!Number.isNaN(t) && t > (ultimaPorProfile.get(profileId) || 0)) {
      ultimaPorProfile.set(profileId, t);
    }
  }

  return referidos.map((r) => {
    const registroMs = new Date(r.created_at).getTime();
    const nombre = (r.extra?.name as string) || r.email || 'Cliente';
    const ultimaMs = ultimaPorProfile.get(r.id);
    return {
      id: r.id,
      nombre,
      email: r.email,
      fechaRegistro: r.created_at,
      esNuevo: !Number.isNaN(registroMs) && ahora - registroMs <= ventanaMs,
      kgEnviados: Math.round((kgPorProfile.get(r.id) || 0) * 100) / 100,
      numPaquetes: numPorProfile.get(r.id) || 0,
      ultimaActividad: ultimaMs ? new Date(ultimaMs).toISOString() : null,
    };
  });
}

/** Estado de actividad actual del influencer (ventana móvil desde hoy). */
export async function getEstadoActividadInfluencer(influencerId: string): Promise<EstadoActividadInfluencer> {
  const cartera = await cargarCartera(influencerId);
  return calcularActividad(fechasRegistroMs(cartera.referidos), cartera.config.ventanaActividadDias, Date.now());
}

/**
 * Comisiones del influencer. Por cada paquete 'Entregado' de su cartera, si el
 * influencer estaba activo en el momento del envío (existe un cliente nuevo en
 * la ventana previa a la fecha del paquete), suma comisionPct × valor del envío.
 */
export async function getComisionesInfluencer(influencerId: string): Promise<ComisionesInfluencer> {
  const cartera = await cargarCartera(influencerId);
  return construirComisiones(cartera);
}

function construirComisiones(cartera: Cartera): ComisionesInfluencer {
  const { config, referidos, paquetes } = cartera;
  const fechasMs = fechasRegistroMs(referidos);
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();

  let totalComisiones = 0;
  let comisionesEsteMes = 0;
  let kgGestionadosMes = 0;

  for (const p of paquetes) {
    const fechaMs = new Date(p.created_at).getTime();
    if (Number.isNaN(fechaMs)) continue;

    if (fechaMs >= inicioMes) kgGestionadosMes += pesoEnvio(p);

    if (p.estado !== 'Entregado') continue;
    const actividad = calcularActividad(fechasMs, config.ventanaActividadDias, fechaMs);
    if (!actividad.activo) continue;

    const comision = valorEnvio(p) * config.comisionPct;
    totalComisiones += comision;
    if (fechaMs >= inicioMes) comisionesEsteMes += comision;
  }

  return {
    totalComisiones: Math.round(totalComisiones * 100) / 100,
    comisionesEsteMes: Math.round(comisionesEsteMes * 100) / 100,
    kgGestionadosMes: Math.round(kgGestionadosMes * 100) / 100,
    clientesNuevosTotal: referidos.length,
  };
}

/**
 * Carga combinada para el dashboard: actividad + comisiones + clientes en una
 * sola lectura de la cartera (evita repetir las consultas tres veces).
 */
export interface ResumenInfluencer {
  actividad: EstadoActividadInfluencer;
  comisiones: ComisionesInfluencer;
  clientes: ClienteReferido[];
  config: InfluencerConfig;
}

export async function getResumenInfluencer(influencerId: string): Promise<ResumenInfluencer> {
  const cartera = await cargarCartera(influencerId);
  return {
    actividad: calcularActividad(fechasRegistroMs(cartera.referidos), cartera.config.ventanaActividadDias, Date.now()),
    comisiones: construirComisiones(cartera),
    clientes: construirClientesReferidos(cartera),
    config: cartera.config,
  };
}
