-- ToPaquete · Corrige el precio base del Express "Miscelánea Normal".
--
-- La migración 0014 (Fase 24) actualizó el precio_kg de tarifas_envio (modalidad
-- 'express') y el precio de "Móvil / Celular" en tarifas_express_contenido, pero
-- la calculadora pública usa tarifas_express_contenido (no tarifas_envio) para el
-- contenido "Miscelánea Normal" -- esa fila quedó en 0 (valor semilla de la
-- migración 0010) y nunca se actualizó a 13 €/kg. Idempotente.

update public.tarifas_express_contenido
set    precio      = 13.00,
       tipo_precio = 'kg',
       activo      = true
where  contenido = 'Miscelánea Normal';

insert into public.tarifas_express_contenido (contenido, tipo_precio, precio, activo, orden)
select 'Miscelánea Normal', 'kg', 13.00, true, 1
where not exists (
  select 1 from public.tarifas_express_contenido where contenido = 'Miscelánea Normal'
);
