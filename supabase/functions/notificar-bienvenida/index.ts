// Edge Function: notificar-bienvenida
// Envía un email vía Resend al registrarse un cliente nuevo en ToPaquete.
// Variables de entorno requeridas: RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TP_BLUE = '#00314F';
const TP_RED = '#EE293B';

interface Payload {
  email: string;
  nombre: string;
}

function htmlBienvenida(nombre: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenida · ToPaquete</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:${TP_BLUE};padding:28px 40px;text-align:center;">
            <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:30px;font-weight:900;font-style:italic;letter-spacing:-1px;">
              <span style="color:#ffffff;">T</span><span style="color:${TP_RED};">P</span>
            </span>
            <span style="color:#ffffff;font-size:20px;font-weight:700;margin-left:8px;vertical-align:middle;">To Paquete</span>
          </td>
        </tr>
        <!-- Cuerpo -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:${TP_BLUE};">🎉 ¡Hola, ${nombre}!</p>
            <p style="margin:16px 0;font-size:16px;color:#374151;line-height:1.6;">
              Gracias por registrarte en ToPaquete. Ya formas parte de la red de envíos
              a Cuba más rápida y confiable.
            </p>
            <p style="margin:16px 0;font-size:15px;color:#6b7280;line-height:1.6;">
              A partir de ahora te mantendremos al tanto de nuestras ofertas, próximas
              salidas y novedades del servicio.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
              <tr>
                <td style="background:${TP_BLUE};border-radius:12px;">
                  <a href="https://topaquete.com/dashboard"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                    Ir a mi cuenta →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.5;">
              Si no eres tú, ignora este correo. Para cualquier consulta, escríbenos a
              <a href="mailto:soporte@topaquete.com" style="color:${TP_BLUE};">soporte@topaquete.com</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} ToPaquete · España → Cuba ·
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
    const payload: Payload = await req.json();
    const { email, nombre } = payload;

    if (!email || !nombre) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY no configurada.' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ToPaquete <notificaciones@topaquete.com>',
        to: [email],
        subject: '🎉 ¡Bienvenido a ToPaquete!',
        html: htmlBienvenida(nombre),
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.text();
      console.error('Error de Resend:', resendError);
      return new Response(JSON.stringify({ error: `Error de Resend: ${resendError}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const resendData = await resendRes.json();
    return new Response(JSON.stringify({ ok: true, id: resendData.id }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error en notificar-bienvenida:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
