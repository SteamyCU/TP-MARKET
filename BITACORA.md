# Bitácora del proyecto · ToPaquete

Registro de avances de la plataforma de logística ToPaquete (envíos España → Cuba)
y de los pendientes para dejarla lista para producción.

Última actualización: 2026-06-18 (plataforma publicada en producción)

---

## Estado general

- **Stack:** React 19 + TypeScript + Vite 6 + Tailwind 4 + react-router-dom 7.
- **Backend:** Supabase (Auth + Postgres + RLS). Proyecto `idcfuravemoljjxbdkeh`.
- **Firebase:** eliminado por completo del proyecto. La app ya no depende de Firebase.
- **Motivo del cambio:** Firebase no carga desde Cuba (mercado principal de clientes),
  por eso toda la plataforma se migró a Supabase.
- **Despliegue:** publicado en producción en [topaquete.com](https://topaquete.com)
  vía Vercel (deploy desde GitHub, dominio conectado vía IONOS).

---

## Fases completadas

| Fase | Descripción |
|------|-------------|
| 0.5 + 1 | Flujo profesional de recepción de paquetes con motor de precios |
| 2 | Gestión de estados de paquetes (individual y masiva) con historial enriquecido |
| 3 | Gestión de lotes de salida con manifiesto y exportación CSV |
| 4 | Exportación Excel/CSV e importación masiva con `DataTable` reutilizable |
| 5 | Portal de clientes: solicitudes de envío con flujo de revisión interna |
| 6 | Cobros, gastos y agregados contables reales |
| 7 | Analítica de marketing de clientes (segmentos, etiquetas, historial de contacto) |
| 8 | Reportes con datos reales y panel operativo de administración |
| 9 | Documentos imprimibles: recibo, comprobante de pago, hoja de entrega |
| 10 | Página de configuración del negocio respaldada por `settings` |
| 11 | Limpieza del sistema de roles con `contabilidad` y `logistica` |
| 12 | Auditoría inmutable con visor para administración |
| **13** | **Migración completa a Supabase** (ver desglose abajo) |
| 15 | Sistema de tarifas dinámicas: precios editables desde el panel y calculadora pública conectada en vivo |
| 16 | Páginas públicas de modelos de negocio (Partner, Franquicia, Punto de Entrega) con formularios de contacto |
| 17 | Precios Express por tipo de contenido (kg/unidad) en panel y calculadoras |
| 18 | Panel de altas de afiliados (aprobar Agente/Influencer) y campana de notificaciones del admin |
| 19 | Página dedicada de gestión de solicitudes de Agentes/Influencers con tabla, subtabs, modales y revocación |
| 20 | Módulo de incidencias: registro propio con tipo/prioridad/estado, asignación, resolución e historial |
| 21 | Rediseño del sistema de Influencer: promoción pasiva, comisión por cliente nuevo referido y estado de actividad en tiempo real |
| 22 | Notificación por email al aprobar/rechazar solicitudes de afiliado (Edge Function Resend) |
| **23** | **Sistema centralizado de cupones:** tabla `cupones`, servicio `cupones.ts`, página admin `/dashboard/cupones`, refactorización de la validación de códigos de referido, actualización de AuthContext para usar RPC atómico |
| **24** | **Actualización de precios base:** Express 13 €/kg y Móvil/Celular 30 €/unidad (migración `0014`). Soporte técnico por email (widget flotante + Edge Function `soporte-email`) accesible desde footer, chatbot, login y acceso denegado |
| **25** | **Programa de Viajeros:** tabla `ofertas_viajero` (migración `0015`), tablero "Kilos Disponibles" visible para todos los usuarios autenticados, publicación de viajes con kg disponibles. Requiere identidad verificada (documento subido en Mi Perfil → `extra.documentoIdentidadUrl`). Cláusula de exención de responsabilidad aceptada explícitamente. **Parte 2 — sistema de reservas:** tabla `reservas_viajero` (migración `0016`), flujo completo de solicitud → aceptación/rechazo del viajero; el cupo de kg de la oferta se bloquea (`kilos_reservados`) mientras la reserva está pendiente o aceptada, y se libera si se rechaza/cancela; el contacto (teléfono/email) solo se revela tras la aceptación mutua; notificación por email vía Resend (Edge Function `notificar-reserva-viajero`) en cada cambio de estado (nueva solicitud, aceptada, rechazada) |
| **26** | **Programa de Viajeros — Fase 1 (venta a ToPaquete):** migración `0017` extiende `reservas_viajero` (sin reconstruirla) para admitir reservas hechas por el admin en nombre de ToPaquete (`reservado_por`, `notas_internas`, estado `confirmada`). Los clientes publican kilos desde "Vender mis Kilos" (antes "Kilos Disponibles") con un flujo simplificado: solo "Publicar mi viaje" y "Mis Viajes Publicados" (con badge "✅ ToPaquete reservó X kg"), sin tablero público ni botón de reservar entre clientes. Nuevo panel admin `/dashboard/admin/viajeros` ("Ofertas de Viajeros"): lista de todas las ofertas activas con contacto del viajero, reserva de kilos en nombre de ToPaquete con cálculo de precio en vivo y notas internas, y pestaña de reservas confirmadas con acciones "Completada"/"Cancelar". Notificación por email al viajero vía Resend (Edge Function `notificar-reserva-admin`). El mercado público entre clientes (Fase 2, UI ya construida en la Fase 25) queda oculto detrás del flag `settings.viajeros_marketplace_publico` (`activo: false` por defecto) — al activarlo se restaura sin reconstruir nada. **PENDIENTE (Fase 2, no activar todavía):** poner `viajeros_marketplace_publico.activo` en `true` cuando se decida abrir el mercado cliente-a-cliente. |
| **28** | **Badge "Próxima Salida" dinámico en el home:** el badge del Hero de `Landing.tsx` (antes hardcodeado "Viernes 10 de Abril") ahora se conecta a la tabla `salidas`. Nueva función `getProximasSalidas()` en `ofertasSalidas.ts` que devuelve la próxima salida vigente (fecha >= hoy, estado no cancelado/finalizado) de tipo `aerea` (Regular) y de tipo `express` (Express). El badge muestra ambas fechas ("📦 Regular: … · ⚡ Express: …"), o solo la disponible, o se oculta si no hay ninguna programada; skeleton sutil mientras carga. Fecha formateada en español con `Intl.DateTimeFormat('es-ES')` y primera letra en mayúscula. Gestionable 100% desde "Ofertas y Salidas" sin tocar código: al crear una salida (estado `Programada`, fecha hoy/futura) aparece en el home en la siguiente carga, sin redeploy. **Migración `0019_salidas_lectura_publica.sql`:** la política RLS previa solo permitía lectura a usuarios autenticados; se añade lectura pública (anon) limitada a las salidas vigentes para que el badge funcione para visitantes sin sesión. |
| **27** | **Corrección · registro de agentes remotos:** el campo obligatorio "Oficina / Sucursal" bloqueaba el botón "Finalizar Registro y Entrar" a los agentes, que trabajan en remoto (WhatsApp, Facebook, Telegram, boca a boca) y no tienen oficina física. Se elimina ese campo del formulario "Completa tu Perfil" (`App.tsx`) y del editor de perfil del agente (`Perfil.tsx`), se quita la validación bloqueante `(profile.role !== 'agente' || profile.oficina)` de la condición `isComplete`, y se sustituye por un campo **opcional** "¿Por dónde sueles vender?" (select: WhatsApp / Facebook / Telegram / Boca a boca / Instagram / Otro) guardado en `extra.canalVenta`. **No requiere migración:** los campos de perfil (`oficina`, `canalVenta`, etc.) viven dentro de la columna `extra` (jsonb) de `profiles`, no en columnas propias. El alta manual de agentes desde el panel admin (`Usuarios.tsx`) conserva su campo "Oficina" opcional (no bloqueante) por si el admin lo quiere anotar. |
| **33** | **Corrección · bug crítico de contexto perdido con Google OAuth en "Únete a la Red":** `loginWithGoogle()` en `src/supabase.ts` tenía un `redirectTo` fijo a `/dashboard`, así que cuando alguien entraba a `/unirse` (registro de Agente/Influencer) y usaba "Continuar con Google", al volver del OAuth terminaba en `/dashboard` como cliente nuevo, perdiendo por completo el rol que había elegido. Se añade un parámetro opcional `redirectPath` a `loginWithGoogle()`, y `Unirse.tsx` ahora pasa `/unirse?tipo=${selectedRole}` como ruta de retorno; los dos `useEffect` existentes (uno que lee `tipo` de la URL y pone `step='auth'`, otro que pasa a `step='form'` cuando ya hay `user`) ya se combinaban correctamente sin más cambios, así que el usuario cae directo en el formulario de solicitud al volver autenticado. Se revisaron `SerAgente.tsx`, `SerInfluencer.tsx`, `SerPartner.tsx`, `Franquicia.tsx` y `PuntoDeEntrega.tsx`: ninguna tiene su propio botón de Google (navegan a `/unirse?tipo=...` o a `/login?mode=register&role=...`), y este último ya resolvía el mismo problema desde antes con un mecanismo distinto (`localStorage.pending_role`/`pending_ref` en `AuthContext.tsx`), así que no necesitaron cambios. |
| **30** | **Migración genérica de clientes entre agentes:** se elimina el código hardcodeado `handleMigrateRoxana` y el botón "Migrar a Roxana" (caso puntual que reasignaba todos los clientes a un agente buscado por nombre). Se sustituye en `Clientes.tsx` por una herramienta genérica "Migrar clientes" (solo admin): modal con selector "Migrar de" ("Todos los clientes sin agente asignado" o un agente/partner concreto, mostrando cuántos clientes tiene cada uno) y "Migrar a" (agentes/partners `role IN ('agente','partner')` con nombre + email), texto de confirmación "Se migrarán X clientes de [origen] a [destino]", checkbox obligatorio y botón "Confirmar migración". Usa `updateCliente(id, { agenteId })` por cliente, muestra un toast "X clientes migrados a [agente]" y registra la acción en la tabla `auditoria` (`registrarAuditoria`, acción `cambio_datos_cliente`). |
| **32** | **Corrección · botón flotante de Soporte solapado con el sidebar:** `SoporteWidget.tsx` posicionaba su botón y panel en `fixed bottom-6 left-6`, lo que en vista móvil coincidía con la esquina donde vive "Cerrar sesión" del menú lateral (`Sidebar.tsx`, también anclado a la izquierda). Se mueve el widget de Soporte a `bottom-6 right-6` (botón y panel) tanto en `Layout.tsx` (interno) como en `PublicLayout.tsx` (público), ya que el sidebar siempre vive en el lado izquierdo. Como `Chatbot.tsx` ya ocupaba `bottom-6 right-6`, se sube su botón y ventana a `bottom-24 right-6` para que ambos widgets convivan sin tocarse. Verificado con captura automatizada (Playwright, viewports 320px y 375px): a 320px (iPhone SE 1.ª gen) seguía quedando un solape residual de unos píxeles entre el sidebar abierto y el botón de Soporte, así que de paso se sube el `z-index` del `Sidebar` de `z-40` a `z-[45]` (por encima de los botones flotantes, que quedan en `z-40`) para que el panel del menú los tape limpiamente en cualquier ancho en vez de solaparse visualmente con ellos. |
| **31** | **Programa de Viajeros — cambio de unidad a maletas:** el módulo "Kilos Disponibles" pasa a funcionar por **maletas** (unidad completa: 1, 2, 3…) en vez de kg sueltos, porque los clientes con un viaje planificado venden el espacio de equipaje que no van a usar, no una cantidad arbitraria de peso. Migración `0021_maletas.sql` renombra `ofertas_viajero.kilos_disponibles/kilos_reservados/precio_kg` → `maletas_disponibles/maletas_reservadas/precio_maleta` y `reservas_viajero.kilos_solicitados` → `maletas_solicitadas`; añade `settings.config_maletas` (`{ kgPorMaleta: 23 }`) como peso estándar interno para seguir cruzando con `solicitudes_express`, que continúa en kg sin cambios. `src/services/viajeros.ts` actualizado de punta a punta (`getMaletasRestantes`, conversión a kg solo en los dos puntos de cruce con Express: `crearOferta` al notificar matches, y `buscarSolicitudesCoincidentes`). UI: nuevo componente `ContadorMaletas` (+/-) para elegir cantidad en "Publicar mi viaje" y al reservar; banners explicativos en "Tablero de viajes" y "Mis Reservas"; tarjetas muestran "🧳 X maletas disponibles · Y€/maleta". Reflejado también en el panel admin `AdminViajeros.tsx` (tabla y modal de reserva). Las Edge Functions `notificar-match-express` y `notificar-reserva-admin` actualizan sus textos y payloads a maletas. **NOTA:** la migración se numeró `0021` (no `0019`, ya ocupado por `0019_salidas_lectura_publica.sql`, y `0020` también ocupado). |
| **29** | **Programa de Viajeros — lado de la demanda + notificaciones reales:** (1) **Filtro simplificado** en el "Tablero de viajes": los campos "Desde"/"Hasta" se sustituyen por un único "Fecha de salida" (coincidencia exacta, o todas si está vacío). (2) **Tabla `solicitudes_express`** (migración `0020`): un cliente publica que necesita enviar Express (provincia, fecha límite, kilos, precio dispuesto/kg, notas) desde el nuevo tab "Solicitar Express" en "Vender mis Kilos" (disponible en Fase 1 y Fase 2); lista "Mis solicitudes" con badges Pendiente/Te avisamos/Cumplida/Cancelada y opción de cancelar. (3) **Sistema de notificaciones in-app** (tabla `notificaciones` + servicio `notificaciones.ts`): la campanita del `Topbar` ahora muestra las notificaciones reales del usuario logueado (todos los roles) además de los contadores de admin (afiliados/B2B), con marcar-leída al hacer clic + navegación al `link`, y "Marcar todas como leídas". (4) **Matching automático:** al publicar una oferta (`crearOferta`), la Edge Function `notificar-match-express` (service role, evita la RLS) busca solicitudes Express pendientes que coincidan (misma provincia, kilos ≤ disponibles, fecha límite ≥ salida) y por cada una crea la notificación in-app, envía email vía Resend y marca la solicitud como `notificado`. (5) **Panel admin** `/dashboard/admin/viajeros`: nuevo tab "Solicitudes Express" con todas las solicitudes (cliente, destino, fecha, kg, precio, estado, notas) para priorizar a qué viajeros contactar. **NOTA:** la migración se numeró `0020` (no `0018`, ya ocupado por `0018_precio_express_normal.sql`). |

### Desglose Fase 13 · Migración a Supabase

- **13.1** Esquema SQL completo y políticas RLS (`0001_schema.sql`, `0002_rls.sql`).
- **13.2** Autenticación migrada a Supabase Auth + tabla `profiles`.
- **13.3** Migración de todas las colecciones de Firestore a tablas de Supabase:
  clientes, destinatarios, paquetes, eventos, pagos, lotes, gastos, solicitudes,
  auditoría, facturas B2B, settings, ofertas/salidas, afiliados e influencers.
- **13.4** Eliminación total de Firebase (código, dependencia npm y archivos de config).
- **13.5** Storage para documentos de identidad de agentes (`0004_storage_documentos.sql`).

### Fase 15 · Sistema de tarifas dinámicas

- **Tablas Supabase** (`0006_tarifas.sql`):
  - `tarifas_envio`: precio base por modalidad (`regular`/`express`) y tramo de
    peso (`peso_min`/`peso_max`, `peso_max = null` = sin límite), con `precio_kg`
    y `activo`. Datos iniciales: Regular 1-999kg a 5.00€/kg, Express 1-999kg a 8.00€/kg.
  - `tarifas_transporte_cuba`: recargo por transporte provincial (`provincias text[]`,
    `precio_kg`, `activo`). Cobertura: La Habana (0.00€/kg, base) + 14 provincias
    agrupadas en 4 tramos (1.30€/kg, 1.40€/kg, 1.50€/kg, 1.60€/kg). Isla de la
    Juventud queda fuera (sin cobertura).
  - RLS: lectura pública (`using (true)`, necesaria para la calculadora de la
    landing sin login), escritura solo `admin`.
- **Servicio** `src/services/tarifas.ts`: `getTarifasEnvio`, `getTarifasTransporte`,
  `calcularPrecio` (precio base + recargo provincial según peso/modalidad/provincia),
  `upsertTarifaEnvio/Transporte`, `deleteTarifaEnvio/Transporte`, y constante
  `PROVINCIAS_CUBA` con las 15 provincias con cobertura.
- **Panel admin** (`OfertasSalidas.tsx`, sección "Tarifas y Precios", solo admin):
  tablas editables de tramos de envío (Regular/Express) y grupos provinciales,
  con modales (`TarifaEnvioFormModal`, `TarifaTransporteFormModal`) para
  crear/editar/eliminar; los cambios se guardan en Supabase al instante.
- **Calculadora de la landing** (`Landing.tsx`): carga las tarifas desde Supabase
  al entrar (con spinner de carga), el selector de provincia y el slider de peso
  son dinámicos según las tarifas activas, y muestra el desglose del precio
  (base + transporte Cuba = total). Si no hay tarifa para el tramo/provincia,
  muestra "Consultar precio".

### Fase 16 · Páginas públicas de modelos de negocio

- **Tabla Supabase `contactos_partners`** (`0008_contactos_partners.sql`) para las
  solicitudes de los tres modelos de negocio, distinguidas por `tipo_solicitud`
  (`partner`, `franquicia`, `punto_de_entrega`). RLS: inserción pública (anon,
  los formularios los rellenan visitantes sin login), lectura/gestión solo admin.
  Ampliada en `0009_contactos_partners_extra.sql` con `ciudad` y `datos jsonb`
  (preguntas específicas de cada formulario: local disponible, experiencia,
  báscula); `empresa` pasa a opcional porque la franquicia no lo recoge.
- **Servicio** `src/services/contactosPartners.ts`: `crearContactoPartner`,
  común a los tres formularios.
- **`/ser-partner`** (`SerPartner.tsx`): rediseño enfocado al modelo Partner
  (empresas que usan nuestra logística con su propia marca). 6 secciones + 
  formulario de contacto que guarda con `tipo_solicitud = 'partner'`.
- **`/franquicia`** (`Franquicia.tsx`): franquicia bajo la marca ToPaquete.
  Hero, tabla comparativa Punto de Entrega/Partner/Franquicia, qué incluye,
  para quién es, proceso en 4 pasos y formulario (`tipo_solicitud = 'franquicia'`).
- **`/punto-de-entrega`** (`PuntoDeEntrega.tsx`): negocios existentes que añaden
  la recepción de paquetes como servicio. 7 secciones (qué es, para qué negocios,
  cómo funciona, requisitos, beneficios) y formulario
  (`tipo_solicitud = 'punto_de_entrega'`).
- **Navbar público** (`PublicLayout.tsx`): el ítem "Negocio" pasa a ser un
  desplegable con Modelos de Negocio, Partner Logístico, Franquicia, Punto de
  Entrega, Influencer y Únete como Agente.
- **Panel admin** (`SolicitudesB2B.tsx`, nueva pestaña "Solicitudes Web" en
  `Negocios.tsx`): lista todas las solicitudes de `contactos_partners` con
  filtros por tipo (Partner/Franquicia/Punto de Entrega) y por estado, detalle
  expandible (email, teléfono, mensaje y datos específicos) y botón para marcar
  como atendido/reabrir. Solo accesible para admin.

### Arreglos posteriores del flujo de acceso

- Acceso con Google configurado y funcionando (proveedor habilitado en Supabase).
- Registro de **partners / puntos de entrega**: `/login?mode=register&role=partner`
  ahora asigna correctamente `role='partner'` (antes quedaban como `cliente`).
- Formulario de email en `/unirse` (alta de agentes/influencers): ahora permite
  crear cuenta o iniciar sesión con email/contraseña (antes estaba inerte).
- Registro: campo de contraseña con opción de verla y confirmación (repetir
  contraseña) antes de enviar, distinto del formulario de login.
- `/unirse` (alta de Agente): la subida de ID/Pasaporte ahora sube el archivo
  al bucket privado `documentos-identidad` de Supabase Storage y guarda la
  ruta en `solicitudes_afiliado.datos.documentoIdentidad`.

### Roles del sistema

| Rol | Cómo se obtiene |
|-----|-----------------|
| `admin` | Único. Correo definido en `VITE_BOOTSTRAP_ADMIN` (`gaosvbc@gmail.com`) |
| `partner` | Alta vía `/ser-partner` → `/login?mode=register&role=partner` |
| `agente` / `influencer` | Alta vía `/unirse` (queda como solicitud para revisión) |
| `contabilidad` / `logistica` | Creados por el admin desde el panel de usuarios |
| `cliente` | Rol por defecto de cualquier registro normal |

---

## Pendientes para finalizar la plataforma

### ⚠️ Acciones manuales pendientes (consolidado — hacerlas todas de una)

Todo lo que hay que ejecutar a mano en Supabase para que lo desarrollado quede
operativo. Todas las migraciones son idempotentes (seguras de re-ejecutar),
salvo `0011` que usa `create table`/`create policy` sin `if exists` (si ya se
corrió, dará un error inofensivo de "ya existe" y se ignora).

**A) Migraciones en el SQL Editor** (en orden; ejecuta las que no estés seguro de haber corrido):

