// Programa "Invita y Gana" (Fase 31): sistema de referidos exclusivo entre
// clientes del portal. El referente gana 5 € por cada bloque de 10 kg del PRIMER
// envío de su referido (una sola vez); el referido recibe 10 % de descuento +
// domicilio gratis en ese primer envío.
//
// IMPORTANTE sobre identificadores: referidos_clientes y creditos_cliente
// referencian profiles(id) (el id de perfil del cliente del portal), NO
// clientes.id. El enlace con 'clientes'/'paquetes' es clientes.user_id =
// profiles.id. Por eso las funciones reciben/devuelven SIEMPRE profile ids.

import { supabase } from '../supabase';

export const PREMIO_POR_BLOQUE = 5; // €
export const KG_POR_BLOQUE = 10;

export type EstadoReferido = 'pendiente' | 'premiado' | 'sospechoso' | 'sin_premio';

export interface ReferidoRow {
  id: string;
  referente_id: string;
  referido_id: string;
  codigo_usado: string;
  estado: EstadoReferido;
  monto_premio: number | null;
  paquete_primer_envio_id: string | null;
  created_at: string;
}

export interface CreditoRow {
  id: string;
  cliente_id: string;
  monto: number;
  motivo: string;
  referido_id: string | null;
  usado: boolean;
  paquete_uso_id: string | null;
  aplicado_por: string | null;
  created_at: string;
}

export interface DestinatarioComparable {
  nombre?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  documentoIdentidad?: string | null;
}

