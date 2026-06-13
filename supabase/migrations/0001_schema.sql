-- ToPaquete · Migración a Supabase · Fase 13.1: esquema base
-- Equivalente relacional de las colecciones de Firestore.
-- Convenciones:
--   - id: uuid generado por Postgres (gen_random_uuid()), salvo "profiles" que usa auth.users.id
--   - tracking / codigo: identificadores legibles, se mantienen como en Firestore
--   - created_at / updated_at: timestamptz, equivalentes a createdAt/updatedAt (serverTimestamp)
--   - Campos muy variables (medidas, contenido, items, etc.) se guardan en jsonb

create extension if not exists pgcrypto;

-- =========================================================
-- PROFILES (antes: colección 'users')
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'cliente'
    check (role in ('admin','agente','influencer','partner','cliente','contabilidad','logistica')),
  -- Resto de campos del perfil (name, telefono, direccion, dni, oficina,
  -- tipoColaborador, precioPorKilo, balance, codigoReferido, referidoPor,
  -- tasaComision, balanceComisiones, tier, apiKey, status, ...): igual que
  -- en Firestore 'users', se guardan como JSON flexible.
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create index profiles_codigo_referido_idx on public.profiles ((extra->>'codigoReferido'));

-- =========================================================
-- CLIENTES
-- =========================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) unique, -- cuenta de Auth del cliente (si tiene acceso al portal)
  nombre text not null,
  email text,
  documento_identidad text,
  telefono_espana text,
  direccion text,
  localidad text,
  codigo_postal text,
  agente_id uuid references public.profiles(id),
  referido_por uuid references public.profiles(id),
  etiquetas_marketing text[] default '{}',
  contactos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clientes_email_idx on public.clientes(email);
create index clientes_agente_idx on public.clientes(agente_id);

-- =========================================================
-- DESTINATARIOS
-- =========================================================
create table public.destinatarios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nombre text not null,
  carnet_pasaporte text,
  telefono_cuba text,
  direccion text,
  provincia text,
  municipio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index destinatarios_cliente_idx on public.destinatarios(cliente_id);

-- =========================================================
-- LOTES (salidas/envíos por contenedor)
-- =========================================================
create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  estado text not null default 'Abierto',
  ruta text,
  contenedor text,
  oficina_origen text,
  oficina_destino text,
  responsable text,
  notas text,
  fecha_estimada_salida date,
  fecha_estimada_llegada date,
  fecha_real_salida timestamptz,
  fecha_real_llegada timestamptz,
  total_paquetes integer not null default 0,
  peso_total numeric not null default 0,
  peso_tasable_total numeric not null default 0,
  volumen_total_cm3 numeric not null default 0,
  valor_declarado_total numeric not null default 0,
  ingresos_estimados numeric not null default 0,
  costes_estimados numeric,
  beneficio_estimado numeric,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lotes_estado_idx on public.lotes(estado);

-- =========================================================
-- PAQUETES
-- =========================================================
create table public.paquetes (
  id uuid primary key default gen_random_uuid(),
  tracking text not null unique,
  cliente_id uuid references public.clientes(id),
  cliente_nombre text,
  cliente_telefono text,
  destinatario_id uuid references public.destinatarios(id),
  destinatario_nombre text,
  destinatario_direccion text,
  destinatario_telefono text,
  destinatario_documento text,
  peso numeric,
  origen text,
  destino text,
  contenido text,
  descripcion text,
  medidas jsonb,
  tipo_envio text,
  volumen_cm3 numeric,
  peso_volumetrico numeric,
  peso_tasable numeric,
  valor_declarado numeric,
  precio_sugerido numeric,
  precio_final numeric,
  precio_aplicado numeric,
  estado text not null default 'Recepción',
  estado_pago text not null default 'Pendiente',
  importe_pagado numeric not null default 0,
  importe_pendiente numeric not null default 0,
  metodo_pago text,
  entrega jsonb,
  detalles_incidencia text,
  lote_id uuid references public.lotes(id) on delete set null,
  lote_codigo text,
  operador_id uuid references public.profiles(id),
  referido_por uuid references public.profiles(id),
  partner_id uuid references public.profiles(id),
  es_b2b boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index paquetes_cliente_idx on public.paquetes(cliente_id);
create index paquetes_estado_idx on public.paquetes(estado);
create index paquetes_lote_idx on public.paquetes(lote_id);
create index paquetes_partner_idx on public.paquetes(partner_id);

-- =========================================================
-- EVENTOS (historial inmutable de cada paquete)
-- =========================================================
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  paquete_id text not null, -- tracking del paquete (igual que Firestore)
  estado text not null,
  estado_anterior text,
  notas text,
  motivo text,
  tipo_cambio text, -- 'individual' | 'masivo' | 'lote'
  ubicacion text,
  operador_id uuid references public.profiles(id),
  "timestamp" timestamptz not null default now()
);
create index eventos_paquete_idx on public.eventos(paquete_id);

