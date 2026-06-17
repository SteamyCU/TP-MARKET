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

// =============================================================================
// Reservas (Fase 25, parte 2)
// =============================================================================

export type EstadoReservaViajero = 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada' | 'completada';

export interface ReservaViajero {
  id: string;
  oferta_id: string;
  cliente_id: string;
  kilos_solicitados: number;
  precio_total: number;
  estado: EstadoReservaViajero;
  mensaje_cliente: string | null;
  motivo_rechazo: string | null;
  acepto_terminos: boolean;
  created_at: string;
  respondida_at: string | null;
  // Enriquecido (no son columnas):
  oferta?: OfertaViajero;
  cliente_nombre?: string;
  contacto?: { telefono: string | null; email: string | null; nombre: string };
}

interface PerfilContacto {
  id: string;
  email: string | null;
  extra: Record<string, unknown> | null;
}

async function obtenerContacto(uid: string): Promise<{ telefono: string | null; email: string | null; nombre: string }> {
  const { data } = await supabase.from('profiles').select('id, email, extra').eq('id', uid).single();
  const perfil = data as PerfilContacto | null;
  return {
    telefono: (perfil?.extra?.telefono as string) || null,
    email: perfil?.email || null,
    nombre: (perfil?.extra?.name as string) || perfil?.email || 'Usuario',
  };
}

async function enviarNotificacionReserva(
  tipo: 'nueva_solicitud' | 'aceptada' | 'rechazada',
  email: string,
  nombre: string,
  datosOferta: { provincia_destino: string; fecha_salida: string },
  datosContacto?: { nombre: string; telefono: string | null; email: string | null },
  motivoRechazo?: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('notificar-reserva-viajero', {
    body: { tipo, email, nombre, datosOferta, datosContacto, motivoRechazo },
  });
  if (error) console.error('Error enviando notificación de reserva de viajero:', error.message);
}

/**
 * Crea una solicitud de reserva sobre una oferta. Verifica que el cliente
 * acepte los términos, que queden kilos suficientes, calcula el precio total,
 * inserta la reserva, bloquea el cupo en la oferta y notifica al viajero.
 */
export async function crearReserva(
  ofertaId: string,
  clienteId: string,
  kilos: number,
  mensaje: string | undefined,
  aceptoTerminos: boolean,
): Promise<ReservaViajero> {
  if (!aceptoTerminos) {
    throw new Error('Debes aceptar las condiciones de la reserva para continuar.');
  }
  if (!(kilos > 0)) {
    throw new Error('Indica cuántos kilos quieres reservar.');
  }

  const { data: ofertaData, error: ofertaError } = await supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('id', ofertaId)
    .single();
  if (ofertaError) throw ofertaError;
  const oferta = ofertaData as OfertaViajero;

  const restantes = getKilosRestantes(oferta);
  if (kilos > restantes) {
    throw new Error(`Solo quedan ${restantes.toFixed(1)} kg disponibles en este viaje.`);
  }

  const precio_total = kilos * oferta.precio_kg;

  const { data, error } = await supabase
    .from('reservas_viajero')
    .insert({
      oferta_id: ofertaId,
      cliente_id: clienteId,
      kilos_solicitados: kilos,
      precio_total,
      mensaje_cliente: mensaje?.trim() || null,
      acepto_terminos: true,
      estado: 'pendiente',
    })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from('ofertas_viajero')
    .update({ kilos_reservados: oferta.kilos_reservados + kilos })
    .eq('id', ofertaId);

  const viajero = await obtenerContacto(oferta.viajero_id);
  if (viajero.email) {
    await enviarNotificacionReserva('nueva_solicitud', viajero.email, viajero.nombre, {
      provincia_destino: oferta.provincia_destino,
      fecha_salida: oferta.fecha_salida,
    });
  }

  return data as ReservaViajero;
}

/** El viajero acepta una solicitud: revela el contacto al cliente por email. */
export async function aceptarReserva(reservaId: string): Promise<void> {
  const { data: reservaData, error: reservaError } = await supabase
    .from('reservas_viajero')
    .select('*')
    .eq('id', reservaId)
    .single();
  if (reservaError) throw reservaError;
  const reserva = reservaData as ReservaViajero;

  const { error } = await supabase
    .from('reservas_viajero')
    .update({ estado: 'aceptada', respondida_at: new Date().toISOString() })
    .eq('id', reservaId);
  if (error) throw error;

  const { data: ofertaData } = await supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('id', reserva.oferta_id)
    .single();
  const oferta = ofertaData as OfertaViajero;

  const [cliente, viajero] = await Promise.all([
    obtenerContacto(reserva.cliente_id),
    obtenerContacto(oferta.viajero_id),
  ]);

  if (cliente.email) {
    await enviarNotificacionReserva(
      'aceptada',
      cliente.email,
      cliente.nombre,
      { provincia_destino: oferta.provincia_destino, fecha_salida: oferta.fecha_salida },
      viajero,
    );
  }
}

