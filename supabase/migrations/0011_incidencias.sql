-- ToPaquete · Fase 20: Módulo de incidencias.
-- Hasta ahora "incidencia" solo existía como un estado del paquete
-- (paquetes.estado = 'Incidencia' + detalles_incidencia). Esta tabla da un
-- registro propio a cada incidencia, con tipo, prioridad, estado de gestión,
-- responsable asignado, resolución e historial de comentarios. Una incidencia
-- puede (opcionalmente) estar vinculada a un paquete.

create table public.incidencias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,                 -- legible: INC-XXXXXX
  paquete_id uuid references public.paquetes(id) on delete set null,
  paquete_tracking text,                       -- denormalizado (mostrar sin join)
  cliente_nombre text,                         -- denormalizado
  tipo text not null,                          -- categoría (ver TIPOS_INCIDENCIA)
  prioridad text not null default 'media'
    check (prioridad in ('baja','media','alta','critica')),
  estado text not null default 'abierta'
    check (estado in ('abierta','en_proceso','resuelta','cerrada')),
  titulo text not null,
  descripcion text,
  resolucion text,
  asignado_a uuid references public.profiles(id),
  reportado_por uuid references public.profiles(id),
  historial jsonb not null default '[]'::jsonb, -- comentarios/notas cronológicas
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resuelta_at timestamptz
);
create index incidencias_estado_idx on public.incidencias(estado);
create index incidencias_prioridad_idx on public.incidencias(prioridad);
create index incidencias_paquete_idx on public.incidencias(paquete_id);
create index incidencias_asignado_idx on public.incidencias(asignado_a);

create trigger incidencias_set_updated_at
  before update on public.incidencias
  for each row execute function public.set_updated_at();

-- RLS: gestión operativa (admin, agente, logística). Lectura también para
-- finanzas (reclamaciones con impacto económico). Escritura solo operativa.
alter table public.incidencias enable row level security;

create policy incidencias_select on public.incidencias
  for select using (public.is_operativo() or public.is_finanzas());

create policy incidencias_insert on public.incidencias
  for insert with check (public.is_operativo());

create policy incidencias_update on public.incidencias
  for update using (public.is_operativo());

create policy incidencias_delete on public.incidencias
  for delete using (public.is_admin());
