-- ToPaquete · Fase 25: Programa de Viajeros (parte 2).
-- Sistema de reservas: un cliente solicita kilos de una oferta publicada por
-- un viajero; el viajero acepta o rechaza la solicitud.
--
-- Reglas de negocio:
--   - Mientras una reserva está 'pendiente' o 'aceptada', sus kilos quedan
--     bloqueados en ofertas_viajero.kilos_reservados (evita sobre-reserva).
--     Esto lo gestiona la capa de servicio (src/services/viajeros.ts), no un
--     trigger, para poder disparar las notificaciones por email en el mismo flujo.
--   - El contacto del viajero/cliente solo se revela en la UI cuando la
--     reserva pasa a 'aceptada'.

create table if not exists public.reservas_viajero (
  id uuid primary key default gen_random_uuid(),
  oferta_id uuid not null references public.ofertas_viajero(id),
  cliente_id uuid not null references public.profiles(id),
  kilos_solicitados numeric not null,
  precio_total numeric not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aceptada','rechazada','cancelada','completada')),
  mensaje_cliente text,
  motivo_rechazo text,
  acepto_terminos boolean not null default false,
  created_at timestamptz not null default now(),
  respondida_at timestamptz
);

create index if not exists reservas_viajero_oferta_idx  on public.reservas_viajero(oferta_id);
create index if not exists reservas_viajero_cliente_idx on public.reservas_viajero(cliente_id);
create index if not exists reservas_viajero_estado_idx  on public.reservas_viajero(estado);

-- =========================================================
-- RLS
-- =========================================================
alter table public.reservas_viajero enable row level security;

-- Lectura: el propio cliente que reservó, el viajero dueño de la oferta
-- referenciada, o un admin.
create policy reservas_viajero_select on public.reservas_viajero
  for select using (
    cliente_id = auth.uid()
    or auth.uid() in (
      select viajero_id from public.ofertas_viajero where id = oferta_id
    )
    or public.is_admin()
  );

-- Inserción: solo el propio cliente, sobre sí mismo, aceptando los términos.
create policy reservas_viajero_insert on public.reservas_viajero
  for insert with check (
    cliente_id = auth.uid()
    and acepto_terminos = true
  );

-- Actualización: el cliente (cancelar su propia reserva pendiente), el
-- viajero dueño de la oferta (aceptar/rechazar), o un admin.
create policy reservas_viajero_update on public.reservas_viajero
  for update using (
    cliente_id = auth.uid()
    or auth.uid() in (
      select viajero_id from public.ofertas_viajero where id = oferta_id
    )
    or public.is_admin()
  );