/** El viajero rechaza una solicitud: libera el cupo y notifica al cliente. */
export async function rechazarReserva(reservaId: string, motivo?: string): Promise<void> {
  const { data: reservaData, error: reservaError } = await supabase
    .from('reservas_viajero')
    .select('*')
    .eq('id', reservaId)
    .single();
  if (reservaError) throw reservaError;
  const reserva = reservaData as ReservaViajero;

  const { error } = await supabase
    .from('reservas_viajero')
    .update({
      estado: 'rechazada',
      motivo_rechazo: motivo?.trim() || null,
      respondida_at: new Date().toISOString(),
    })
    .eq('id', reservaId);
  if (error) throw error;

  const { data: ofertaData } = await supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('id', reserva.oferta_id)
    .single();
  const oferta = ofertaData as OfertaViajero;

  await supabase
    .from('ofertas_viajero')
    .update({ kilos_reservados: Math.max(0, oferta.kilos_reservados - reserva.kilos_solicitados) })
    .eq('id', oferta.id);

  const cliente = await obtenerContacto(reserva.cliente_id);
  if (cliente.email) {
    await enviarNotificacionReserva(
      'rechazada',
      cliente.email,
      cliente.nombre,
      { provincia_destino: oferta.provincia_destino, fecha_salida: oferta.fecha_salida },
      undefined,
      motivo,
    );
  }
}

/** El cliente cancela su propia reserva pendiente: libera el cupo. */
export async function cancelarReserva(reservaId: string): Promise<void> {
  const { data: reservaData, error: reservaError } = await supabase
    .from('reservas_viajero')
    .select('*')
    .eq('id', reservaId)
    .single();
  if (reservaError) throw reservaError;
  const reserva = reservaData as ReservaViajero;

  const { error } = await supabase
    .from('reservas_viajero')
    .update({ estado: 'cancelada' })
    .eq('id', reservaId);
  if (error) throw error;

  const { data: ofertaData } = await supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('id', reserva.oferta_id)
    .single();
  const oferta = ofertaData as OfertaViajero;

  await supabase
    .from('ofertas_viajero')
    .update({ kilos_reservados: Math.max(0, oferta.kilos_reservados - reserva.kilos_solicitados) })
    .eq('id', oferta.id);
}

/** Reservas hechas por un cliente, con datos de la oferta y, si está aceptada, el contacto del viajero. */
export async function getMisReservas(clienteId: string): Promise<ReservaViajero[]> {
  const { data, error } = await supabase
    .from('reservas_viajero')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const reservas = (data as ReservaViajero[]) || [];
  if (reservas.length === 0) return reservas;

  const ofertaIds = [...new Set(reservas.map((r) => r.oferta_id))];
  const { data: ofertasData } = await supabase.from('ofertas_viajero').select('*').in('id', ofertaIds);
  const ofertasPorId = new Map(((ofertasData as OfertaViajero[]) || []).map((o) => [o.id, o]));

  return Promise.all(
    reservas.map(async (r) => {
      const oferta = ofertasPorId.get(r.oferta_id);
      const enriquecida: ReservaViajero = { ...r, oferta };
      if (r.estado === 'aceptada' && oferta) {
        enriquecida.contacto = await obtenerContacto(oferta.viajero_id);
      }
      return enriquecida;
    }),
  );
}

/** Reservas recibidas sobre las ofertas de un viajero, con datos del cliente y, si está aceptada, su contacto. */
export async function getSolicitudesRecibidas(viajeroId: string): Promise<ReservaViajero[]> {
  const { data: ofertasData, error: ofertasError } = await supabase
    .from('ofertas_viajero')
    .select('*')
    .eq('viajero_id', viajeroId);
  if (ofertasError) throw ofertasError;
  const ofertas = (ofertasData as OfertaViajero[]) || [];
  const ofertasPorId = new Map(ofertas.map((o) => [o.id, o]));
  if (ofertas.length === 0) return [];

  const { data, error } = await supabase
    .from('reservas_viajero')
    .select('*')
    .in('oferta_id', ofertas.map((o) => o.id))
    .order('created_at', { ascending: false });
  if (error) throw error;
  const reservas = (data as ReservaViajero[]) || [];

  return Promise.all(
    reservas.map(async (r) => {
      const enriquecida: ReservaViajero = { ...r, oferta: ofertasPorId.get(r.oferta_id) };
      const contactoCliente = await obtenerContacto(r.cliente_id);
      enriquecida.cliente_nombre = contactoCliente.nombre;
      if (r.estado === 'aceptada') {
        enriquecida.contacto = contactoCliente;
      }
      return enriquecida;
    }),
  );
}
