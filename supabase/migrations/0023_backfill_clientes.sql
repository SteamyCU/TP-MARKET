-- Backfill de una sola vez: crea la fila en 'clientes' para cada profile con
-- role='cliente' que todavía no tenga una fila correspondiente.
--
-- Hasta ahora la fila en 'clientes' solo se creaba de forma diferida la
-- primera vez que el usuario visitaba "Mis Solicitudes" (obtenerOCrearClienteDoc
-- en src/services/solicitudes.ts), por lo que pueden existir clientes
-- registrados que nunca pasaron por ahí y no aparecen en "Gestión de
-- Clientes" (admin). A partir de ahora AuthContext.tsx llama a esa misma
-- función justo al cargar el perfil, así que este backfill cubre únicamente
-- a los huérfanos previos a ese cambio.
--
-- Matching por email, igual que getClienteByEmail (la función que usa
-- obtenerOCrearClienteDoc para decidir si ya existe la fila).
insert into public.clientes (user_id, nombre, email)
select
  p.id,
  coalesce(p.extra->>'name', p.email),
  p.email
from public.profiles p
where p.role = 'cliente'
  and not exists (
    select 1 from public.clientes c where c.email = p.email
  );
