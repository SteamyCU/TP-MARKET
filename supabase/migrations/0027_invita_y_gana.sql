-- Fase 31: Programa "Invita y Gana" — referidos exclusivos entre clientes.
--
-- Modelo de negocio:
--  · El REFERENTE gana 5 € por cada bloque de 10 kg del PRIMER envío de su
--    referido (cálculo único, no recurrente). Ej: 30 kg → 15 €.
--  · El REFERIDO recibe en su primer envío 10 % de descuento + domicilio gratis.
--  · Anti-fraude: si el destinatario del envío del referido coincide con algún
--    destinatario ya usado por el referente, el premio se marca 'sospechoso'
--    para revisión manual del admin (el descuento del referido sí se aplica).
--
-- Nota: referidos_clientes y creditos_cliente referencian profiles(id) (el id de
-- perfil del cliente del portal), no clientes.id. El enlace con la tabla
-- 'clientes' (y por tanto con 'paquetes') es clientes.user_id = profiles.id.

create table if not exists public.referidos_clientes (
  id uuid primary key default gen_random_uuid(),
  referente_id uuid not null references public.profiles(id),
  referido_id uuid not null references public.profiles(id),
  codigo_usado text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','premiado','sospechoso','sin_premio')),
  monto_premio numeric,
  paquete_primer_envio_id uuid,
  created_at timestamptz not null default now(),
  unique(referido_id)
);

create table if not exists public.creditos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles(id),
  monto numeric not null,
  motivo text not null,
  referido_id uuid references public.profiles(id),
  usado boolean not null default false,
  paquete_uso_id uuid,
  aplicado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists referidos_clientes_referente_idx on public.referidos_clientes(referente_id);
create index if not exists referidos_clientes_estado_idx on public.referidos_clientes(estado);
create index if not exists creditos_cliente_cliente_idx on public.creditos_cliente(cliente_id, usado);

-- ───────────────────────────────────────────────────────────────────────────
-- RLS
-- ───────────────────────────────────────────────────────────────────────────
alter table public.referidos_clientes enable row level security;
alter table public.creditos_cliente   enable row level security;

-- Staff operativo: admin y logística "ven todo"; se incluye agente porque opera
-- Recepción (necesita comprobar beneficios del cliente seleccionado) y entrega
-- paquetes (dispara el cálculo del premio).
-- referidos_clientes
create policy "referidos_select_propios_o_staff"
  on public.referidos_clientes for select
  using (
    referente_id = auth.uid()
    or referido_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente','contabilidad'))
  );

-- El propio referido se registra al completar su perfil; el staff puede insertar
-- en flujos administrativos.
create policy "referidos_insert_referido_o_staff"
  on public.referidos_clientes for insert
  with check (
    referido_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente'))
  );

-- Solo el staff cambia el estado (premiado/sospechoso/sin_premio) y reserva el
-- paquete del primer envío.
create policy "referidos_update_staff"
  on public.referidos_clientes for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente')));

-- creditos_cliente
create policy "creditos_select_propios_o_staff"
  on public.creditos_cliente for select
  using (
    cliente_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente','contabilidad'))
  );

create policy "creditos_insert_staff"
  on public.creditos_cliente for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente')));

create policy "creditos_update_staff"
  on public.creditos_cliente for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistica','agente')));

-- ───────────────────────────────────────────────────────────────────────────
-- Reutilización de la tabla 'cupones' (Fase 23) para el código de cada cliente.
-- Se añade el tipo 'cliente_referido' al CHECK y políticas para que un cliente
-- pueda crear/actualizar su propio código (descuento 10 %, influencer_id = su id).
-- ───────────────────────────────────────────────────────────────────────────
alter table public.cupones drop constraint if exists cupones_tipo_check;
alter table public.cupones
  add constraint cupones_tipo_check
  check (tipo in ('general','influencer','cliente_referido'));

create policy "cupones_cliente_referido_insert"
  on public.cupones for insert
  with check (
    tipo = 'cliente_referido'
    and influencer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'cliente')
  );

create policy "cupones_cliente_referido_update_own"
  on public.cupones for update
  using  (tipo = 'cliente_referido' and influencer_id = auth.uid())
  with check (tipo = 'cliente_referido' and influencer_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- Acceso de lectura para logística sobre clientes y destinatarios.
-- La entrega de paquetes (cambio a 'Entregado') la suele hacer logística, y ese
-- evento dispara el cálculo del premio del referente, que necesita mapear
-- paquete → cliente → profile (clientes.user_id) y comparar destinatarios
-- (anti-fraude). Sin estas políticas, los premios no se procesarían en entregas
-- hechas por logística. Son aditivas (las RLS se combinan con OR).
-- ───────────────────────────────────────────────────────────────────────────
create policy "clientes_select_logistica"
  on public.clientes for select
  using (public.auth_role() = 'logistica');

create policy "destinatarios_select_logistica"
  on public.destinatarios for select
  using (public.auth_role() = 'logistica');
