-- ToPaquete · Fase 21: Rediseño del sistema de Influencer.
--
-- Investigación previa del esquema real (0001_schema.sql):
--   * profiles NO tiene columna `referido_por`. La relación de referido se
--     guarda en `extra->>'referidoPor'` (lo escribe AuthContext al registrarse
--     un cliente vía enlace ?ref=CODIGO). Por tanto NO se añade columna nueva
--     para no duplicar el dato.
--   * profiles YA tiene `created_at timestamptz` (fecha de registro). Tampoco se
--     añade.
-- Conclusión: no hacen falta cambios de columnas. Esta migración solo añade un
-- índice para acelerar la búsqueda de la cartera de un influencer y siembra la
-- configuración de comisiones en `settings`.

-- Índice para buscar clientes referidos por un influencer (extra->>'referidoPor').
create index if not exists profiles_referido_por_idx
  on public.profiles ((extra->>'referidoPor'));

-- Configuración del modelo de influencer (leída vía getSetting/setSetting).
--   comisionPct          → comisión sobre el valor de cada envío de la cartera
--   ventanaActividadDias  → ventana móvil para considerar al influencer "activo"
insert into public.settings (key, value)
values (
  'influencer_config',
  '{"comisionPct": 0.05, "ventanaActividadDias": 90}'::jsonb
)
on conflict (key) do nothing;
