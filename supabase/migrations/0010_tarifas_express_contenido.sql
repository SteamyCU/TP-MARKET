-- ToPaquete · Fase 17: Precios Express por tipo de contenido.
-- Algunos contenidos del envío Express se cobran por kg (Miscelánea,
-- Medicinas) y otros por unidad/pieza (Batería, Móvil, Laptop). Esta tabla
-- permite al admin editar el precio y el tipo de cobro de cada uno, y
-- alimenta la calculadora pública de la landing.

create table public.tarifas_express_contenido (
  id uuid primary key default gen_random_uuid(),
  contenido text not null,
  tipo_precio text not null check (tipo_precio in ('kg', 'unidad')),
  precio numeric not null default 0,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tarifas_express_contenido_set_updated_at
  before update on public.tarifas_express_contenido
  for each row execute function public.set_updated_at();

insert into public.tarifas_express_contenido (contenido, tipo_precio, precio, orden) values
  ('Miscelánea Normal', 'kg', 0, 1),
  ('Medicinas (Exento)', 'kg', 0, 2),
  ('Batería', 'unidad', 0, 3),
  ('Móvil / Celular', 'unidad', 0, 4),
  ('Laptop / PC', 'unidad', 0, 5);

-- RLS: lectura pública (calculadora de la landing sin login), escritura solo admin.
alter table public.tarifas_express_contenido enable row level security;

create policy tarifas_express_contenido_select on public.tarifas_express_contenido
  for select using (true);

create policy tarifas_express_contenido_write on public.tarifas_express_contenido
  for all using (public.is_admin())
  with check (public.is_admin());