- [ ] `0011_incidencias.sql` (tabla `incidencias` + RLS) — *no idempotente*
- [ ] `0012_influencer_referidos.sql` (índice + `influencer_config`)
- [ ] `0013_cupones.sql`
- [ ] `0014_actualizar_precios.sql`
- [ ] `0015_ofertas_viajero.sql`
- [ ] `0016_reservas_viajero.sql`
- [ ] `0017_viajeros_fase1_admin.sql`
- [ ] `0018_precio_express_normal.sql` (precio base Express "Miscelánea Normal" = 13 €/kg)
- [ ] `0019_salidas_lectura_publica.sql` (lectura pública del badge "Próxima salida" del home) — **nueva**
- [ ] `0020_solicitudes_express_notificaciones.sql` (tablas `solicitudes_express` + `notificaciones` + RLS) — **nueva**
- [ ] `0021_maletas.sql` (cambio de unidad de `ofertas_viajero`/`reservas_viajero` a maletas + `settings.config_maletas`) — **nueva**

**B) Edge Functions a desplegar** (Dashboard → Edge Functions → Deploy, o `supabase functions deploy <nombre>`):

- [ ] `notificar-solicitud` (emails de aprobación/rechazo de agente/influencer — *reportado: no llegan; falta desplegar*)
- [ ] `notificar-match-express` (matching de solicitudes Express → email + notificación in-app) — **REdesplegar**: cambió el payload a maletas
- [ ] `notificar-reserva-admin` — **REdesplegar**: cambió el payload a maletas (antes `kilos`, ahora `maletas`)
- [ ] `soporte-email`, `notificar-reserva-viajero` (confirmar que ya están desplegadas)

