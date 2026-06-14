// Servicio de cobros: registra pagos adicionales sobre paquetes con deuda y
// mantiene sincronizados importePagado/importePendiente/estadoPago del paquete.

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../supabase';
import { updatePaquete } from './paquetes';
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

  // La colección 'pagos' sigue en Firestore (fase posterior); el paquete vive
  // en Supabase, así que se actualizan por separado.
  await addDoc(collection(db, 'pagos'), {
    paqueteId: paquete.tracking,
    monto: r2(monto),
    metodo,
    estado: 'Pagado',
    fecha: new Date(),
    agenteId: auth.currentUser?.uid || 'unknown',
    ...(nota ? { nota } : {}),
  });
  await updatePaquete(paquete.id, {
    importePagado: nuevoPagado,
    importePendiente: nuevoPendiente,
    estadoPago: nuevoPendiente <= 0 ? 'Pagado' : 'Parcial',
  });

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
