-- ToPaquete · Programa de Viajeros, Fase 1 (venta de kilos a ToPaquete).
--
-- Por ahora ToPaquete (admin) es el único comprador de kilos: los clientes
-- publican ofertas (ofertas_viajero, sin cambios de esquema) y el admin
-- reserva kilos desde el panel /dashboard/admin/viajeros.
--
-- reservas_viajero ya existía (migración 0016) para el flujo cliente-a-cliente
-- (Fase 25 parte 2), hoy sin uso en producción porque la UI de mercado público
-- está oculta. En lugar de crear una tabla paralela, se extiende esa misma
-- tabla para admitir también reservas hechas por el admin en nombre de
-- ToPaquete: "quién reservó" puede ser un cliente (cliente_id) o el admin
-- (reservado_por). Así, cuando se active el mercado entre clientes (Fase 2,
-- ver flag más abajo) no hay que reconstruir nada.

alter table public.reservas_viajero
  alter column cliente_id drop not null;

alter table public.reservas_viajero
  add column if not exists reservado_por uuid references public.profiles(id);

alter table public.reservas_viajero
  add column if not exists notas_internas text;

-- Toda reserva debe tener un origen: un cliente o el admin.
alter table public.reservas_viajero
  drop constraint if exists reservas_viajero_quien_check;
alter table public.reservas_viajero
  add constraint reservas_viajero_quien_check
  check (cliente_id is not null or reservado_por is not null);

-- 'confirmada' es el estado inicial de una reserva hecha por el admin
-- (equivalente a 'aceptada' en el flujo cliente-a-cliente, pero sin paso de
-- aceptación porque ToPaquete reserva directamente).
alter table public.reservas_viajero
  drop constraint if exists reservas_viajero_estado_check;
alter table public.reservas_viajero
  add constraint reservas_viajero_estado_check
  check (estado in ('pendiente','aceptada','rechazada','cancelada','completada','confirmada'));

-- =========================================================
-- RLS: permitir también la inserción por parte del admin
-- =========================================================
drop policy if exists reservas_viajero_insert on public.reservas_viajero;
create policy reservas_viajero_insert on public.reservas_viajero
  for insert with check (
    (cliente_id = auth.uid() and acepto_terminos = true)
    or (public.is_admin() and reservado_por = auth.uid())
  );

-- =========================================================
-- Flag de settings para el mercado público entre clientes (Fase 2).
-- Desactivado por defecto: mientras esté en false, solo ToPaquete reserva.
-- =========================================================
insert into public.settings (key, value)
values ('viajeros_marketplace_publico', jsonb_build_object('activo', false))
on conflict (key) do nothing;
