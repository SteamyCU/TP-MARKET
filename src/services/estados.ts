// Servicio de cambio de estado de paquetes (individual y masivo).
// Cada cambio actualiza el documento en 'paquetes' y registra un evento
// enriquecido en 'eventos' manteniendo el esquema existente (paqueteId =
// tracking) y añadiendo campos aditivos: estadoAnterior, motivo y tipoCambio.

import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../supabase';
import { ESTADOS_FINALES } from '../constants/estados';
import { registrarAuditoria } from './auditoria';

export type TipoCambioEstado = 'individual' | 'masivo' | 'lote';

/** Datos mínimos del paquete necesarios para cambiar su estado con seguridad */
export interface PaqueteParaCambio {
  id: string;
  tracking: string;
  estado: string;
  destinatarioDireccion?: string;
  importePendiente?: number;
  importePagado?: number;
  estadoPago?: string;
  peso?: number;
}

export interface OpcionesCambioEstado {
  motivo?: string;
  nota?: string;
  tipoCambio: TipoCambioEstado;
  detallesIncidencia?: string;
}

// Firestore limita los batches a 500 escrituras; cada paquete usa 2 (update + evento).
const PAQUETES_POR_BATCH = 200;

export async function cambiarEstado(
  paquetes: PaqueteParaCambio[],
  nuevoEstado: string,
  opciones: OpcionesCambioEstado
): Promise<number> {
  const operadorId = auth.currentUser?.uid || 'unknown';
  let actualizados = 0;

  for (let i = 0; i < paquetes.length; i += PAQUETES_POR_BATCH) {
    const chunk = paquetes.slice(i, i + PAQUETES_POR_BATCH);
    const batch = writeBatch(db);

    for (const paquete of chunk) {
      const updateData: Record<string, unknown> = {
        estado: nuevoEstado,
        updatedAt: serverTimestamp(),
      };
      if (nuevoEstado === 'Incidencia' && opciones.detallesIncidencia) {
        updateData.detallesIncidencia = opciones.detallesIncidencia;
      } else if (paquete.estado === 'Incidencia' && nuevoEstado !== 'Incidencia') {
        updateData.detallesIncidencia = '';
      }
      batch.update(doc(db, 'paquetes', paquete.id), updateData);

      const eventoRef = doc(collection(db, 'eventos'));
      batch.set(eventoRef, {
        paqueteId: paquete.tracking,
        estado: nuevoEstado,
        estadoAnterior: paquete.estado || null,
        notas: opciones.nota || `Estado actualizado a ${nuevoEstado}`,
        motivo: opciones.motivo || null,
        tipoCambio: opciones.tipoCambio,
        timestamp: serverTimestamp(),
        operadorId,
      });
    }

    await batch.commit();
    actualizados += chunk.length;
  }

  const estadosPrevios = [...new Set(paquetes.map(p => p.estado).filter(Boolean))];
  await registrarAuditoria({
    accion: 'cambio_estado',
    entidad: 'paquete',
    entidadId: paquetes.length === 1 ? paquetes[0].tracking : `${paquetes.length} paquetes`,
    descripcion: `Cambio de estado ${opciones.tipoCambio}: ${paquetes.slice(0, 20).map(p => p.tracking).join(', ')}${paquetes.length > 20 ? '…' : ''}`,
    valorAnterior: estadosPrevios.join(', '),
    valorNuevo: nuevoEstado,
    motivo: opciones.motivo || null,
  });

  return actualizados;
}

/**
 * Advertencias previas al cambio de estado: no bloquean, pero exigen que el
 * operador las vea antes de confirmar (datos críticos incompletos).
 */
export function advertenciasCambioEstado(paquetes: PaqueteParaCambio[], nuevoEstado: string): string[] {
  const advertencias: string[] = [];
  const conDeuda = paquetes.filter(p => (p.importePendiente || 0) > 0 || p.estadoPago === 'Pendiente' || p.estadoPago === 'Parcial');
  const sinDireccion = paquetes.filter(p => !p.destinatarioDireccion);
  const sinPeso = paquetes.filter(p => !p.peso || p.peso <= 0);
  const yaFinales = paquetes.filter(p => ESTADOS_FINALES.includes(p.estado));

  if (nuevoEstado === 'Entregado' && conDeuda.length > 0) {
    advertencias.push(`${conDeuda.length} paquete(s) tienen pago pendiente o parcial. Verifica el cobro antes de marcar como Entregado.`);
  }
  if ((nuevoEstado === 'En Reparto' || nuevoEstado === 'Entregado') && sinDireccion.length > 0) {
    advertencias.push(`${sinDireccion.length} paquete(s) no tienen dirección de entrega registrada.`);
  }
  if (['Asignado a lote', 'En contenedor', 'Listo para salida', 'Despacho', 'En Tránsito'].includes(nuevoEstado) && sinPeso.length > 0) {
    advertencias.push(`${sinPeso.length} paquete(s) no tienen peso registrado.`);
  }
  if ((nuevoEstado === 'Cancelado' || nuevoEstado === 'Devuelto') && paquetes.some(p => (p.importePagado || 0) > 0)) {
    advertencias.push('Hay paquetes con importes ya cobrados. Revisa si corresponde gestionar un reembolso.');
  }
  if (yaFinales.length > 0 && !ESTADOS_FINALES.includes(nuevoEstado)) {
    advertencias.push(`${yaFinales.length} paquete(s) están en un estado final (Entregado/Devuelto/Cancelado) y volverán a estar activos.`);
  }

  return advertencias;
}
