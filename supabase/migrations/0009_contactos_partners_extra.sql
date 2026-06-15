-- ToPaquete · Amplía contactos_partners para los formularios de Franquicia y
-- Punto de Entrega (además del de Partner): añade ciudad/localidad y un campo
-- flexible `datos` para preguntas específicas de cada modelo (local disponible,
-- experiencia, báscula, etc.). El nombre de empresa pasa a opcional porque la
-- solicitud de Franquicia es personal y no lo recoge.

alter table public.contactos_partners
  add column if not exists ciudad text,
  add column if not exists datos jsonb not null default '{}'::jsonb;

alter table public.contactos_partners
  alter column empresa drop not null;
