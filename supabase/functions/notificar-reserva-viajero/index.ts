// Edge Function: notificar-reserva-viajero
// Envía un email vía Resend en cada cambio de estado de una reserva del
// Programa de Viajeros (nueva solicitud, aceptada, rechazada).
// Variables de entorno requeridas: RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TP_BLUE = '#00314F';
const TP_RED = '#EE293B';

interface DatosOferta {
  provincia_destino: string;
  fecha_salida: string;
}

interface DatosContacto {
  nombre: string;
  telefono: string | null;
  email: string | null;
}

interface Payload {
  tipo: 'nueva_solicitud' | 'aceptada' | 'rechazada';
  email: string;
  nombre: string;
  datosOferta: DatosOferta;
  datosContacto?: DatosContacto;
  motivoRechazo?: string;
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function wrap(titulo: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo} · ToPaquete</title>
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
            ${bodyHtml}
          </td>
        </tr>
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

function htmlNuevaSolicitud(nombre: string, oferta: DatosOferta): string {
  return wrap('Nueva solicitud de reserva', `
    <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:${TP_BLUE};">¡Hola, ${nombre}!</p>
    <p style="margin:16px 0;font-size:16px;color:#374151;line-height:1.6;">
      Tienes una nueva solicitud de reserva de kilos para tu viaje a
      <strong>${oferta.provincia_destino}</strong> el <strong>${formatFecha(oferta.fecha_salida)}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td style="background:${TP_BLUE};border-radius:12px;">
          <a href="https://topaquete.com/dashboard/kilos-disponibles"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Ver solicitud →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.5;">
      Revisa los detalles y decide si aceptarla o rechazarla desde tu panel de "Mis viajes".
    </p>
  `);
}

function htmlAceptada(nombre: string, oferta: DatosOferta, contacto?: DatosContacto): string {
  const contactoHtml = contacto
    ? `<div style="margin:20px 0;padding:20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:900;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;">Datos de contacto del viajero</p>
        <p style="margin:4px 0;font-size:16px;color:#374151;"><strong>${contacto.nombre}</strong></p>
        ${contacto.telefono ? `<p style="margin:4px 0;font-size:15px;color:#374151;">📞 ${contacto.telefono}</p>` : ''}
        ${contacto.email ? `<p style="margin:4px 0;font-size:15px;color:#374151;">✉️ ${contacto.email}</p>` : ''}
      </div>`
    : '';
  return wrap('Reserva aceptada', `
    <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:${TP_BLUE};">¡Hola, ${nombre}!</p>
    <p style="margin:16px 0;font-size:16px;color:#374151;line-height:1.6;">
      ¡Tu reserva fue <strong style="color:#16a34a;">aceptada</strong>! El viajero a
      <strong>${oferta.provincia_destino}</strong> del <strong>${formatFecha(oferta.fecha_salida)}</strong>
      confirmó tu solicitud de kilos.
    </p>
    ${contactoHtml}
    <p style="margin:16px 0;font-size:15px;color:#6b7280;line-height:1.6;">
      Ponte en contacto para coordinar la entrega del paquete antes del viaje.
    </p>
  `);
}

function htmlRechazada(nombre: string, oferta: DatosOferta, motivo?: string): string {
  const motivoHtml = motivo
    ? `<p style="margin:16px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid ${TP_RED};border-radius:4px;font-size:14px;color:#b91c1c;line-height:1.5;">
        <strong>Motivo:</strong> ${motivo}
      </p>`
    : '';
  return wrap('Solicitud no aceptada', `
    <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:${TP_BLUE};">Hola, ${nombre}</p>
    <p style="margin:16px 0;font-size:16px;color:#374151;line-height:1.6;">
      Tu solicitud de reserva para el viaje a <strong>${oferta.provincia_destino}</strong> del
      <strong>${formatFecha(oferta.fecha_salida)}</strong> no fue aceptada.
    </p>
    ${motivoHtml}
    <p style="margin:16px 0;font-size:15px;color:#6b7280;line-height:1.6;">
      Puedes buscar otro viaje disponible en el tablero de Kilos Disponibles.
    </p>
  `);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const payload: Payload = await req.json();
    const { tipo, email, nombre, datosOferta, datosContacto, motivoRechazo } = payload;

    if (!tipo || !email || !nombre || !datosOferta) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const asunto = tipo === 'nueva_solicitud'
      ? 'Nueva solicitud de reserva de kilos'
      : tipo === 'aceptada'
        ? '¡Tu reserva de kilos fue aceptada!'
        : 'Actualización sobre tu reserva de kilos';

    const html = tipo === 'nueva_solicitud'
      ? htmlNuevaSolicitud(nombre, datosOferta)
      : tipo === 'aceptada'
        ? htmlAceptada(nombre, datosOferta, datosContacto)
        : htmlRechazada(nombre, datosOferta, motivoRechazo);

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
        subject: asunto,
        html,
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
    console.error('Error en notificar-reserva-viajero:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
