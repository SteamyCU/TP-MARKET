// Registro de auditoría (colección nueva 'auditoria'): traza inmutable de las
// acciones importantes del negocio. registrarAuditoria nunca lanza errores
// para no interrumpir la operación principal que está auditando.

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export type AccionAuditoria =
  | 'crear_paquete'
  | 'cambio_estado'
  | 'cobro'
  | 'crear_gasto'
  | 'eliminar_gasto'
  | 'crear_lote'
  | 'agregar_a_lote'
  | 'quitar_de_lote'
  | 'cambio_estado_lote'
  | 'cambio_solicitud'
  | 'cambio_etiquetas_cliente'
  | 'cambio_datos_cliente'
  | 'importacion';

export interface EntradaAuditoria {
  accion: AccionAuditoria;
  /** Tipo de entidad afectada: paquete, lote, cliente, gasto, solicitud... */
  entidad: string;
  /** Identificador legible (tracking, código de lote, nombre...) */
  entidadId: string;
  descripcion: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  motivo?: string | null;
}

export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  try {
    await addDoc(collection(db, 'auditoria'), {
      accion: entrada.accion,
      entidad: entrada.entidad,
      entidadId: entrada.entidadId.slice(0, 200),
      descripcion: entrada.descripcion.slice(0, 500),
      valorAnterior: entrada.valorAnterior?.slice(0, 500) ?? null,
      valorNuevo: entrada.valorNuevo?.slice(0, 500) ?? null,
      motivo: entrada.motivo?.slice(0, 500) ?? null,
      usuario: auth.currentUser?.uid || 'unknown',
      usuarioEmail: auth.currentUser?.email || '',
      fecha: serverTimestamp(),
    });
  } catch (error) {
    // La auditoría nunca debe romper la operación que la origina
    console.error('No se pudo registrar la entrada de auditoría:', error);
  }
}
