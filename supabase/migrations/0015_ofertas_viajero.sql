-- ToPaquete · Fase 25: Programa de Viajeros (parte 1).
-- Marketplace donde clientes que van a viajar publican los kilos de equipaje
-- disponibles, y otros clientes los reservan para enviar paquetes Express.
--
-- Requisitos de negocio:
--   - Solo un usuario con identidad verificada (documento subido a su perfil:
--     profiles.extra->>'documentoIdentidadUrl') puede publicar un viaje. La
--     validación de identidad se hace en la capa de servicio antes del insert.
--   - Al publicar, el viajero acepta explícitamente la cláusula de exención de
--     responsabilidad: acepto_terminos debe ser true (forzado por RLS).

create table if not exists public.ofertas_viajero (
  id uuid primary key default gen_random_uuid(),
  viajero_id uuid not null references public.profiles(id) on delete cascade,
  provincia_destino text not null,
  fecha_salida date not null,
  kilos_disponibles numeric not null,
  kilos_reservados numeric not null default 0,
  precio_kg numeric not null,
  notas text,
  estado text not null default 'activa'
    check (estado in ('activa','pausada','completada','cancelada')),
  acepto_terminos boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ofertas_viajero_estado_idx       on public.ofertas_viajero(estado);
create index if not exists ofertas_viajero_viajero_idx      on public.ofertas_viajero(viajero_id);
create index if not exists ofertas_viajero_fecha_salida_idx on public.ofertas_viajero(fecha_salida);

-- =========================================================
-- RLS
-- =========================================================
alter table public.ofertas_viajero enable row level security;

-- Lectura: cualquier usuario autenticado puede ver las ofertas (el tablero es
-- visible para todos los roles logueados; el dueño también ve las suyas no activas).
create policy ofertas_viajero_select on public.ofertas_viajero
  for select using (auth.uid() is not null);

-- Inserción: solo el propio viajero sobre su oferta y solo si acepta los términos.
create policy ofertas_viajero_insert on public.ofertas_viajero
  for insert with check (
    viajero_id = auth.uid()
    and acepto_terminos = true
  );

-- Actualización: el propio viajero sobre su oferta (pausar/cancelar/completar),
-- o un admin (moderación). Se mantiene la aceptación de términos.
create policy ofertas_viajero_update on public.ofertas_viajero
  for update using (
    viajero_id = auth.uid() or public.is_admin()
  ) with check (
    (viajero_id = auth.uid() and acepto_terminos = true) or public.is_admin()
  );

-- Borrado: el propio viajero o un admin.
create policy ofertas_viajero_delete on public.ofertas_viajero
  for delete using (viajero_id = auth.uid() or public.is_admin());
