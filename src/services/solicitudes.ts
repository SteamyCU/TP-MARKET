// Servicio de solicitudes de envío del portal cliente (colección 'solicitudes').
// El cliente crea solicitudes; el equipo interno las revisa y las convierte en
// paquetes reutilizando el flujo de Recepción.

import {
  collection, doc, addDoc, updateDoc, getDocs, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../supabase';
import { registrarAuditoria } from './auditoria';

/**
 * Busca el documento de 'clientes' vinculado al usuario por email y lo crea si
 * no existe (mismo patrón que usa MisDestinatarios).
 */
export async function obtenerOCrearClienteDoc(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user?.email) return null;
  const q = query(collection(db, 'clientes'), where('email', '==', user.email));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;
  const nuevo = await addDoc(collection(db, 'clientes'), {
    nombre: user.displayName || user.email,
    documentoIdentidad: '',
    telefonoEspana: '',
    email: user.email,
    direccion: '',
    localidad: '',
    codigoPostal: '',
    agenteId: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return nuevo.id;
}

export interface NuevaSolicitudInput {
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  destinatarioId: string;
  destinatarioNombre: string;
  destinatarioProvincia: string;
  contenido: string;
  tipoEnvio: string;
  pesoEstimado: number | null;
  observaciones: string;
}

export async function crearSolicitud(input: NuevaSolicitudInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'solicitudes'), {
    ...input,
    clienteUid: auth.currentUser?.uid || 'unknown',
    estado: 'Nueva',
    notaInterna: '',
    notaParaCliente: '',
    tracking: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function actualizarEstadoSolicitud(
  solicitudId: string,
  estado: string,
  extra?: { notaInterna?: string; notaParaCliente?: string }
): Promise<void> {
  await updateDoc(doc(db, 'solicitudes', solicitudId), {
    estado,
    ...(extra?.notaInterna !== undefined ? { notaInterna: extra.notaInterna } : {}),
    ...(extra?.notaParaCliente !== undefined ? { notaParaCliente: extra.notaParaCliente } : {}),
    updatedAt: serverTimestamp(),
  });
  await registrarAuditoria({
    accion: 'cambio_solicitud',
    entidad: 'solicitud',
    entidadId: solicitudId,
    descripcion: `Solicitud actualizada a "${estado}"`,
    valorNuevo: estado,
    motivo: extra?.notaParaCliente || null,
  });
}

/** Marca la solicitud como convertida y enlaza el tracking del paquete creado. */
export async function marcarSolicitudConvertida(solicitudId: string, tracking: string): Promise<void> {
  await updateDoc(doc(db, 'solicitudes', solicitudId), {
    estado: 'Convertida en paquete',
    tracking,
    updatedAt: serverTimestamp(),
  });
}
