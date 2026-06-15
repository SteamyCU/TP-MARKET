-- ToPaquete · Solicitudes de contacto del programa Partner Logístico.
-- Formulario público de /ser-partner: cualquier visitante (sin login) puede
-- enviar su solicitud; solo el admin puede leerlas y gestionarlas.

create table public.contactos_partners (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  empresa text not null,
  email text not null,
  telefono text not null,
  tipo_negocio text,
  volumen_estimado text,
  tiene_local boolean,
  mensaje text,
  tipo_solicitud text default 'partner',
  created_at timestamptz default now(),
  atendido boolean default false
);

alter table public.contactos_partners enable row level security;

-- Inserción pública: el formulario lo rellenan visitantes anónimos.
create policy contactos_partners_insert on public.contactos_partners
  for insert to anon, authenticated
  with check (true);

-- Lectura y gestión: solo admin.
create policy contactos_partners_select on public.contactos_partners
  for select using (public.is_admin());

create policy contactos_partners_update on public.contactos_partners
  for update using (public.is_admin())
  with check (public.is_admin());