**C) Secrets / configuración:**

- [ ] `RESEND_API_KEY` configurada como secret de las Edge Functions (necesaria para TODOS los emails).
      `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase automáticamente (no hay que ponerlas).

> Cómo saber si falta la `RESEND_API_KEY` o solo falta desplegar una función: si los
> correos de **soporte** SÍ llegan, la clave ya está bien y solo falta desplegar las
> funciones que no lleguen; si **tampoco** llegan los de soporte, falta la `RESEND_API_KEY`.

---

### En el panel de Supabase (acciones manuales del dueño)

- [x] Ejecutar la migración `supabase/migrations/0003_afiliado_datos.sql` en el
      SQL Editor (añade la columna `datos jsonb` a `solicitudes_afiliado`,
      necesaria para el formulario de `/unirse`).
- [x] Ejecutar la migración `supabase/migrations/0004_storage_documentos.sql` en
      el SQL Editor (crea el bucket privado `documentos-identidad` y sus
      políticas de acceso para la subida de ID/Pasaporte de agentes).
- [x] Confirmar que **"Confirm email"** sigue desactivado en
      Authentication → Providers → Email (si no, los registros nuevos quedan sin confirmar).
- [x] Configurar **SMTP propio** (Resend) para evitar el límite de envío de
      correos de Supabase (~2-4/hora en el plan gratuito). Dominio
      `topaquete.com` verificado en Resend (SPF + DKIM) y SMTP de Resend
      conectado en Authentication → SMTP Settings de Supabase.
- [x] Ejecutar las migraciones `supabase/migrations/0008_contactos_partners.sql`
      y `0009_contactos_partners_extra.sql` en el SQL Editor (crean la tabla
      `contactos_partners` con sus políticas RLS y los campos `ciudad`/`datos`
      para los formularios de Partner, Franquicia y Punto de Entrega).

### Funcionalidad pendiente en código

- [x] **Google OAuth:** configurado y funcionando (proveedor Google habilitado
      en Supabase con credenciales de Google Cloud Console).
- [x] **Subida de ID/Pasaporte en `/unirse`:** conectado a **Supabase Storage**
      (bucket privado `documentos-identidad`), migración aplicada.
- [x] **Recuperación de contraseña:** enlace "¿Olvidaste tu contraseña?" en
      `/login` (`mode=forgot`) que envía un correo de recuperación vía
      `supabase.auth.resetPasswordForEmail`, y página `/reset-password` para
      definir la nueva contraseña (`supabase.auth.updateUser`).

### Despliegue

- [x] Conectar dominio y publicar la web (hosting + variables de entorno de
      producción). Desplegado en Vercel, dominio `topaquete.com` conectado vía
      IONOS, variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
      `VITE_BOOTSTRAP_ADMIN`) configuradas, y `vercel.json` con rewrites para el
      SPA. Redirect URLs de Supabase Auth actualizados al dominio de producción.
- [x] **Code-splitting:** todas las páginas (`src/pages/*`) ahora se cargan con
      `React.lazy()` + `Suspense` en `App.tsx`. El chunk principal bajó de
      ~2.68 MB a ~971 kB; el resto se divide en chunks por página/funcionalidad
      que se descargan según la ruta visitada.
- [x] **Optimización de carga para Cuba (conexiones lentas):** el `Layout`
      del dashboard y el `Chatbot` (que cargaba `@google/genai` +
      `react-markdown`) ahora se cargan también con `React.lazy()`. El chunk
      principal —el que descarga cualquier visitante, incluido la página de
      inicio— bajó de ~971 kB a ~535 kB (gzip: ~254 kB → ~153 kB).
- [x] **Campo `provincia` (España) en Cliente:** nuevo campo opcional para el
      remitente, necesario para el manifiesto de exportación a España.
      Migración `0005_cliente_provincia.sql` (columna `provincia text` en
      `clientes`) aplicada en Supabase, añadido a `types/models.ts`,
      `services/clientes.ts` (lectura/escritura), y al formulario de cliente
      en `Clientes.tsx` y en el modal "Nuevo Cliente" de Recepción
      (`ClienteFormModal.tsx`), entre Localidad y Código Postal.
      Label: "Provincia (España)".

---

## Plataforma en producción

- **URL:** https://topaquete.com
- **Hosting:** Vercel (deploy automático desde GitHub, rama de producción).
- **Backend:** Supabase (Auth + Postgres + RLS), proyecto `idcfuravemoljjxbdkeh`.
- **Correo transaccional:** Resend (dominio `topaquete.com` verificado con SPF + DKIM),
  conectado como SMTP propio de Supabase Auth.

---

## Variables de entorno (`.env.local`)

```
VITE_SUPABASE_URL=https://idcfuravemoljjxbdkeh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key del proyecto>
VITE_BOOTSTRAP_ADMIN=gaosvbc@gmail.com
```

> `.env.local` está en `.gitignore`: no se sube al repo y debe crearse a mano en
> cada máquina/entorno.

### Fase 18 · Altas de afiliados y notificaciones del admin

- **Problema corregido:** las solicitudes de Agente/Influencer enviadas desde
  `/unirse` se guardaban en la tabla `solicitudes_afiliado`, pero **ninguna vista
  del admin las leía** (la pestaña "Solicitudes Web" solo mostraba los leads de
  `contactos_partners`: Partner, Franquicia y Punto de Entrega). Por eso el admin
  veía la bandeja vacía aunque en Supabase sí estaban las filas.
- **Servicio** `src/services/afiliados.ts`: nuevas funciones `getSolicitudesAfiliado`,
  `contarSolicitudesAfiliadoPendientes`, `aprobarSolicitudAfiliado` (promueve el
  perfil del solicitante al rol pedido y copia los datos del formulario al perfil),
  `rechazarSolicitudAfiliado` y `getUrlDocumentoIdentidad` (URL firmada del ID/pasaporte).
- **Nueva pestaña admin** `SolicitudesAfiliados.tsx` dentro de `Negocios.tsx`
  ("Altas de Afiliados"): lista las solicitudes con filtro por estado
  (pendiente/aprobada/rechazada), botones **Aprobar / Rechazar**, detalle expandible
  (contacto, país/ciudad, red social, seguidores…) y enlace al documento de identidad.
  Al aprobar, el usuario obtiene el rol de agente/influencer y ya puede entrar al panel.
- **Campana de notificaciones** (`Topbar.tsx`): para el admin muestra un badge con el
  total de solicitudes pendientes (afiliados + leads B2B) y un menú desplegable que
  enlaza a la pestaña correspondiente (`?tab=altas` / `?tab=solicitudes`). Se refresca
  cada 60s. Antes era un botón estático con un punto rojo decorativo.
- **Flujo Partner B2B:** una empresa solicita colaboración desde la página pública
  `/ser-partner` (formulario que guarda en `contactos_partners` con
  `tipo_solicitud='partner'`); el admin la ve en Negocios → "Solicitudes Web".

### Fase 19 · Página dedicada de gestión de solicitudes de Agentes/Influencers

- **Nueva ruta `/dashboard/solicitudes-afiliados`** (solo `admin`, vía `RoleRoute`):
  `SolicitudesAfiliados.tsx` deja de ser una pestaña dentro de "Negocios" y pasa a
  ser una página propia con su entrada en el menú lateral ("Solicitudes Afiliados",
  con badge rojo del número de pendientes, refrescado cada 60s).
- **Tabla** con columnas Fecha, Nombre, Tipo (Agente/Influencer), Red Social/Canal,
  Seguidores, País, Estado y Acciones; fila expandible con email, WhatsApp, enlace
  de perfil, resto de campos de `datos` y enlace al documento de identidad.
- **Subtabs** por tipo de solicitud (Todos los tipos / Agentes / Influencers) además
  del filtro por estado (Todas / Pendientes / Aprobadas / Rechazadas).
- **Modales de confirmación:** "Aprobar" muestra el rol que se va a asignar antes de
  confirmar; "Rechazar" permite indicar un motivo opcional que se guarda en
  `datos.motivo_rechazo` y se muestra en el detalle de la solicitud.
- **Nuevas acciones:** "Revocar" (aprobada → pendiente) y "Revisar de nuevo"
  (rechazada → pendiente), usando `volverAPendienteSolicitudAfiliado` en
  `src/services/afiliados.ts`. `rechazarSolicitudAfiliado` ahora acepta un motivo
  opcional.
- La campana de notificaciones del admin (`Topbar.tsx`) enlaza ahora directamente a
  `/dashboard/solicitudes-afiliados` en lugar de `/dashboard/negocios?tab=altas`.

### Fase 20 · Módulo de incidencias

- **Tabla Supabase `incidencias`** (`0011_incidencias.sql`): cada incidencia es un
  caso de gestión propio (antes "incidencia" solo existía como estado del paquete).
  Campos: `codigo` (INC-XXXXX), `tipo`, `prioridad` (baja/media/alta/critica),
  `estado` (abierta/en_proceso/resuelta/cerrada), `titulo`, `descripcion`,
  `resolucion`, `asignado_a` y `reportado_por` (FK a `profiles`), `historial jsonb`
  (comentarios y cambios cronológicos) y vínculo opcional a un paquete
  (`paquete_id` + `paquete_tracking`/`cliente_nombre` denormalizados).
  RLS: lectura operativa + finanzas, escritura operativa (admin/agente/logística),
  borrado solo admin.
- **Servicio** `src/services/incidencias.ts`: `subscribeIncidencias` (realtime),
  `contarIncidenciasAbiertas`, `crearIncidencia`, `cambiarEstadoIncidencia`
  (registra el cambio en el historial y guarda resolución/fecha al resolver),
  `asignarIncidencia`, `agregarComentarioIncidencia`, `actualizarPrioridadIncidencia`
  y `eliminarIncidencia`. Cada creación/cambio queda en auditoría
  (`crear_incidencia` / `cambio_incidencia`).
- **Página** `/dashboard/incidencias` (`Incidencias.tsx`, roles admin/agente/logística):
  panel de KPIs (abiertas, en proceso, resueltas, críticas activas), filtros por
  estado/prioridad/tipo y buscador, lista ordenada (abiertas y críticas primero),
  modal de alta (con búsqueda de paquete por tracking que autocompleta el cliente y
  opción de marcar el paquete como "Incidencia") y panel lateral de detalle con
  cambio de estado/prioridad, asignación de responsable, resolución e hilo de
  comentarios.
- **Catálogos** en `constants/estados.ts`: `TIPOS_INCIDENCIA`, `PRIORIDADES_INCIDENCIA`
  y `ESTADOS_INCIDENCIA`.
- **Sidebar**: enlace "Incidencias" para admin, agente y logística con badge del
  número de incidencias abiertas (refresco cada 60s). El KPI "Incidencias Abiertas"
  del Dashboard ahora enlaza a `/dashboard/incidencias`.

> **Acción manual pendiente en Supabase:** ejecutar `0011_incidencias.sql` en el
> SQL Editor para crear la tabla `incidencias` y sus políticas RLS.

### Fase 21 · Rediseño del sistema de Influencer

- **Modelo diferenciado del de Agente:** el influencer solo hace promoción pasiva
  (comparte un código/enlace de descuento). No gestiona clientes ni tiene red de
  sub-afiliados. ToPaquete se encarga de toda la operación.
- **Regla de comisión:** solo cuentan los clientes **nuevos** que se registran con
  su código (quedan vinculados vía `profiles.extra->>'referidoPor'`). Una vez
  referido, el influencer cobra comisión de **todos** los envíos futuros de ese
  cliente, indefinidamente, **mientras esté "activo"**.
- **Estado de actividad (ventana móvil de 90 días):** "activo" = ha traído al menos
  1 cliente nuevo en los últimos `ventanaActividadDias`. Si pasa la ventana sin
  traer ninguno, pasa a "inactivo" y deja de generar comisión en **toda** su cartera
  hasta reactivarse. La comisión de cada envío se evalúa con el estado de actividad
  del influencer en el momento de ese envío (sin retroactividad).
- **Migración** `0012_influencer_referidos.sql`: tras revisar `0001_schema.sql`, se
  comprobó que `profiles.referidoPor` ya vive en `extra` y `created_at` ya existe,
  así que **no se añaden columnas**. Solo añade un índice sobre `extra->>'referidoPor'`
  y siembra `settings/influencer_config` (`comisionPct: 0.05`, `ventanaActividadDias: 90`).
- **Servicio** `src/services/influencers.ts`: `getClientesReferidos`,
  `getEstadoActividadInfluencer`, `getComisionesInfluencer` y `getResumenInfluencer`
  (carga combinada). La cartera se reconstruye encadenando
  `profiles → clientes.user_id → clientes.id → paquetes.cliente_id`.
- **Dashboard rediseñado** (`InfluencerDashboard.tsx`): banner de actividad
  (verde/ámbar con fecha límite y días restantes), card "Tu enlace de promoción"
  con copiar, 4 stats (clientes nuevos, kg gestionados del mes, comisión del mes,
  comisión total) y tabla de clientes referidos con badge Nuevo/Antiguo, kg
  enviados y última actividad.
- **Eliminado:** niveles Bronce/Plata/Oro/Élite, simulador de seguidores,
  sub-afiliados y el enlace "Mi Red" del sidebar para influencers.
- **Role-aware** (corrección posterior): `ComisionesAgente.tsx` y
  `ProgramaAfiliados.tsx` ahora detectan el rol al renderizar. Para
  `role === 'influencer'` muestran el sistema de clientes referidos/actividad
  (sin niveles ni simulador); para `role === 'agente'` mantienen el sistema
  original de Niveles y Simulador de Ganancias.
- **Código de referido editable**: el influencer puede personalizar su código
  desde la card "Tu enlace de promoción" en el Dashboard y en Mis Ganancias.
  Se normaliza (mayúsculas, espacios→guiones, solo `[A-Z0-9-]`, máx. 20 caracteres),
  se verifica unicidad contra el resto de perfiles y se guarda en
  `profiles.extra.codigoReferido`. Componente reutilizable en
  `src/components/influencer/CodigoReferidoCard.tsx`; función de servicio
  `actualizarCodigoReferido` en `src/services/influencers.ts`.

> **Acción manual pendiente en Supabase:** ejecutar `0012_influencer_referidos.sql`
> en el SQL Editor (añade el índice y siembra `influencer_config`).

### Fase 22 · Notificaciones de email al gestionar solicitudes de afiliado

- **Edge Function** `supabase/functions/notificar-solicitud/index.ts`: recibe
  `{ email, nombre, resultado, rolSolicitado, motivoRechazo? }` y envía un email
  vía la API de Resend (`RESEND_API_KEY` como secret de la Edge Function).
  Remitente: `ToPaquete <notificaciones@topaquete.com>`.
- **Plantilla aprobado:** asunto "🎉 Tu solicitud de [Agente/Influencer] ha sido
  aprobada", saludo, mensaje de aprobación, botón CTA "Acceder a mi panel" que
  enlaza a `https://topaquete.com/dashboard`. HTML inline con colores de marca
  (`#00314F` / `#EE293B`), cabecera con logo TP y pie de página.
- **Plantilla rechazado:** asunto "Actualización sobre tu solicitud en ToPaquete",
  mensaje de rechazo, motivo destacado si se proporcionó (bloque rojo), invitación
  a responder al email para dudas.
- **Servicio** `afiliados.ts`: función interna `enviarNotificacionSolicitud` llamada
  al final de `aprobarSolicitudAfiliado` y `rechazarSolicitudAfiliado`. El error de
  envío solo se loguea, nunca bloquea la operación principal.
- **Panel admin** `SolicitudesAfiliados.tsx`: toast visible 4 s tras aprobar o
  rechazar: "✅ Solicitud aprobada y correo enviado a [email]".
- `tsconfig.json`: añadido `"exclude": ["supabase/functions"]` para que el
  compilador de Vite no intente tipar las Edge Functions de Deno.

> **Acción manual requerida: desplegar la Edge Function en Supabase.**
> En la raíz del proyecto, con la CLI de Supabase instalada y sesión activa:
> ```bash
> supabase functions deploy notificar-solicitud --project-ref idcfuravemoljjxbdkeh
> supabase secrets set RESEND_API_KEY=<tu_clave> --project-ref idcfuravemoljjxbdkeh
> ```
> O bien desde el Dashboard de Supabase → Edge Functions → Deploy desde GitHub.

### Fase 23 · Correcciones en emails de Resend + email de bienvenida

- **Footer con año hardcodeado:** `© 2025 ToPaquete` (y `© 2026` en `soporte-email`)
  estaba escrito a mano en el HTML. Cambiado a año dinámico
  (`© ${new Date().getFullYear()} ToPaquete`) en `notificar-solicitud`,
  `notificar-reserva-viajero` y `soporte-email`.
- **Texto engañoso "responde a este mensaje":** `notificaciones@topaquete.com` es
  una dirección de solo envío sin buzón real; nadie lee lo que llega ahí. Se quitó
  la invitación a responder ese correo en las plantillas aprobado/rechazado de
  `notificar-solicitud` y se redirige la consulta a `soporte@topaquete.com`
  (que sí tiene buzón, como ya usaba `soporte-email`).
- **Nueva Edge Function** `supabase/functions/notificar-bienvenida/index.ts`: recibe
  `{ email, nombre }` y envía "🎉 ¡Bienvenido a ToPaquete!" con el mismo patrón de
  Resend que el resto de funciones (remitente `ToPaquete <notificaciones@topaquete.com>`,
  CTA "Ir a mi cuenta" a `/dashboard`, footer con año dinámico y `soporte@topaquete.com`).
- **Disparo del correo de bienvenida:** `enviarBienvenidaCliente` en
  `src/services/profiles.ts` invoca la Edge Function. Se llama desde
  `AuthContext.tsx`, dentro de la rama de "primer login" (cuando aún no existe
  fila en `profiles` y se inserta una nueva), solo si el rol asignado es
  `cliente`. Al estar dentro de la rama de alta (no la de login con perfil ya
  existente), el correo nunca se reenvía en sesiones posteriores.

> **Acción manual requerida: desplegar la Edge Function en Supabase.**
> ```bash
> supabase functions deploy notificar-bienvenida --project-ref idcfuravemoljjxbdkeh
> ```
> (usa el mismo secret `RESEND_API_KEY` ya configurado para las otras funciones).

### Fase 24 · Programa de Viajeros: datos de vuelo en las ofertas

- **Aclaración:** el cambio de unidad de "kilos" a "maletas" en `ofertas_viajero`
  (`kilos_disponibles → maletas_disponibles`, `kilos_reservados → maletas_reservadas`,
  `precio_kg → precio_maleta`) y en `reservas_viajero`
  (`kilos_solicitados → maletas_solicitadas`) **ya se aplicó correctamente** en el
  commit `f422b7f` mediante la migración `0021_maletas.sql` (renombres idempotentes
  con guarda de `information_schema.columns`, más la siembra de
  `settings.config_maletas = { kgPorMaleta: 23 }`). `viajeros.ts`,
  `KilosDisponibles.tsx` y `AdminViajeros.tsx` ya usaban terminología de maletas en
  todo el flujo de oferta/reserva de viajeros; no había `kilos_disponibles`,
  `kilos_reservados` ni `precio_kg` pendientes en ese lado. (El lado de demanda,
  `solicitudes_express`, sigue correctamente en kg — es la unidad real en la que
  los clientes necesitan enviar, distinta de las maletas que vende cada viajero.)
- **Lo nuevo de esta fase:** datos de vuelo en cada oferta. Migración
  `0022_viajeros_vuelo.sql` añade `aerolinea text` y `hora_salida time` a
  `ofertas_viajero`.
- `viajeros.ts`: `OfertaViajero` y `NuevaOfertaViajero` incluyen `aerolinea` y
  `hora_salida` (obligatorios al crear oferta); `crearOferta` valida que ambos
  campos vengan rellenados.
- `KilosDisponibles.tsx`: el formulario "Publicar mi viaje" pide aerolínea (texto)
  y hora de salida (`input type="time"`) junto a la fecha de salida. Las tarjetas
  de oferta, la tabla "Mis Viajes Publicados", el resumen de "Mis viajes"/"Mis
  reservas" y el modal de reserva muestran la info de vuelo como
  "✈️ Aerolínea · HH:MM" mediante el helper `VueloInfo`.
- `AdminViajeros.tsx`: la tabla "Ofertas activas" suma una columna "Vuelo" y el
  modal de reserva del admin también muestra `VueloInfo`, con el mismo helper
  duplicado localmente.

> **Acción manual pendiente en Supabase:** ejecutar `0022_viajeros_vuelo.sql`
> en el SQL Editor (añade `aerolinea` y `hora_salida` a `ofertas_viajero`).

### Fase 25 · Bug crítico: `obtenerOCrearClienteDoc` nunca resolvía el cliente

- **Causa raíz:** `obtenerOCrearClienteDoc()` en `src/services/solicitudes.ts` leía
  `auth.currentUser` (el espejo síncrono de usuario definido en `src/supabase.ts`,
  pensado para código que se ejecuta bien entrado el ciclo de vida de la sesión).
  Al llamarse dentro de un `useEffect` con `[]` justo al montar `MisSolicitudes.tsx`
  (p. ej. tras recargar la página directamente en esa ruta), ese espejo todavía
  podía no haberse poblado (se rellena de forma asíncrona vía
  `supabase.auth.getSession()` y `onAuthStateChange`), así que la función
  devolvía `null` de forma silenciosa y `clienteId` quedaba `null` para siempre
  (sin reintento), dejando el botón "+ Crear nuevo" deshabilitado de forma
  permanente y bloqueando la creación de solicitudes.
- **Corrección:** `obtenerOCrearClienteDoc` y `crearSolicitud` ahora llaman a
  `supabase.auth.getUser()` directamente (async, sin depender del espejo), y se
  quitó el `import { auth } from '../supabase'` de `solicitudes.ts`. En
  `MisSolicitudes.tsx` se eliminó el mismo patrón de carrera en el efecto que
  suscribía las solicitudes del cliente: ahora usa `user` de `useAuth()` (el
  contexto de React, reactivo) en vez de `auth.currentUser`, con `user?.uid`
  como dependencia para que el efecto se vuelva a ejecutar en cuanto el usuario
  esté disponible.
- **Auditoría global de residuos de Firebase:** se buscó en todo `src/` por
  `firebase/auth`, `firebase/firestore`, `onAuthStateChanged`, `getDoc(`,
  `setDoc(`, `collection(`, `addDoc(`, `updateDoc(`, `deleteDoc(` y no se
  encontró ningún import ni dependencia real de Firebase (tampoco está en
  `package.json`). El patrón `auth.currentUser` que aparece en otros archivos
  (`Clientes.tsx`, `Recepcion.tsx`, `App.tsx`, `ClienteFormModal.tsx`,
  `lib/firestore-errors.ts` y varios `services/*.ts`) **no es residuo de
  Firebase**: es un espejo deliberado y funcional (`src/supabase.ts`, función
  `toAuthUser` + listeners de Supabase) creado a propósito para no reescribir
  ese código durante la migración. En todos esos casos se invoca dentro de
  manejadores de eventos o efectos que dependen de `role`/`profile` ya
  resueltos, momento en el que el espejo ya está poblado — no reproducen el bug
  y se dejaron sin cambios. Los dos únicos puntos donde el espejo se leía en el
  primer render (antes de que pudiera estar listo) eran los corregidos arriba,
  ambos en el flujo de "Mis Solicitudes".
- **Archivos corregidos:** `src/services/solicitudes.ts`,
  `src/pages/MisSolicitudes.tsx`.
