-- ToPaquete · Fase 24: Actualización de precios base.
-- Express base = 13 €/kg · Móvil / Celular = 30 €/unidad.
-- Idempotente: se puede ejecutar varias veces sin efectos secundarios.

-- 1) Precio base del servicio Express: 13 €/kg en todos los tramos express.
update public.tarifas_envio
set    precio_kg = 13.00,
       activo    = true
where  modalidad = 'express';

-- Si no existía ningún tramo Express, se crea uno base (1 kg en adelante).
insert into public.tarifas_envio (modalidad, peso_min, peso_max, precio_kg, activo)
select 'express', 1, null, 13.00, true
where not exists (
  select 1 from public.tarifas_envio where modalidad = 'express'
);

-- 2) Precio de Móvil / Celular en Express por contenido: 30 €/unidad.
update public.tarifas_express_contenido
set    precio      = 30.00,
       tipo_precio = 'unidad',
       activo      = true
where  contenido = 'Móvil / Celular';

-- Si no existía la fila de Móvil, se crea.
insert into public.tarifas_express_contenido (contenido, tipo_precio, precio, activo, orden)
select 'Móvil / Celular', 'unidad', 30.00, true, 4
where not exists (
  select 1 from public.tarifas_express_contenido where contenido = 'Móvil / Celular'
);
