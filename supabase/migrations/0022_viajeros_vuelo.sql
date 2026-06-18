-- ToPaquete · Programa de Viajeros: datos de vuelo en las ofertas.
--
-- NOTA: el cambio de unidad kilos -> maletas (kilos_disponibles/kilos_reservados/
-- precio_kg en ofertas_viajero, kilos_solicitados en reservas_viajero) ya se
-- aplicó en 0021_maletas.sql, junto con settings/config_maletas. Esta migración
-- solo añade los campos de vuelo (aerolínea + hora de salida) pedidos junto con
-- la corrección.

alter table public.ofertas_viajero add column if not exists aerolinea text;
alter table public.ofertas_viajero add column if not exists hora_salida time;
