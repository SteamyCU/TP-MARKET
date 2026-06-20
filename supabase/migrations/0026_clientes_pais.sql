-- Bug: el registro de clientes ("Completa tu Perfil" y "Mi Perfil") nunca
-- pedía el país de residencia, asumiendo implícitamente que todos los
-- clientes viven en España (placeholders "Provincia (España)", etc.). En la
-- práctica los clientes de ToPaquete residen en varios países, así que la
-- tabla 'clientes' necesita una columna para guardarlo.
alter table public.clientes
  add column if not exists pais text;