function normalizar(v: unknown): string {
  return String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizarTelefono(v: unknown): string {
  return String(v ?? '').replace(/\D/g, '');
}

// ───────────────────────────────────────────────────────────────────────────
// Código del cliente (reutiliza la tabla 'cupones')
// ───────────────────────────────────────────────────────────────────────────

function generarCodigoBase(nombre: string): string {
  const limpio = (nombre || 'CLIENTE')
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'CLIENTE';
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${limpio}-${sufijo}`.slice(0, 20);
}

/**
 * Devuelve el código de referido del cliente, creándolo en 'cupones' si aún no
 * existe (tipo 'cliente_referido', 10 % de descuento, influencer_id = su id).
 */
export async function obtenerOCrearCodigoCliente(clienteId: string, nombre: string): Promise<string> {
  const { data: existente, error: errBuscar } = await supabase
    .from('cupones')
    .select('codigo')
    .eq('influencer_id', clienteId)
    .eq('tipo', 'cliente_referido')
    .maybeSingle();
  if (errBuscar) throw errBuscar;
  if (existente?.codigo) return existente.codigo as string;

  // Reintenta ante colisión de código (índice único en cupones.codigo).
  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigoBase(nombre);
    const { error } = await supabase.from('cupones').insert({
      codigo,
      tipo: 'cliente_referido',
      influencer_id: clienteId,
      descuento_tipo: 'porcentaje',
      descuento_valor: 10,
      descripcion: 'Código Invita y Gana',
      activo: true,
    });
    if (!error) return codigo;
    if (error.code !== '23505') throw error; // 23505 = unique_violation → reintentar
  }
  throw new Error('No se pudo generar un código único, inténtalo de nuevo.');
}

// ───────────────────────────────────────────────────────────────────────────
// Registro del referido
// ───────────────────────────────────────────────────────────────────────────

/**
 * Registra que `nuevoClienteId` (profile id) se dio de alta usando `codigoUsado`.
 * Crea una fila 'pendiente' en referidos_clientes. No-op si el código no es de un
 * cliente, si es auto-referencia, o si el referido ya estaba registrado.
 */
export async function registrarReferido(codigoUsado: string, nuevoClienteId: string | null): Promise<void> {
  if (!codigoUsado || !nuevoClienteId) return;

  const { data: cupon, error: errCupon } = await supabase
    .from('cupones')
    .select('codigo, tipo, influencer_id')
    .eq('codigo', codigoUsado.toUpperCase())
    .eq('tipo', 'cliente_referido')
    .maybeSingle();
  if (errCupon) throw errCupon;
  if (!cupon?.influencer_id) return; // no es un código de cliente

  const referenteId = cupon.influencer_id as string;
  if (referenteId === nuevoClienteId) return; // no se puede referir a sí mismo

  const { error } = await supabase.from('referidos_clientes').insert({
    referente_id: referenteId,
    referido_id: nuevoClienteId,
    codigo_usado: cupon.codigo,
    estado: 'pendiente',
  });
  // 23505 = ya existe una fila para ese referido (unique(referido_id)): ignorar.
  if (error && error.code !== '23505') throw error;
}

// ───────────────────────────────────────────────────────────────────────────
// Beneficios del referido en su primer envío (lado Recepción)
// ───────────────────────────────────────────────────────────────────────────

/** True si el cliente tiene un primer envío de referido pendiente de consumir. */
export async function esPrimerEnvioComoReferido(clienteId: string | null): Promise<boolean> {
  if (!clienteId) return false;
  const { data, error } = await supabase
    .from('referidos_clientes')
    .select('id')
    .eq('referido_id', clienteId)
    .eq('estado', 'pendiente')
    .is('paquete_primer_envio_id', null)
    .maybeSingle();
  if (error) {
    console.error('Error comprobando primer envío de referido:', error.message);
    return false;
  }
  return !!data;
}

/** Marca el primer envío del referido como consumido, reservando su paquete. */
export async function marcarPrimerEnvioUsado(
  referidoId: string,
  paqueteId: string,
  _operadorId: string,
): Promise<void> {
  const { error } = await supabase
    .from('referidos_clientes')
    .update({ paquete_primer_envio_id: paqueteId })
    .eq('referido_id', referidoId)
    .eq('estado', 'pendiente')
    .is('paquete_primer_envio_id', null);
  if (error) throw error;
}

// ───────────────────────────────────────────────────────────────────────────
// Crédito acumulado del cliente
// ───────────────────────────────────────────────────────────────────────────

/** Suma de los créditos no usados de un cliente (profile id). */
export async function getCreditoDisponible(clienteId: string | null): Promise<number> {
  if (!clienteId) return 0;
  const { data, error } = await supabase
    .from('creditos_cliente')
    .select('monto')
    .eq('cliente_id', clienteId)
    .eq('usado', false);
  if (error) {
    console.error('Error cargando crédito disponible:', error.message);
    return 0;
  }
  return (data || []).reduce((acc, r) => acc + Number((r as { monto: number }).monto || 0), 0);
}

/**
 * Consume créditos no usados (más antiguos primero) hasta cubrir `monto`,
 * marcándolos como usados y vinculándolos al paquete y operador.
 * Devuelve el importe efectivamente aplicado.
 */
export async function aplicarCreditoAPago(
  clienteId: string,
  monto: number,
  paqueteId: string,
  operadorId: string,
): Promise<number> {
  if (!clienteId || monto <= 0) return 0;
  const { data, error } = await supabase
    .from('creditos_cliente')
    .select('id, monto')
    .eq('cliente_id', clienteId)
    .eq('usado', false)
    .order('created_at', { ascending: true });
  if (error) throw error;

  let restante = monto;
  let aplicado = 0;
  const ids: string[] = [];
  for (const fila of (data || []) as { id: string; monto: number }[]) {
    if (restante <= 0.001) break;
    ids.push(fila.id);
    aplicado += Number(fila.monto || 0);
    restante -= Number(fila.monto || 0);
  }
  if (ids.length === 0) return 0;

  const { error: errUpdate } = await supabase
    .from('creditos_cliente')
    .update({ usado: true, paquete_uso_id: paqueteId, aplicado_por: operadorId })
    .in('id', ids);
  if (errUpdate) throw errUpdate;
  return Math.round(aplicado * 100) / 100;
}

// ───────────────────────────────────────────────────────────────────────────
// Procesado del premio al entregar el primer envío del referido
// ───────────────────────────────────────────────────────────────────────────

/** Reúne los destinatarios usados por un referente (tabla destinatarios + snapshots en paquetes). */
async function destinatariosDelReferente(referenteId: string): Promise<DestinatarioComparable[]> {
  // referente_id (profile) → clientes.id (vía user_id)
  const { data: clienteRows } = await supabase
    .from('clientes')
    .select('id')
    .eq('user_id', referenteId);
  const clienteIds = ((clienteRows || []) as { id: string }[]).map((c) => c.id);
  const resultado: DestinatarioComparable[] = [];
  if (clienteIds.length === 0) return resultado;

  const { data: dests } = await supabase
    .from('destinatarios')
    .select('nombre, direccion, telefono_cuba, carnet_pasaporte')
    .in('cliente_id', clienteIds);
  for (const d of (dests || []) as Record<string, unknown>[]) {
    resultado.push({
      nombre: d.nombre as string,
      direccion: d.direccion as string,
      telefono: d.telefono_cuba as string,
      documentoIdentidad: d.carnet_pasaporte as string,
    });
  }

  const { data: pkgs } = await supabase
    .from('paquetes')
    .select('destinatario_nombre, destinatario_direccion, destinatario_telefono, destinatario_documento')
    .in('cliente_id', clienteIds);
  for (const p of (pkgs || []) as Record<string, unknown>[]) {
    resultado.push({
      nombre: p.destinatario_nombre as string,
      direccion: p.destinatario_direccion as string,
      telefono: p.destinatario_telefono as string,
      documentoIdentidad: p.destinatario_documento as string,
    });
  }
  return resultado;
}

/** True si `dest` coincide (nombre/dirección/teléfono/DNI) con alguno de `lista`. */
function hayCoincidencia(dest: DestinatarioComparable, lista: DestinatarioComparable[]): boolean {
  const nombre = normalizar(dest.nombre);
  const direccion = normalizar(dest.direccion);
  const telefono = normalizarTelefono(dest.telefono);
  const documento = normalizar(dest.documentoIdentidad);
  return lista.some((d) => {
    if (nombre && normalizar(d.nombre) === nombre) return true;
    if (direccion && normalizar(d.direccion) === direccion) return true;
    if (telefono && telefono.length >= 6 && normalizarTelefono(d.telefono) === telefono) return true;
    if (documento && normalizar(d.documentoIdentidad) === documento) return true;
    return false;
  });
}

/**
 * Calcula el premio del referente cuando se entrega el PRIMER envío del referido.
 *  - Coincidencia de destinatario con los del referente → 'sospechoso' (sin crédito).
 *  - Sin coincidencia y peso ≥ 10 kg → 'premiado' + crédito de 5 €/10 kg.
 *  - Sin coincidencia y peso < 10 kg → 'sin_premio'.
 * Idempotente: solo actúa sobre filas 'pendiente'.
 */
export async function procesarPrimerEnvioReferido(
  referidoId: string,
  paqueteId: string,
  pesoKg: number,
  destinatarioDelPaquete: DestinatarioComparable,
): Promise<EstadoReferido | null> {
  const { data: fila, error } = await supabase
    .from('referidos_clientes')
    .select('*')
    .eq('referido_id', referidoId)
    .eq('estado', 'pendiente')
    .maybeSingle();
  if (error) throw error;
  if (!fila) return null;
  const ref = fila as ReferidoRow;

  // El premio se ata al primer envío. Si ya hay un paquete reservado y este no es
  // ese paquete, no es el primer envío → no procesar.
  if (ref.paquete_primer_envio_id && ref.paquete_primer_envio_id !== paqueteId) return null;

  const lista = await destinatariosDelReferente(ref.referente_id);
  const sospechoso = hayCoincidencia(destinatarioDelPaquete, lista);

  if (sospechoso) {
    await supabase
      .from('referidos_clientes')
      .update({ estado: 'sospechoso', monto_premio: null, paquete_primer_envio_id: paqueteId })
      .eq('id', ref.id)
      .eq('estado', 'pendiente');
    return 'sospechoso';
  }

  const bloques = Math.floor((pesoKg || 0) / KG_POR_BLOQUE);
  const monto = bloques * PREMIO_POR_BLOQUE;

  if (monto <= 0) {
    await supabase
      .from('referidos_clientes')
      .update({ estado: 'sin_premio', monto_premio: 0, paquete_primer_envio_id: paqueteId })
      .eq('id', ref.id)
      .eq('estado', 'pendiente');
    return 'sin_premio';
  }

  // Marca como premiado y registra el crédito del referente (idempotente: el
  // update por estado='pendiente' evita doble inserción si se reintenta).
  const { data: actualizado, error: errUpd } = await supabase
    .from('referidos_clientes')
    .update({ estado: 'premiado', monto_premio: monto, paquete_primer_envio_id: paqueteId })
    .eq('id', ref.id)
    .eq('estado', 'pendiente')
    .select('id')
    .maybeSingle();
  if (errUpd) throw errUpd;
  if (!actualizado) return null; // otra ejecución se nos adelantó

  const { error: errCredito } = await supabase.from('creditos_cliente').insert({
    cliente_id: ref.referente_id,
    monto,
    motivo: 'Premio por primer envío de referido',
    referido_id: ref.referido_id,
  });
  if (errCredito) throw errCredito;
  return 'premiado';
}

/**
 * Orquesta el procesado al entregar un paquete (se llama fire-and-forget desde
 * el cambio de estado a 'Entregado'). Mapea el paquete → cliente → profile y, si
 * corresponde, calcula el premio del referente.
 */
export async function procesarEntregaParaReferidos(paqueteId: string): Promise<void> {
  const { data: pkg, error } = await supabase
    .from('paquetes')
    .select('id, cliente_id, peso, destinatario_nombre, destinatario_direccion, destinatario_telefono, destinatario_documento')
    .eq('id', paqueteId)
    .maybeSingle();
  if (error || !pkg) return;
  const p = pkg as Record<string, unknown>;
  if (!p.cliente_id) return;

  const { data: clienteRow } = await supabase
    .from('clientes')
    .select('user_id')
    .eq('id', p.cliente_id as string)
    .maybeSingle();
  const referidoProfileId = (clienteRow as { user_id: string | null } | null)?.user_id;
  if (!referidoProfileId) return;

  await procesarPrimerEnvioReferido(referidoProfileId, p.id as string, Number(p.peso || 0), {
    nombre: p.destinatario_nombre as string,
    direccion: p.destinatario_direccion as string,
    telefono: p.destinatario_telefono as string,
    documentoIdentidad: p.destinatario_documento as string,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Vista del cliente: código, link, mensajes para compartir y estadísticas
// ───────────────────────────────────────────────────────────────────────────

export interface ReferidoVista {
  id: string;
  referido_id: string;
  referido_nombre: string;
  estado: EstadoReferido;
  monto_premio: number | null;
  created_at: string;
}

export interface MiCodigoYEstadisticas {
  codigo: string;
  link: string;
  whatsappUrl: string;
  emailUrl: string;
  mensaje: string;
  referidos: ReferidoVista[];
  totalInvitados: number;
  totalPremiados: number;
  creditoDisponible: number;
}

export async function getMiCodigoYEstadisticas(
  clienteId: string,
  nombre: string,
): Promise<MiCodigoYEstadisticas> {
  const codigo = await obtenerOCrearCodigoCliente(clienteId, nombre);
  const link = `${window.location.origin}/login?mode=register&role=cliente&ref=${codigo}`;

  const mensaje =
    `¡Te invito a ToPaquete para enviar paquetes a Cuba! 🇨🇺📦 ` +
    `Usa mi código ${codigo} al registrarte y obtén 10% de descuento + domicilio gratis ` +
    `en tu primer envío. Regístrate aquí: ${link}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  const emailUrl =
    `mailto:?subject=${encodeURIComponent('Te invito a ToPaquete (10% + domicilio gratis)')}` +
    `&body=${encodeURIComponent(mensaje)}`;

  const { data: refsData, error } = await supabase
    .from('referidos_clientes')
    .select('id, referido_id, estado, monto_premio, created_at')
    .eq('referente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const refs = (refsData || []) as Omit<ReferidoVista, 'referido_nombre'>[];

  // Nombres de los referidos (desde profiles.extra.name)
  const ids = [...new Set(refs.map((r) => r.referido_id))];
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: perfiles } = await supabase.from('profiles').select('id, email, extra').in('id', ids);
    for (const pf of ((perfiles || []) as { id: string; email: string; extra: Record<string, unknown> }[])) {
      nombres.set(pf.id, (pf.extra?.name as string) || pf.email || 'Cliente');
    }
  }

  const referidos: ReferidoVista[] = refs.map((r) => ({
    ...r,
    referido_nombre: nombres.get(r.referido_id) || 'Cliente',
  }));

  const creditoDisponible = await getCreditoDisponible(clienteId);

  return {
    codigo,
    link,
    whatsappUrl,
    emailUrl,
    mensaje,
    referidos,
    totalInvitados: referidos.length,
    totalPremiados: referidos.filter((r) => r.estado === 'premiado').length,
    creditoDisponible,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Panel admin: historial y cola de sospechosos
// ───────────────────────────────────────────────────────────────────────────

export interface ReferidoAdmin {
  id: string;
  referente_id: string;
  referente_nombre: string;
  referido_id: string;
  referido_nombre: string;
  estado: EstadoReferido;
  monto_premio: number | null;
  paquete_primer_envio_id: string | null;
  created_at: string;
  destinatarioPaquete?: DestinatarioComparable | null;
}

async function adornarConNombres(rows: ReferidoRow[]): Promise<ReferidoAdmin[]> {
  const ids = [...new Set(rows.flatMap((r) => [r.referente_id, r.referido_id]))];
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: perfiles } = await supabase.from('profiles').select('id, email, extra').in('id', ids);
    for (const pf of ((perfiles || []) as { id: string; email: string; extra: Record<string, unknown> }[])) {
      nombres.set(pf.id, (pf.extra?.name as string) || pf.email || '—');
    }
  }
  return rows.map((r) => ({
    id: r.id,
    referente_id: r.referente_id,
    referente_nombre: nombres.get(r.referente_id) || '—',
    referido_id: r.referido_id,
    referido_nombre: nombres.get(r.referido_id) || '—',
    estado: r.estado,
    monto_premio: r.monto_premio,
    paquete_primer_envio_id: r.paquete_primer_envio_id,
    created_at: r.created_at,
  }));
}

