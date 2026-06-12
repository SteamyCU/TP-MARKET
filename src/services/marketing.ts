// Servicio de marketing: etiquetas manuales e historial de contacto comercial
// guardados como campos aditivos en los documentos de 'clientes'.

import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { registrarAuditoria } from './auditoria';

export async function actualizarEtiquetasCliente(clienteId: string, etiquetas: string[], clienteNombre?: string): Promise<void> {
  await updateDoc(doc(db, 'clientes', clienteId), {
    etiquetasMarketing: etiquetas,
    updatedAt: serverTimestamp(),
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
  await updateDoc(doc(db, 'clientes', clienteId), {
    contactos: arrayUnion({
      tipo: contacto.tipo,
      nota: contacto.nota,
      fecha: new Date(),
      usuario: auth.currentUser?.uid || 'unknown',
    }),
    updatedAt: serverTimestamp(),
  });
}