-- =========================================================
-- PAGOS
-- =========================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  paquete_id text not null, -- tracking, igual que Firestore
  monto numeric not null,
  metodo text,
  estado text not null default 'Pendiente',
  nota text,
  agente_id uuid references public.profiles(id),
  fecha timestamptz not null default now()
);
create index pagos_paquete_idx on public.pagos(paquete_id);
create index pagos_estado_idx on public.pagos(estado);

-- =========================================================
-- GASTOS
-- =========================================================
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  categoria text,
  monto numeric not null,
  fecha date not null,
  lote_id uuid references public.lotes(id),
  lote_codigo text,
  ruta text,
  notas text,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index gastos_lote_idx on public.gastos(lote_id);

-- =========================================================
-- SOLICITUDES (portal cliente)
-- =========================================================
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  cliente_uid uuid references public.profiles(id),
  cliente_id uuid references public.clientes(id),
  cliente_nombre text,
  cliente_email text,
  cliente_telefono text,
  destinatario_id uuid references public.destinatarios(id),
  destinatario_nombre text,
  destinatario_provincia text,
  contenido text,
  tipo_envio text,
  peso_estimado numeric,
  observaciones text,
  estado text not null default 'Nueva',
  nota_interna text,
  nota_para_cliente text,
  tracking text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index solicitudes_cliente_idx on public.solicitudes(cliente_uid);
create index solicitudes_estado_idx on public.solicitudes(estado);

-- =========================================================
-- AUDITORIA (inmutable)
-- =========================================================
create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  accion text not null,
  entidad text not null,
  entidad_id text not null,
  descripcion text not null,
  valor_anterior text,
  valor_nuevo text,
  motivo text,
  usuario uuid references public.profiles(id),
  usuario_email text,
  fecha timestamptz not null default now()
);
create index auditoria_fecha_idx on public.auditoria(fecha desc);
create index auditoria_accion_idx on public.auditoria(accion);

-- =========================================================
-- B2B INVOICES
-- =========================================================
create table public.b2b_invoices (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.profiles(id),
  partner_name text,
  month text,
  items jsonb default '[]'::jsonb,
  total_amount numeric not null default 0,
  status text not null default 'Pendiente',
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index b2b_invoices_partner_idx on public.b2b_invoices(partner_id);

-- =========================================================
-- OFERTAS / SALIDAS
-- =========================================================
create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  descripcion text,
  estado text not null default 'Activa',
  datos jsonb default '{}'::jsonb,
  fecha_creacion timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salidas (
  id uuid primary key default gen_random_uuid(),
  fecha date,
  estado text not null default 'Programada',
  datos jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- NOTICIAS
-- =========================================================
create table public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text,
  publicado boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SOLICITUDES DE AFILIACIÓN (alta de agente/partner/influencer)
-- =========================================================
create table public.solicitudes_afiliado (
  id uuid primary key default gen_random_uuid(),
  uid uuid references public.profiles(id),
  email text,
  nombre text,
  telefono text,
  role_solicitado text not null,
  status text not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index solicitudes_afiliado_uid_idx on public.solicitudes_afiliado(uid);

-- =========================================================
-- REFERIDOS (subcolección influencers/{id}/referidos)
-- =========================================================
create table public.referidos (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.profiles(id) on delete cascade,
  referido_id uuid references public.profiles(id),
  datos jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index referidos_influencer_idx on public.referidos(influencer_id);

-- =========================================================
-- SETTINGS (singletons: negocio, precios, influencer_levels)
-- =========================================================
create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- updated_at automático
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','clientes','destinatarios','lotes','paquetes',
    'solicitudes','b2b_invoices','ofertas','salidas','noticias','solicitudes_afiliado'
  ])
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;
