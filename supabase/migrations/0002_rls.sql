-- ToPaquete · Migración a Supabase · Fase 13.1: RLS (Row Level Security)
-- Espejo de los roles y reglas definidas en firestore.rules.
-- Roles posibles en profiles.role: admin, agente, influencer, partner, cliente, contabilidad, logistica

-- =========================================================
-- Funciones helper (equivalentes a isAdmin/isAgente/... en firestore.rules)
-- =========================================================

create or replace function public.current_role()
returns text
language sql stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.current_role() = 'admin'
$$;

-- agente, partner o admin (gestión comercial/operativa amplia)
create or replace function public.is_agente()
returns boolean language sql stable as $$
  select public.current_role() in ('admin','agente','partner')
$$;

-- operaciones de almacén/logística: agente, logistica o admin
create or replace function public.is_operativo()
returns boolean language sql stable as $$
  select public.current_role() in ('admin','agente','logistica')
$$;

-- finanzas: agente, contabilidad o admin
create or replace function public.is_finanzas()
returns boolean language sql stable as $$
  select public.current_role() in ('admin','agente','contabilidad')
$$;

create or replace function public.is_influencer()
returns boolean language sql stable as $$
  select public.current_role() = 'influencer'
$$;

create or replace function public.is_partner()
returns boolean language sql stable as $$
  select public.current_role() = 'partner'
$$;

-- =========================================================
-- Activar RLS en todas las tablas
-- =========================================================
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.destinatarios enable row level security;
alter table public.paquetes enable row level security;
alter table public.eventos enable row level security;
alter table public.pagos enable row level security;
alter table public.lotes enable row level security;
alter table public.gastos enable row level security;
alter table public.solicitudes enable row level security;
alter table public.auditoria enable row level security;
alter table public.b2b_invoices enable row level security;
alter table public.ofertas enable row level security;
alter table public.salidas enable row level security;
alter table public.noticias enable row level security;
alter table public.solicitudes_afiliado enable row level security;
alter table public.referidos enable row level security;
alter table public.settings enable row level security;

-- =========================================================
-- PROFILES
-- =========================================================
-- Cualquier usuario autenticado puede leer perfiles (necesario para nombres,
-- agentes, partners visibles en selects, etc. - igual que 'users' en Firestore)
create policy profiles_select on public.profiles
  for select using (auth.uid() is not null);

-- Un usuario crea su propio perfil al registrarse (rol inicial 'cliente')
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

-- Un usuario actualiza su propio perfil, pero no puede cambiarse el rol;
-- el admin puede actualizar cualquier perfil (incluido el rol).
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()))
  );

-- =========================================================
-- CLIENTES
-- =========================================================
create policy clientes_select on public.clientes
  for select using (public.is_agente() or user_id = auth.uid());

create policy clientes_insert on public.clientes
  for insert with check (public.is_agente() or user_id = auth.uid());

create policy clientes_update on public.clientes
  for update using (public.is_agente() or user_id = auth.uid());

