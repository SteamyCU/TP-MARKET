-- ToPaquete · Programa de Viajeros: cambio de unidad de KILOS a MALETAS.
--
-- NOTA DE NUMERACIÓN: el encargo pedía 0019_maletas, pero 0019 ya estaba ocupado
-- (0019_salidas_lectura_publica.sql). Se usa 0021.
--
-- Los clientes venden el ESPACIO DE MALETAS que no usarán en su viaje (unidad
-- completa: 1, 2, 3…), no kg sueltos. Las solicitudes_express del lado de la
-- demanda siguen en kg; el cruce se hace con un peso estándar por maleta
-- configurable en settings/config_maletas.kgPorMaleta.
--
-- Los renombres de columna son idempotentes gracias al guard de information_schema.

-- ofertas_viajero: kilos_* -> maletas_*, precio_kg -> precio_maleta
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='ofertas_viajero' and column_name='kilos_disponibles') then
    alter table public.ofertas_viajero rename column kilos_disponibles to maletas_disponibles;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='ofertas_viajero' and column_name='kilos_reservados') then
    alter table public.ofertas_viajero rename column kilos_reservados to maletas_reservadas;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='ofertas_viajero' and column_name='precio_kg') then
    alter table public.ofertas_viajero rename column precio_kg to precio_maleta;
  end if;

  -- reservas_viajero: kilos_solicitados -> maletas_solicitadas
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='reservas_viajero' and column_name='kilos_solicitados') then
    alter table public.reservas_viajero rename column kilos_solicitados to maletas_solicitadas;
  end if;
end $$;

-- Peso estándar por maleta (solo uso interno: cruzar ofertas en maletas con
-- solicitudes_express en kg). No cambia la facturación, que es por maleta.
insert into public.settings (key, value)
values ('config_maletas', '{"kgPorMaleta": 23}'::jsonb)
on conflict (key) do nothing;
