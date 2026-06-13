// Servicio de gastos operativos (colección nueva 'gastos'): costes por lote,
// ruta o categoría para calcular el beneficio real del negocio.

import { collection, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../supabase';
import { registrarAuditoria } from './auditoria';

export interface NuevoGastoInput {
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  loteId: string | null;
  loteCodigo: string | null;
  ruta: string;
  notas: string;
}

export async function registrarGasto(input: NuevoGastoInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'gastos'), {
    ...input,
    fecha: new Date(input.fecha),
    creadoPor: auth.currentUser?.uid || 'unknown',
    createdAt: serverTimestamp(),
  });
  await registrarAuditoria({
    accion: 'crear_gasto',
    entidad: 'gasto',
    entidadId: input.concepto,
    descripcion: `Gasto "${input.concepto}" (${input.categoria})${input.loteCodigo ? ` · lote ${input.loteCodigo}` : ''}`,
    valorNuevo: `${input.monto.toFixed(2)} €`,
  });
  return docRef.id;
}

export async function eliminarGasto(gastoId: string, descripcion?: string): Promise<void> {
  await deleteDoc(doc(db, 'gastos', gastoId));
  await registrarAuditoria({
    accion: 'eliminar_gasto',
    entidad: 'gasto',
    entidadId: gastoId,
    descripcion: `Gasto eliminado${descripcion ? `: ${descripcion}` : ''}`,
  });
}
