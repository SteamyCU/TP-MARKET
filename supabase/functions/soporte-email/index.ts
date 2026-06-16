import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SOPORTE_EMAIL = Deno.env.get('SOPORTE_EMAIL') ?? 'soporte@topaquete.com';
const FROM = 'ToPaquete <notificaciones@topaquete.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { nombre, email, categoria, mensaje } = await req.json();

    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'long', timeStyle: 'short' });

    // Email al equipo de soporte
    await sendEmail(
      SOPORTE_EMAIL,
      `[Soporte TP] ${categoria || 'Consulta'} — ${nombre}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#00314F">
          <div style="background:#00314F;padding:24px 32px;border-radius:16px 16px 0 0">
            <div style="font-size:32px;font-weight:900;font-style:italic;letter-spacing:-1px">
              <span style="color:white">T</span><span style="color:#EE293B">P</span>
              <span style="color:white;font-size:14px;font-weight:700;margin-left:8px">Soporte Técnico</span>
            </div>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 16px 16px">
            <h2 style="margin:0 0 20px;font-size:20px;font-weight:800">Nueva solicitud de soporte</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:10px 0;font-weight:700;width:130px;color:#6b7280;font-size:13px">Nombre</td>
                <td style="padding:10px 0;font-weight:600">${nombre}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:10px 0;font-weight:700;color:#6b7280;font-size:13px">Email</td>
                <td style="padding:10px 0"><a href="mailto:${email}" style="color:#00314F">${email}</a></td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:10px 0;font-weight:700;color:#6b7280;font-size:13px">Categoría</td>
                <td style="padding:10px 0">${categoria || 'No especificada'}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-weight:700;color:#6b7280;font-size:13px;vertical-align:top">Mensaje</td>
                <td style="padding:10px 0">${mensaje.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
            <p style="font-size:12px;color:#9ca3af;margin:0">Recibido: ${fecha}</p>
            <div style="margin-top:20px">
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(categoria || 'Tu consulta')} - ToPaquete Soporte"
                 style="display:inline-block;background:#00314F;color:white;padding:12px 24px;border-radius:10px;font-weight:700;text-decoration:none">
                Responder a ${nombre}
              </a>
            </div>
          </div>
        </div>
      `,
    );

    // Acuse de recibo al usuario
    await sendEmail(
      email,
      '✅ Hemos recibido tu solicitud de soporte — ToPaquete',
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#00314F">
          <div style="background:#00314F;padding:24px 32px;border-radius:16px 16px 0 0">
            <div style="font-size:32px;font-weight:900;font-style:italic;letter-spacing:-1px">
              <span style="color:white">T</span><span style="color:#EE293B">P</span>
            </div>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 16px 16px">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:800">¡Hola, ${nombre}!</h2>
            <p style="color:#374151;line-height:1.6;margin:0 0 20px">
              Hemos recibido tu mensaje y nuestro equipo lo revisará lo antes posible.
              Te responderemos a <strong>${email}</strong> en un plazo máximo de 24 h (días laborables).
            </p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Tu mensaje</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.6">${mensaje.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="color:#6b7280;font-size:13px;margin:0">
              ¿Necesitas ayuda urgente? Escríbenos directamente a
              <a href="mailto:${SOPORTE_EMAIL}" style="color:#00314F;font-weight:700">${SOPORTE_EMAIL}</a>
              o llámanos al <strong>+34 633 364 373</strong>.
            </p>
          </div>
          <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:20px">
            © 2026 ToPaquete Logística · topaquete.com
          </p>
        </div>
      `,
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('soporte-email error:', err);
    return new Response(JSON.stringify({ error: 'Error interno al enviar el correo' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