-- =========================================================
-- DESTINATARIOS
-- =========================================================
create policy destinatarios_select on public.destinatarios
  for select using (
    public.is_agente()
    or exists (select 1 from public.clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create policy destinatarios_write on public.destinatarios
  for all using (
    public.is_agente()
    or exists (select 1 from public.clientes c where c.id = cliente_id and c.user_id = auth.uid())
  ) with check (
    public.is_agente()
    or exists (select 1 from public.clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

-- =========================================================
-- PAQUETES
-- =========================================================
create policy paquetes_select on public.paquetes
  for select using (
    public.is_agente()
    or public.is_influencer()
    or public.current_role() in ('contabilidad','logistica')
    or exists (select 1 from public.clientes c where c.id = cliente_id and c.user_id = auth.uid())
    or partner_id = auth.uid()
  );

create policy paquetes_write on public.paquetes
  for all using (public.is_operativo())
  with check (public.is_operativo());

-- =========================================================
-- EVENTOS (historial; lectura amplia, escritura operativa)
-- =========================================================
create policy eventos_select on public.eventos
  for select using (
    public.is_operativo()
    or public.is_finanzas()
    or public.current_role() = 'cliente'
    or public.is_influencer()
    or public.is_partner()
  );

create policy eventos_insert on public.eventos
  for insert with check (public.is_operativo());

-- =========================================================
-- PAGOS (solo finanzas)
-- =========================================================
create policy pagos_all on public.pagos
  for all using (public.is_finanzas())
  with check (public.is_finanzas());

-- =========================================================
-- LOTES
-- =========================================================
create policy lotes_select on public.lotes
  for select using (public.is_operativo());

create policy lotes_insert on public.lotes
  for insert with check (public.is_operativo());

create policy lotes_update on public.lotes
  for update using (public.is_operativo());

create policy lotes_delete on public.lotes
  for delete using (public.is_admin());

-- =========================================================
-- GASTOS
-- =========================================================
create policy gastos_select on public.gastos
  for select using (public.is_finanzas());

create policy gastos_insert on public.gastos
  for insert with check (public.is_finanzas());

create policy gastos_update on public.gastos
  for update using (public.is_admin());

create policy gastos_delete on public.gastos
  for delete using (public.is_admin());

-- =========================================================
-- SOLICITUDES (portal cliente)
-- =========================================================
create policy solicitudes_select on public.solicitudes
  for select using (public.is_agente() or cliente_uid = auth.uid());

create policy solicitudes_insert on public.solicitudes
  for insert with check (cliente_uid = auth.uid() and estado = 'Nueva');

create policy solicitudes_update on public.solicitudes
  for update using (
    public.is_agente()
    or (cliente_uid = auth.uid() and estado = 'Nueva')
  );

-- =========================================================
-- AUDITORIA (inmutable, solo lectura admin, creación por backend/usuarios autenticados)
-- =========================================================
create policy auditoria_select on public.auditoria
  for select using (public.is_admin());

create policy auditoria_insert on public.auditoria
  for insert with check (auth.uid() is not null and usuario = auth.uid());

-- sin policies de update/delete -> denegado por defecto

-- =========================================================
-- B2B INVOICES
-- =========================================================
create policy b2b_invoices_select on public.b2b_invoices
  for select using (public.is_agente() or partner_id = auth.uid());

create policy b2b_invoices_write on public.b2b_invoices
  for all using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- OFERTAS / SALIDAS (lectura pública para autenticados, escritura admin/agente)
-- =========================================================
create policy ofertas_select on public.ofertas
  for select using (auth.uid() is not null);

create policy ofertas_write on public.ofertas
  for all using (public.is_agente())
  with check (public.is_agente());

create policy salidas_select on public.salidas
  for select using (auth.uid() is not null);

create policy salidas_write on public.salidas
  for all using (public.is_agente())
  with check (public.is_agente());

-- =========================================================
-- NOTICIAS (lectura pública, escritura admin)
-- =========================================================
create policy noticias_select on public.noticias
  for select using (true);

create policy noticias_write on public.noticias
  for all using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- SOLICITUDES DE AFILIACIÓN
-- =========================================================
create policy solicitudes_afiliado_select on public.solicitudes_afiliado
  for select using (public.is_admin() or uid = auth.uid());

create policy solicitudes_afiliado_insert on public.solicitudes_afiliado
  for insert with check (uid = auth.uid() and status = 'pendiente');

create policy solicitudes_afiliado_update on public.solicitudes_afiliado
  for update using (public.is_admin());

-- =========================================================
-- REFERIDOS
-- =========================================================
create policy referidos_select on public.referidos
  for select using (public.is_admin() or influencer_id = auth.uid());

create policy referidos_insert on public.referidos
  for insert with check (auth.uid() is not null);

-- =========================================================
-- SETTINGS
-- =========================================================
create policy settings_select on public.settings
  for select using (auth.uid() is not null);

create policy settings_write on public.settings
  for all using (public.is_admin())
  with check (public.is_admin());
