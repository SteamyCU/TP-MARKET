-- Fase 23: Sistema centralizado de cupones.
-- Unifica códigos de referido de influencers con cupones generales del admin.

create table if not exists public.cupones (
  id              uuid primary key default gen_random_uuid(),
  codigo          text unique not null,
  tipo            text not null check (tipo in ('general', 'influencer')),
  influencer_id   uuid references public.profiles(id) on delete set null,
  descuento_tipo  text not null default 'porcentaje'
                  check (descuento_tipo in ('porcentaje', 'fijo')),
  descuento_valor numeric(10,2) not null default 0,
  descripcion     text,
  activo          boolean not null default true,
  fecha_inicio    timestamptz,
  fecha_fin       timestamptz,
  usos_maximos    integer,
  usos_actuales   integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists cupones_codigo_idx        on public.cupones (codigo);
create index if not exists cupones_influencer_id_idx on public.cupones (influencer_id);

-- Backfill: migrar codigoReferido existentes de perfiles de influencers y agentes
insert into public.cupones
  (codigo, tipo, influencer_id, descuento_tipo, descuento_valor, descripcion, activo)
select
  extra->>'codigoReferido',
  'influencer',
  id,
  'porcentaje',
  5,
  'Código de referido (migrado)',
  true
from public.profiles
where extra->>'codigoReferido' is not null
  and role in ('influencer', 'agente')
on conflict (codigo) do nothing;

-- RLS
alter table public.cupones enable row level security;

-- Lectura pública: necesaria para validar códigos antes del registro (anon + cualquier auth)
create policy "cupones_public_select"
  on public.cupones for select using (true);

-- Admin: acceso total a escritura
create policy "cupones_admin_write"
  on public.cupones for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Influencer: puede actualizar su propio cupón (cambiar código, descripción, etc.)
create policy "cupones_influencer_update_own"
  on public.cupones for update
  using  (influencer_id = auth.uid())
  with check (influencer_id = auth.uid());

-- Función SECURITY DEFINER para aplicar un cupón de forma atómica:
-- valida el cupón, incrementa usos_actuales y devuelve los datos.
-- Se ejecuta como el propietario de la función (superuser), eludiendo RLS en usos_actuales.
create or replace function public.aplicar_cupon_referido(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cupon public.cupones%rowtype;
begin
  select * into v_cupon
  from   public.cupones
  where  codigo        = upper(trim(p_codigo))
    and  activo        = true
    and  (fecha_inicio is null or fecha_inicio <= now())
    and  (fecha_fin    is null or fecha_fin    >= now())
    and  (usos_maximos is null or usos_actuales < usos_maximos)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Cupón no encontrado, inactivo o agotado');
  end if;

  update public.cupones
  set    usos_actuales = usos_actuales + 1
  where  id = v_cupon.id;

  return jsonb_build_object(
    'ok',              true,
    'id',              v_cupon.id,
    'codigo',          v_cupon.codigo,
    'tipo',            v_cupon.tipo,
    'influencer_id',   v_cupon.influencer_id,
    'descuento_tipo',  v_cupon.descuento_tipo,
    'descuento_valor', v_cupon.descuento_valor,
    'descripcion',     v_cupon.descripcion
  );
end;
$$;
