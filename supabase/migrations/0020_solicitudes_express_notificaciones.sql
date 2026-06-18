-- ToPaquete · Programa de Viajeros: lado de la demanda + notificaciones in-app.
--
-- NOTA DE NUMERACIÓN: el encargo pedía 0018_solicitudes_express_notificaciones,
-- pero 0018 ya estaba ocupado (0018_precio_express_normal.sql). Se usa 0020.
--
-- solicitudes_express: un cliente publica que NECESITA enviar Express (destino,
--   fecha límite, kilos, precio dispuesto a pagar). Cuando un viajero publica una
--   oferta que coincide, se le notifica (email + in-app) y la solicitud pasa a
--   'notificado'. El admin las ve todas para priorizar a qué viajeros contactar.
-- notificaciones: bandeja in-app por usuario (campanita del Topbar).
--
-- Idempotente.

create table if not exists public.solicitudes_express (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles(id),
  provincia_destino text not null,
  fecha_necesaria date not null,
  kilos_necesarios numeric not null,
  precio_dispuesto_kg numeric not null,
  notas text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','notificado','cumplida','cancelada')),
  created_at timestamptz not null default now()
);

create index if not exists solicitudes_express_cliente_idx   on public.solicitudes_express(cliente_id);
create index if not exists solicitudes_express_estado_idx    on public.solicitudes_express(estado);
create index if not exists solicitudes_express_provincia_idx on public.solicitudes_express(provincia_destino);

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  titulo text not null,
  mensaje text not null,
  tipo text default 'general',
  link text,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_user_idx  on public.notificaciones(user_id, leida);
create index if not exists notificaciones_fecha_idx on public.notificaciones(created_at desc);

-- =========================================================
-- RLS
-- =========================================================
alter table public.solicitudes_express enable row level security;
alter table public.notificaciones enable row level security;

-- solicitudes_express: el cliente ve/gestiona solo las suyas; el admin ve todas.
drop policy if exists solicitudes_express_select on public.solicitudes_express;
create policy solicitudes_express_select on public.solicitudes_express
  for select using (cliente_id = auth.uid() or public.is_admin());

drop policy if exists solicitudes_express_insert on public.solicitudes_express;
create policy solicitudes_express_insert on public.solicitudes_express
  for insert with check (cliente_id = auth.uid());

drop policy if exists solicitudes_express_update on public.solicitudes_express;
create policy solicitudes_express_update on public.solicitudes_express
  for update using (cliente_id = auth.uid() or public.is_admin());

-- notificaciones: cada usuario ve/actualiza solo las suyas, y puede crear las
-- propias. La inserción de notificaciones PARA OTRO usuario (cuando un viajero
-- genera un match para un cliente) la hace la Edge Function
-- `notificar-match-express` con la service role key, que ignora RLS; por eso no
-- se necesita una política de insert permisiva entre usuarios.
drop policy if exists notificaciones_select on public.notificaciones;
create policy notificaciones_select on public.notificaciones
  for select using (user_id = auth.uid());

drop policy if exists notificaciones_insert on public.notificaciones;
create policy notificaciones_insert on public.notificaciones
  for insert with check (user_id = auth.uid());

drop policy if exists notificaciones_update on public.notificaciones;
create policy notificaciones_update on public.notificaciones
  for update using (user_id = auth.uid());
