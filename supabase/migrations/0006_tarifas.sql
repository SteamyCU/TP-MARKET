-- ToPaquete · Fase 15: Sistema de tarifas dinámicas
-- Tablas editables desde el panel de administración que alimentan la
-- calculadora pública de la landing.

-- =========================================================
-- TARIFAS_ENVIO: precio base por modalidad y tramo de peso
-- =========================================================
create table public.tarifas_envio (
  id uuid primary key default gen_random_uuid(),
  modalidad text not null check (modalidad in ('regular', 'express')),
  peso_min numeric not null,
  peso_max numeric,
  precio_kg numeric not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tarifas_envio_set_updated_at
  before update on public.tarifas_envio
  for each row execute function public.set_updated_at();

-- =========================================================
-- TARIFAS_TRANSPORTE_CUBA: recargo por transporte provincial
-- =========================================================
create table public.tarifas_transporte_cuba (
  id uuid primary key default gen_random_uuid(),
  provincias text[] not null default '{}',
  precio_kg numeric not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tarifas_transporte_cuba_set_updated_at
  before update on public.tarifas_transporte_cuba
  for each row execute function public.set_updated_at();

-- =========================================================
-- Datos iniciales
-- =========================================================
insert into public.tarifas_envio (modalidad, peso_min, peso_max, precio_kg) values
  ('regular', 1, 999, 5.00),
  ('express', 1, 999, 8.00);

insert into public.tarifas_transporte_cuba (provincias, precio_kg) values
  (array['La Habana'], 0.00),
  (array['Pinar del Río', 'Matanzas', 'Artemisa', 'Mayabeque'], 1.30),
  (array['Cienfuegos', 'Villa Clara', 'Sancti Spíritus', 'Ciego de Ávila'], 1.40),
  (array['Camagüey', 'Las Tunas', 'Holguín'], 1.50),
  (array['Granma', 'Santiago de Cuba', 'Guantánamo'], 1.60);

-- =========================================================
-- RLS: lectura pública (la calculadora de la landing es pública),
-- escritura solo admin.
-- =========================================================
alter table public.tarifas_envio enable row level security;
alter table public.tarifas_transporte_cuba enable row level security;

create policy tarifas_envio_select on public.tarifas_envio
  for select using (true);

create policy tarifas_envio_write on public.tarifas_envio
  for all using (public.is_admin())
  with check (public.is_admin());

create policy tarifas_transporte_cuba_select on public.tarifas_transporte_cuba
  for select using (true);

create policy tarifas_transporte_cuba_write on public.tarifas_transporte_cuba
  for all using (public.is_admin())
  with check (public.is_admin());
