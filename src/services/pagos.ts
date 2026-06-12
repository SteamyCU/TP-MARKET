// Servicio de cobros: registra pagos adicionales sobre paquetes con deuda y
// mantiene sincronizados importePagado/importePendiente/estadoPago del paquete.

import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { registrarAuditoria } from './auditoria';

export interface PaqueteConDeuda {
  id: string;
  tracking: string;
  clienteNombre?: string;
  precioFinal?: number | null;
  importePagado?: number;
  importePendiente?: number;
}

export interface NuevoCobroInput {
  paquete: PaqueteConDeuda;
  monto: number;
  metodo: string;
  nota?: string;
}

/**
 * Registra un cobro: crea el documento en 'pagos' (esquema existente) y
 * actualiza los importes del paquete en una sola escritura atómica.
 */
export async function registrarCobro({ paquete, monto, metodo, nota }: NuevoCobroInput): Promise<void> {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const pagadoActual = paquete.importePagado || 0;
  const pendienteActual = paquete.importePendiente ?? Math.max((paquete.precioFinal || 0) - pagadoActual, 0);

  const nuevoPagado = r2(pagadoActual + monto);
  const nuevoPendiente = r2(Math.max(pendienteActual - monto, 0));

  const batch = writeBatch(db);
  batch.set(doc(collection(db, 'pagos')), {
    paqueteId: paquete.tracking,
    monto: r2(monto),
    metodo,
    estado: 'Pagado',
    fecha: new Date(),
    agenteId: auth.currentUser?.uid || 'unknown',
    ...(nota ? { nota } : {}),
  });
  batch.update(doc(db, 'paquetes', paquete.id), {
    importePagado: nuevoPagado,
    importePendiente: nuevoPendiente,
    estadoPago: nuevoPendiente <= 0 ? 'Pagado' : 'Parcial',
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  await registrarAuditoria({
    accion: 'cobro',
    entidad: 'paquete',
    entidadId: paquete.tracking,
    descripcion: `Cobro de ${monto.toFixed(2)} € (${metodo}) sobre ${paquete.tracking}`,
    valorAnterior: `pagado ${pagadoActual.toFixed(2)} € · pendiente ${pendienteActual.toFixed(2)} €`,
    valorNuevo: `pagado ${nuevoPagado.toFixed(2)} € · pendiente ${nuevoPendiente.toFixed(2)} €`,
    motivo: nota || null,
  });
}
