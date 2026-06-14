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

### Desglose Fase 13 · Migración a Supabase

- **13.1** Esquema SQL completo y políticas RLS (`0001_schema.sql`, `0002_rls.sql`).
- **13.2** Autenticación migrada a Supabase Auth + tabla `profiles`.
- **13.3** Migración de todas las colecciones de Firestore a tablas de Supabase:
  clientes, destinatarios, paquetes, eventos, pagos, lotes, gastos, solicitudes,
  auditoría, facturas B2B, settings, ofertas/salidas, afiliados e influencers.
- **13.4** Eliminación total de Firebase (código, dependencia npm y archivos de config).
- **13.5** Storage para documentos de identidad de agentes (`0004_storage_documentos.sql`).

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
