-- Bug: el formulario "Nuevo Destinatario" (DestinatarioFormModal.tsx) captura
-- Teléfono Secundario, Correo Electrónico y Código Postal, y el tipo
-- Destinatario (src/types/models.ts) ya los declaraba, pero la tabla
-- 'destinatarios' nunca tuvo esas columnas: flatFieldsToColumns() las
-- descartaba en silencio antes del insert, así que esos campos parecían
-- guardarse (sin error) pero se perdían siempre.
alter table public.destinatarios
  add column if not exists telefono_secundario text,
  add column if not exists email text,
  add column if not exists codigo_postal text;