/** Historial de premios otorgados (estado 'premiado'). */
export async function getHistorialPremios(): Promise<ReferidoAdmin[]> {
  const { data, error } = await supabase
    .from('referidos_clientes')
    .select('*')
    .eq('estado', 'premiado')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return adornarConNombres((data || []) as ReferidoRow[]);
}

/** Cola de revisión manual: referidos marcados como 'sospechoso'. */
export async function getReferidosSospechosos(): Promise<ReferidoAdmin[]> {
  const { data, error } = await supabase
    .from('referidos_clientes')
    .select('*')
    .eq('estado', 'sospechoso')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const adornados = await adornarConNombres((data || []) as ReferidoRow[]);

  // Añade el destinatario del paquete del primer envío para que el admin vea
  // qué datos coincidieron.
  const paqueteIds = adornados.map((a) => a.paquete_primer_envio_id).filter(Boolean) as string[];
  if (paqueteIds.length > 0) {
    const { data: pkgs } = await supabase
      .from('paquetes')
      .select('id, destinatario_nombre, destinatario_direccion, destinatario_telefono, destinatario_documento')
      .in('id', paqueteIds);
    const porId = new Map(((pkgs || []) as Record<string, unknown>[]).map((p) => [p.id as string, p]));
    for (const a of adornados) {
      const p = a.paquete_primer_envio_id ? porId.get(a.paquete_primer_envio_id) : null;
      if (p) {
        a.destinatarioPaquete = {
          nombre: p.destinatario_nombre as string,
          direccion: p.destinatario_direccion as string,
          telefono: p.destinatario_telefono as string,
          documentoIdentidad: p.destinatario_documento as string,
        };
      }
    }
  }
  return adornados;
}

