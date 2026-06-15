# Bitácora del proyecto · ToPaquete

Registro de avances de la plataforma de logística ToPaquete (envíos España → Cuba)
y de los pendientes para dejarla lista para producción.

Última actualización: 2026-06-14 (plataforma publicada en producción)

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
