-- ToPaquete · Migración a Supabase · Fase 13.5
-- Bucket privado de Storage para los documentos de identidad (ID/Pasaporte)
-- que suben los solicitantes de Agente en /unirse.
--
-- Estructura de rutas: documentos-identidad/{uid}/{archivo}
-- - Cada usuario solo puede subir/leer archivos dentro de su propia carpeta
--   (carpeta = su auth.uid()).
-- - El admin puede leer todos los documentos (para validar solicitudes).

insert into storage.buckets (id, name, public)
values ('documentos-identidad', 'documentos-identidad', false)
on conflict (id) do nothing;

-- El propio usuario puede subir sus documentos a su carpeta
create policy "Usuarios suben su propio documento de identidad"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documentos-identidad'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- El propio usuario puede ver/actualizar/reemplazar sus documentos
create policy "Usuarios ven su propio documento de identidad"
on storage.objects for select to authenticated
using (
  bucket_id = 'documentos-identidad'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuarios actualizan su propio documento de identidad"
on storage.objects for update to authenticated
using (
  bucket_id = 'documentos-identidad'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- El admin puede ver todos los documentos para validar solicitudes
create policy "Admin ve todos los documentos de identidad"
on storage.objects for select to authenticated
using (
  bucket_id = 'documentos-identidad'
  and public.is_admin()
);