/** Aprueba manualmente el premio de un referido sospechoso (admin). */
export async function aprobarPremioManual(referidoFilaId: string, operadorId: string): Promise<void> {
  const { data: fila, error } = await supabase
    .from('referidos_clientes')
    .select('*')
    .eq('id', referidoFilaId)
    .eq('estado', 'sospechoso')
    .maybeSingle();
  if (error) throw error;
  if (!fila) return;
  const ref = fila as ReferidoRow;

  // Recalcula el premio sobre el peso del paquete del primer envío.
  let pesoKg = 0;
  if (ref.paquete_primer_envio_id) {
    const { data: pkg } = await supabase
      .from('paquetes')
      .select('peso')
      .eq('id', ref.paquete_primer_envio_id)
      .maybeSingle();
    pesoKg = Number((pkg as { peso: number } | null)?.peso || 0);
  }
  const bloques = Math.floor(pesoKg / KG_POR_BLOQUE);
  const monto = bloques * PREMIO_POR_BLOQUE;

  const { data: actualizado, error: errUpd } = await supabase
    .from('referidos_clientes')
    .update({ estado: 'premiado', monto_premio: monto })
    .eq('id', ref.id)
    .eq('estado', 'sospechoso')
    .select('id')
    .maybeSingle();
  if (errUpd) throw errUpd;
  if (!actualizado) return;

  if (monto > 0) {
    const { error: errCredito } = await supabase.from('creditos_cliente').insert({
      cliente_id: ref.referente_id,
      monto,
      motivo: 'Premio por primer envío de referido (aprobado manualmente)',
      referido_id: ref.referido_id,
      aplicado_por: operadorId,
    });
    if (errCredito) throw errCredito;
  }
}

/** Descarta un referido sospechoso: queda en 'sin_premio' definitivo (admin). */
export async function descartarReferidoSospechoso(referidoFilaId: string): Promise<void> {
  const { error } = await supabase
    .from('referidos_clientes')
    .update({ estado: 'sin_premio', monto_premio: 0 })
    .eq('id', referidoFilaId)
    .eq('estado', 'sospechoso');
  if (error) throw error;
}
