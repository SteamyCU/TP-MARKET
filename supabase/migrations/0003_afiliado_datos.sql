-- ToPaquete · Migración a Supabase · Fase 13.3
-- Añade una columna 'datos' jsonb a solicitudes_afiliado para guardar los campos
-- variables del formulario de alta de afiliado (pais, ciudad, zonaCobertura,
-- experiencia, redSocialPrincipal, usuarioRedSocial, linkPerfil, seguidores,
-- comunidadRelacionada, referidor, ...), que antes vivían como campos sueltos
-- del documento de Firestore.

alter table public.solicitudes_afiliado
  add column if not exists datos jsonb not null default '{}'::jsonb;
