-- La "Nueva Solicitud de Envío" del portal cliente solo permitía elegir la
-- categoría del contenido (tipo_envio: Ropa, Medicinas...), no la modalidad
-- de envío en sí (Regular/Marítimo vs Express/Aéreo), que sí existe en el
-- resto del negocio (tarifas_envio.modalidad, calculadora pública, Ofertas y
-- Salidas). Se añade aquí para que el cliente pueda elegirla al solicitar.
alter table public.solicitudes
  add column if not exists modalidad text not null default 'regular'
  check (modalidad in ('regular', 'express'));
