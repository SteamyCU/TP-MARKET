import { supabase } from '../supabase';

export interface Cupon {
  id: string;
  codigo: string;
  tipo: 'general' | 'influencer';
  influencer_id: string | null;
  descuento_tipo: 'porcentaje' | 'fijo';
  descuento_valor: number;
  descripcion: string | null;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
  created_at: string;
  influencer_nombre?: string | null;
  influencer_email?: string | null;
}

export interface CuponValidado {
  id: string;
  codigo: string;
  tipo: 'general' | 'influencer';
  influencer_id: string | null;
  descuento_tipo: 'porcentaje' | 'fijo';
  descuento_valor: number;
  descripcion: string | null;
}

export interface NuevoCuponGeneral {
  codigo: string;
  descuento_tipo: 'porcentaje' | 'fijo';
  descuento_valor: number;
  descripcion?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  usos_maximos?: number | null;
}

export interface ActualizarCuponInput {
  descuento_tipo?: 'porcentaje' | 'fijo';
  descuento_valor?: number;
  descripcion?: string | null;
  activo?: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  usos_maximos?: number | null;
}

function normalizarCodigo(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').slice(0, 20);
}

export async function getCupones(): Promise<Cupon[]> {
  const { data, error } = await supabase
    .from('cupones')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const cupones = (data || []) as Cupon[];

  const influencerIds = [
    ...new Set(cupones.filter((c) => c.influencer_id).map((c) => c.influencer_id as string)),
  ];
  if (influencerIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, email, extra')
      .in('id', influencerIds);
    const porId = new Map(((perfiles as any[]) || []).map((p) => [p.id, p]));
    for (const c of cupones) {
      if (c.influencer_id) {
        const p = porId.get(c.influencer_id) as any;
        c.influencer_nombre = p?.extra?.name || null;
        c.influencer_email = p?.email || null;
      }
    }
  }

  return cupones;
}

export async function crearCuponGeneral(data: NuevoCuponGeneral): Promise<Cupon> {
  const codigo = normalizarCodigo(data.codigo);
  if (codigo.length < 3) throw new Error('El código debe tener al menos 3 caracteres');

  const { data: row, error } = await supabase
    .from('cupones')
    .insert({
      codigo,
      tipo: 'general',
      influencer_id: null,
      descuento_tipo: data.descuento_tipo,
      descuento_valor: data.descuento_valor,
      descripcion: data.descripcion || null,
      fecha_inicio: data.fecha_inicio || null,
      fecha_fin: data.fecha_fin || null,
      usos_maximos: data.usos_maximos || null,
      activo: true,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Este código ya existe');
    throw error;
  }
  return row as Cupon;
}

export async function actualizarCupon(id: string, data: ActualizarCuponInput): Promise<void> {
  const { error } = await supabase.from('cupones').update(data).eq('id', id);
  if (error) throw error;
}

export async function toggleActivoCupon(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from('cupones').update({ activo }).eq('id', id);
  if (error) throw error;
}

/**
 * Busca un cupón activo y válido por código. Solo valida, no incrementa usos.
 * Devuelve null si no existe, está inactivo, vencido o agotado.
 */
export async function buscarCupon(codigo: string): Promise<CuponValidado | null> {
  const { data, error } = await supabase
    .from('cupones')
    .select('id, codigo, tipo, influencer_id, descuento_tipo, descuento_valor, descripcion, activo, fecha_inicio, fecha_fin, usos_maximos, usos_actuales')
    .eq('codigo', normalizarCodigo(codigo))
    .eq('activo', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const c = data as any;
  const ahora = new Date();
  if (c.fecha_inicio && new Date(c.fecha_inicio) > ahora) return null;
  if (c.fecha_fin && new Date(c.fecha_fin) < ahora) return null;
  if (c.usos_maximos != null && c.usos_actuales >= c.usos_maximos) return null;

  return {
    id: c.id,
    codigo: c.codigo,
    tipo: c.tipo,
    influencer_id: c.influencer_id,
    descuento_tipo: c.descuento_tipo,
    descuento_valor: c.descuento_valor,
    descripcion: c.descripcion,
  };
}

/**
 * Aplica un cupón: valida e incrementa usos_actuales de forma atómica vía RPC.
 * Devuelve los datos del cupón aplicado, o null si no era válido.
 */
export async function aplicarCupon(codigo: string): Promise<CuponValidado | null> {
  const { data, error } = await supabase.rpc('aplicar_cupon_referido', { p_codigo: codigo });
  if (error) {
    console.error('Error aplicando cupón:', error.message);
    return null;
  }
  const result = data as any;
  if (!result?.ok) {
    console.warn('Cupón no aplicado:', result?.error);
    return null;
  }
  return {
    id: result.id,
    codigo: result.codigo,
    tipo: result.tipo,
    influencer_id: result.influencer_id,
    descuento_tipo: result.descuento_tipo,
    descuento_valor: result.descuento_valor,
    descripcion: result.descripcion,
  };
}

/**
 * Actualiza el código de referido propio de un influencer.
 * Valida unicidad en la tabla cupones, actualiza cupones + profiles.extra en sincronía.
 */
export async function actualizarCodigoPropioInfluencer(
  uid: string,
  nuevoCodigo: string,
): Promise<string> {
  const normalizado = normalizarCodigo(nuevoCodigo);
  if (normalizado.length < 4) {
    throw new Error('El código debe tener al menos 4 caracteres válidos (letras, números o guiones).');
  }

  const { data: existente, error: errBuscar } = await supabase
    .from('cupones')
    .select('id, codigo')
    .eq('influencer_id', uid)
    .maybeSingle();
  if (errBuscar) throw errBuscar;

  const { data: conflicto, error: errConflicto } = await supabase
    .from('cupones')
    .select('id')
    .eq('codigo', normalizado)
    .maybeSingle();
  if (errConflicto) throw errConflicto;
  if (conflicto && conflicto.id !== existente?.id) {
    throw new Error('Este código ya está en uso, prueba otro');
  }

  if (existente) {
    const { error: errUpdate } = await supabase
      .from('cupones')
      .update({ codigo: normalizado })
      .eq('id', existente.id);
    if (errUpdate) throw errUpdate;
  } else {
    const { error: errInsert } = await supabase.from('cupones').insert({
      codigo: normalizado,
      tipo: 'influencer',
      influencer_id: uid,
      descuento_tipo: 'porcentaje',
      descuento_valor: 5,
      activo: true,
    });
    if (errInsert) {
      if (errInsert.code === '23505') throw new Error('Este código ya está en uso, prueba otro');
      throw errInsert;
    }
  }

  // Mantener profiles.extra.codigoReferido sincronizado
  const { data: perfil } = await supabase.from('profiles').select('extra').eq('id', uid).single();
  const extra = ((perfil as any)?.extra as Record<string, unknown>) || {};
  await supabase.from('profiles').update({ extra: { ...extra, codigoReferido: normalizado } }).eq('id', uid);

  return normalizado;
}
