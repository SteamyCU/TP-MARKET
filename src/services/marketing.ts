// Servicio de marketing: etiquetas manuales e historial de contacto comercial
// guardados como campos aditivos en los documentos de 'clientes'.

import { auth } from '../supabase';
import { registrarAuditoria } from './auditoria';
import { updateCliente, addContactoCliente } from './clientes';

export async function actualizarEtiquetasCliente(clienteId: string, etiquetas: string[], clienteNombre?: string): Promise<void> {
  await updateCliente(clienteId, {
    etiquetasMarketing: etiquetas,
  });
  await registrarAuditoria({
    accion: 'cambio_etiquetas_cliente',
    entidad: 'cliente',
    entidadId: clienteNombre || clienteId,
    descripcion: `Etiquetas de marketing actualizadas`,
    valorNuevo: etiquetas.join(', ') || 'sin etiquetas',
  });
}

export interface NuevoContacto {
  tipo: string;
  nota: string;
}

export async function registrarContactoCliente(clienteId: string, contacto: NuevoContacto): Promise<void> {
  await addContactoCliente(clienteId, {
    tipo: contacto.tipo,
    nota: contacto.nota,
    fecha: new Date().toISOString(),
    usuario: auth.currentUser?.uid || 'unknown',
  });
}
