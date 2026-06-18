// Edge Function: notificar-match-express
//
// Se invoca cuando un viajero publica una oferta. Con la SERVICE ROLE key
// (ignora RLS) busca solicitudes_express pendientes que coincidan con la oferta
// y, por cada coincidencia: inserta una notificación in-app, envía un email vía
// Resend al cliente y marca la solicitud como 'notificado'.
//
// El matching se hace aquí (no en el navegador del viajero) porque la RLS impide
// que un viajero lea/escriba las solicitudes y notificaciones de otros clientes.
//
// Variables de entorno: RESEND_API_KEY (manual) + SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY (inyectadas automáticamente por Supabase).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TP_BLUE = '#00314F';
const TP_RED = '#EE293B';

interface Oferta {
  id: string;
  provincia_destino: string;
  fecha_salida: string;
  maletas_disponibles: number;
  precio_maleta: number;
  // Equivalente en kg de las maletas disponibles, para cruzar con las
  // solicitudes_express (que siguen en kg).
  kg_disponibles: number;
}

interface SolicitudExpress {
  id: string;
  cliente_id: string;
  provincia_destino: string;
  fecha_necesaria: string;
  kilos_necesarios: number;
  precio_dispuesto_kg: number;
  estado: string;
}

interface PerfilRow {
  id: string;
  email: string | null;
  extra: Record<string, unknown> | null;
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function html(nombre: string, oferta: Oferta): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Encontramos kilos para tu envío · ToPaquete</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:${TP_BLUE};padding:28px 40px;text-align:center;">
            <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:30px;font-weight:900;font-style:italic;letter-spacing:-1px;">
              <span style="color:#ffffff;">T</span><span style="color:${TP_RED};">P</span>
            </span>
            <span style="color:#ffffff;font-size:20px;font-weight:700;margin-left:8px;vertical-align:middle;">To Paquete</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:${TP_BLUE};">🎉 ¡Hola, ${nombre}!</p>
            <p style="margin:16px 0;font-size:16px;color:#374151;line-height:1.6;">
              Encontramos espacio para tu envío Express a <strong>${oferta.provincia_destino}</strong>.
              Hay <strong>${oferta.maletas_disponibles} maleta(s)</strong> disponibles el
              <strong>${formatFecha(oferta.fecha_salida)}</strong> a <strong>${oferta.precio_maleta.toFixed(2)}€/maleta</strong>.
            </p>
            <p style="margin:16px 0;font-size:15px;color:#6b7280;line-height:1.6;">
              Entra a tu cuenta para gestionar tu envío antes de que se agoten los kilos.
            </p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
              <tr>
                <td style="background:${TP_BLUE};border-radius:12px;">
                  <a href="https://topaquete.com/dashboard/kilos-disponibles"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                    Gestionar mi envío →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.5;">
              Para cualquier consulta escríbenos a
              <a href="mailto:notificaciones@topaquete.com" style="color:${TP_BLUE};">notificaciones@topaquete.com</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © 2025 ToPaquete · España → Cuba ·
              <a href="https://topaquete.com" style="color:${TP_BLUE};text-decoration:none;">topaquete.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { oferta } = (await req.json()) as { oferta: Oferta };
    if (!oferta?.id || !oferta.provincia_destino || !oferta.fecha_salida) {
      return new Response(JSON.stringify({ error: 'Falta la oferta o sus datos.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Faltan SUPABASE_URL / SERVICE_ROLE_KEY.' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const restHeaders = {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };

    // 1) Solicitudes pendientes que coinciden con la oferta:
    //    misma provincia, kilos necesarios <= disponibles, fecha límite >= salida.
    const params = new URLSearchParams({
      select: '*',
      estado: 'eq.pendiente',
      provincia_destino: `eq.${oferta.provincia_destino}`,
      kilos_necesarios: `lte.${oferta.kg_disponibles}`,
      fecha_necesaria: `gte.${oferta.fecha_salida}`,
    });
    const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes_express?${params}`, { headers: restHeaders });
    if (!matchRes.ok) {
      const txt = await matchRes.text();
      throw new Error(`Error leyendo solicitudes_express: ${txt}`);
    }
    const matches = (await matchRes.json()) as SolicitudExpress[];

    let notificados = 0;
    for (const sol of matches) {
      // Datos de contacto del cliente.
      const perfRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=id,email,extra&id=eq.${sol.cliente_id}`,
        { headers: restHeaders },
      );
      const perfiles = perfRes.ok ? ((await perfRes.json()) as PerfilRow[]) : [];
      const perfil = perfiles[0];
      const nombre = (perfil?.extra?.name as string) || perfil?.email || 'Cliente';

      // 2) Notificación in-app.
      await fetch(`${SUPABASE_URL}/rest/v1/notificaciones`, {
        method: 'POST',
        headers: restHeaders,
        body: JSON.stringify({
          user_id: sol.cliente_id,
          titulo: '¡Encontramos kilos para tu envío!',
          mensaje: `Hay un viaje disponible a ${oferta.provincia_destino} el ${formatFecha(oferta.fecha_salida)} con ${oferta.maletas_disponibles} maleta(s) disponibles a ${oferta.precio_maleta.toFixed(2)}€/maleta.`,
          tipo: 'match_express',
          link: '/dashboard/kilos-disponibles',
        }),
      });

      // 3) Email (si hay clave Resend y email del cliente).
      if (resendKey && perfil?.email) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'ToPaquete <notificaciones@topaquete.com>',
              to: [perfil.email],
              subject: `🎉 Encontramos kilos para tu envío Express a ${oferta.provincia_destino}`,
              html: html(nombre, oferta),
            }),
          });
        } catch (mailErr) {
          console.error('Error enviando email de match:', mailErr);
        }
      }

      // 4) Marcar la solicitud como notificada.
      await fetch(`${SUPABASE_URL}/rest/v1/solicitudes_express?id=eq.${sol.id}`, {
        method: 'PATCH',
        headers: restHeaders,
        body: JSON.stringify({ estado: 'notificado' }),
      });

      notificados++;
    }

    return new Response(JSON.stringify({ ok: true, notificados }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error en notificar-match-express:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
