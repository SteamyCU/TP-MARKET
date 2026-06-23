# Guía de Seguridad — ToPaquete / Proyectos Supabase + Vercel

## 1. Row Level Security (RLS)
- Activar en TODAS las tablas de Supabase sin excepción.
- Regla básica: cada usuario solo lee/escribe sus propios datos.
- Admin (y otros roles de staff: logística, agente, contabilidad según la
  tabla) ve todo mediante una función reutilizable (`is_admin()`,
  `auth_role()`) o un `exists (select 1 from profiles where id = auth.uid()
  and role in (...))` dentro de la política.
- Excepciones legítimas de lectura pública (`using (true)` en `select`):
  solo para datos que son intencionalmente públicos por diseño (tarifas,
  noticias, validación de código de cupón). Nunca para `insert`/`update`/
  `delete` sin acotar por usuario o rol.
- Verificar periódicamente con:
  ```sql
  SELECT schemaname, tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;
  ```
  Si devuelve filas, esas tablas no tienen RLS activado — crear una
  migración que lo active y añada las políticas correctas antes de
  desplegar a producción.

## 2. CORS
- Supabase: configurar en Dashboard > Settings > API > Allowed Origins,
  añadiendo solo el dominio de producción (p. ej. `https://topaquete.com`).
- Vercel: gestión automática para el dominio del proyecto.

## 3. Security Headers (vercel.json)
- `X-Frame-Options: DENY` — evita clickjacking/iframes maliciosos.
- `X-Content-Type-Options: nosniff` — evita MIME sniffing.
- `X-XSS-Protection: 1; mode=block` — protección XSS básica (legacy, pero
  inofensiva de incluir).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` — desactiva APIs sensibles del navegador
  (cámara, micrófono, geolocalización) que la app no usa.
- `Strict-Transport-Security` — fuerza HTTPS siempre.
- `Content-Security-Policy` — define exactamente qué dominios pueden
  cargar recursos en la app. **Antes de escribirla o tocarla**, auditar
  el código en busca de todo dominio externo realmente usado (llamadas
  `fetch`, SDKs que llaman a APIs de terceros desde el navegador,
  imágenes externas, fuentes, analytics, embeds) — un CSP demasiado
  restrictivo rompe funcionalidades en silencio en producción. Las
  llamadas hechas únicamente desde Edge Functions (lado servidor) NO
  necesitan estar en el CSP del navegador.
- `frame-ancestors 'none'` — nadie puede meter la web en un iframe.

## 4. Variables de entorno
- Nunca subir `.env` al repositorio (verificar `.gitignore`).
- Solo las variables `VITE_*` son públicas (van al bundle del cliente).
- Los secrets reales (API keys de servidor) van solo en Vercel Dashboard
  > Environment Variables, nunca en código ni en variables `VITE_*`.
- Rotar tokens periódicamente (Supabase Access Token, Resend API Key,
  claves de IA, etc.).

## 5. Edge Functions
- Cada función debe verificar autenticación antes de ejecutar (salvo que
  esté diseñada explícitamente para ser pública, como un webhook firmado).
- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en Edge Functions, nunca en el
  cliente (el service role ignora RLS por completo).
- Secrets de servicios de terceros (p. ej. `RESEND_API_KEY`) solo como
  secret de Edge Function, nunca expuestos al navegador.

## 6. Checklist pre-lanzamiento
- [ ] RLS activado en todas las tablas, con políticas verificadas (no solo
      "activado sin políticas", que bloquea todo silenciosamente).
- [ ] Security Headers en `vercel.json`, con el CSP auditado contra el
      código real (no copiado de otro proyecto sin revisar).
- [ ] Variables de entorno configuradas en Vercel (no en código).
- [ ] Dominio HTTPS verificado.
- [ ] Google OAuth con dominios correctos en Google Cloud Console.
- [ ] Resend (o el proveedor de email que se use) con dominio verificado.
