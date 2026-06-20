-- Backfill de una sola vez: copia dni/telefono/direccion ya guardados en
-- profiles.extra hacia la tabla 'clientes' (documento_identidad/
-- telefono_espana/direccion), para los clientes que completaron su perfil
-- antes de que "Completa tu Perfil" (src/App.tsx) y "Mi Perfil"
-- (src/pages/Perfil.tsx) sincronizaran ambas tablas.
--
-- profiles.extra usa las keys 'dni', 'telefono' y 'direccion' (las mismas
-- que ya lee src/pages/MisDestinatarios.tsx para precargar el formulario de
-- destinatario), no 'documentoIdentidad'. Matching por email.
update public.clientes c
set
  documento_identidad = coalesce(nullif(c.documento_identidad, ''), p.extra->>'dni'),
  telefono_espana = coalesce(nullif(c.telefono_espana, ''), p.extra->>'telefono'),
  direccion = coalesce(nullif(c.direccion, ''), p.extra->>'direccion')
from public.profiles p
where p.role = 'cliente'
  and p.email = c.email
  and (
    coalesce(c.documento_identidad, '') = ''
    or coalesce(c.telefono_espana, '') = ''
  );
