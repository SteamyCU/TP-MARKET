-- ToPaquete · Añade la provincia española del remitente al cliente, necesaria
-- para el manifiesto de exportación a España.

alter table public.clientes
  add column if not exists provincia text;
