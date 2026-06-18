-- ToPaquete · Lectura pública (anon) de las próximas salidas vigentes.
--
-- El badge "Próxima salida" del home (Landing.tsx) es público y necesita leer
-- la tabla `salidas` SIN sesión iniciada. La política existente `salidas_select`
-- solo permite leer a usuarios autenticados (auth.uid() is not null), por lo que
-- un visitante anónimo no veía ninguna fecha. Esta política AÑADE lectura pública
-- limitada a las salidas vigentes y futuras (no expone canceladas/finalizadas ni
-- fechas pasadas). Las políticas permisivas se combinan con OR, así que los
-- usuarios autenticados conservan acceso total vía `salidas_select`.
-- Idempotente.

drop policy if exists salidas_select_publico on public.salidas;

create policy salidas_select_publico on public.salidas
  for select
  using (
    fecha >= current_date
    and lower(coalesce(estado, '')) not in (
      'cancelada', 'cancelado', 'finalizada', 'finalizado',
      'completada', 'completado', 'inactiva', 'inactivo'
    )
  );
