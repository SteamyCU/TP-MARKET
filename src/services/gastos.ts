// Servicio de gastos operativos (colección nueva 'gastos'): costes por lote,
// ruta o categoría para calcular el beneficio real del negocio.

import { collection, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

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
  return docRef.id;
}

export async function eliminarGasto(gastoId: string): Promise<void> {
  await deleteDoc(doc(db, 'gastos', gastoId));
}
