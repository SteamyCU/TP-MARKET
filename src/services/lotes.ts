// Servicio de lotes de salida. Colección nueva 'lotes'; los paquetes se
// vinculan mediante los campos aditivos loteId/loteCodigo y cada movimiento
// queda registrado en 'eventos' con tipoCambio 'lote'.

import {
  collection, doc, addDoc, updateDoc, writeBatch,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { cambiarEstado, type PaqueteParaCambio } from './estados';
import { registrarAuditoria } from './auditoria';
import type { EstadoLote } from '../constants/estados';

export function generarCodigoLote(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `LOTE-${date}-${random}`;
}

export interface PaqueteEnLote extends PaqueteParaCambio {
  pesoTasable?: number | null;
  volumenCm3?: number | null;
  valorDeclarado?: number | null;
  precioFinal?: number | null;
}

export interface TotalesLote {
  totalPaquetes: number;
  pesoTotal: number;
  pesoTasableTotal: number;
  volumenTotalCm3: number;
  valorDeclaradoTotal: number;
  ingresosEstimados: number;
}

export function calcularTotalesLote(paquetes: PaqueteEnLote[]): TotalesLote {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    totalPaquetes: paquetes.length,
    pesoTotal: r2(paquetes.reduce((s, p) => s + (p.peso || 0), 0)),
    pesoTasableTotal: r2(paquetes.reduce((s, p) => s + (p.pesoTasable || p.peso || 0), 0)),
    volumenTotalCm3: Math.round(paquetes.reduce((s, p) => s + (p.volumenCm3 || 0), 0)),
    valorDeclaradoTotal: r2(paquetes.reduce((s, p) => s + (p.valorDeclarado || 0), 0)),
    ingresosEstimados: r2(paquetes.reduce((s, p) => s + (p.precioFinal || 0), 0)),
  };
}

export interface NuevoLoteInput {
  codigo: string;
  ruta: string;
  contenedor: string;
  oficinaOrigen: string;
  oficinaDestino: string;
  responsable: string;
  fechaEstimadaSalida: string;
  fechaEstimadaLlegada: string;
  costesEstimados: number | null;
  notas: string;
}

export async function crearLote(input: NuevoLoteInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'lotes'), {
    ...input,
    estado: 'Abierto',
    paqueteIds: [],
    totalPaquetes: 0,
    pesoTotal: 0,
    pesoTasableTotal: 0,
    volumenTotalCm3: 0,
    valorDeclaradoTotal: 0,
    ingresosEstimados: 0,
    creadoPor: auth.currentUser?.uid || 'unknown',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await registrarAuditoria({
    accion: 'crear_lote',
    entidad: 'lote',
    entidadId: input.codigo,
    descripcion: `Lote ${input.codigo} creado (${input.ruta || 'sin ruta'})`,
  });
  return docRef.id;
}

/** Agrega paquetes a un lote: marca cada paquete y registra evento por cada uno. */
export async function agregarPaquetesALote(
  loteId: string,
  loteCodigo: string,
  paquetes: PaqueteEnLote[]
): Promise<number> {
  if (paquetes.length === 0) return 0;
  const operadorId = auth.currentUser?.uid || 'unknown';
  const batch = writeBatch(db);

  for (const paquete of paquetes) {
    batch.update(doc(db, 'paquetes', paquete.id), {
      loteId,
      loteCodigo,
      estado: 'Asignado a lote',
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'eventos')), {
      paqueteId: paquete.tracking,
      estado: 'Asignado a lote',
      estadoAnterior: paquete.estado || null,
      notas: `Paquete asignado al lote ${loteCodigo}`,
      motivo: null,
      tipoCambio: 'lote',
      timestamp: serverTimestamp(),
      operadorId,
    });
  }
  batch.update(doc(db, 'lotes', loteId), {
    paqueteIds: arrayUnion(...paquetes.map(p => p.id)),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  await registrarAuditoria({
    accion: 'agregar_a_lote',
    entidad: 'lote',
    entidadId: loteCodigo,
    descripcion: `${paquetes.length} paquete(s) agregados al lote ${loteCodigo}: ${paquetes.slice(0, 20).map(p => p.tracking).join(', ')}${paquetes.length > 20 ? '…' : ''}`,
  });
  return paquetes.length;
}

/** Quita un paquete del lote sin alterar su estado actual; queda registrado en el historial. */
export async function quitarPaqueteDeLote(loteId: string, loteCodigo: string, paquete: PaqueteEnLote): Promise<void> {
  const operadorId = auth.currentUser?.uid || 'unknown';
  const batch = writeBatch(db);

  batch.update(doc(db, 'paquetes', paquete.id), {
    loteId: null,
    loteCodigo: null,
    estado: paquete.estado === 'Asignado a lote' ? 'Recepción' : paquete.estado,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'eventos')), {
    paqueteId: paquete.tracking,
    estado: paquete.estado === 'Asignado a lote' ? 'Recepción' : paquete.estado,
    estadoAnterior: paquete.estado || null,
    notas: `Paquete retirado del lote ${loteCodigo}`,
    motivo: null,
    tipoCambio: 'lote',
    timestamp: serverTimestamp(),
    operadorId,
  });
  batch.update(doc(db, 'lotes', loteId), {
    paqueteIds: arrayRemove(paquete.id),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  await registrarAuditoria({
    accion: 'quitar_de_lote',
    entidad: 'lote',
    entidadId: loteCodigo,
    descripcion: `Paquete ${paquete.tracking} retirado del lote ${loteCodigo}`,
  });
}

/** Persiste los totales calculados en el documento del lote. */
export async function guardarTotalesLote(loteId: string, totales: TotalesLote, costesEstimados?: number | null): Promise<void> {
  const beneficioEstimado = Math.round((totales.ingresosEstimados - (costesEstimados || 0)) * 100) / 100;
  await updateDoc(doc(db, 'lotes', loteId), {
    ...totales,
    beneficioEstimado,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cambia el estado del lote y, opcionalmente, aplica un estado a todos sus
 * paquetes (reutilizando el servicio de estados, tipoCambio 'lote').
 */
export async function cambiarEstadoLote(
  loteId: string,
  loteCodigo: string,
  nuevoEstado: EstadoLote,
  paquetes: PaqueteEnLote[],
  opciones?: { estadoPaquetes?: string; motivo?: string }
): Promise<void> {
  const update: Record<string, unknown> = {
    estado: nuevoEstado,
    updatedAt: serverTimestamp(),
  };
  if (nuevoEstado === 'En Tránsito') update.fechaRealSalida = serverTimestamp();
  if (nuevoEstado === 'Recibido') update.fechaRealLlegada = serverTimestamp();
  await updateDoc(doc(db, 'lotes', loteId), update);

  await registrarAuditoria({
    accion: 'cambio_estado_lote',
    entidad: 'lote',
    entidadId: loteCodigo,
    descripcion: `Lote ${loteCodigo} → ${nuevoEstado}${opciones?.estadoPaquetes ? ` (paquetes → ${opciones.estadoPaquetes})` : ''}`,
    valorNuevo: nuevoEstado,
    motivo: opciones?.motivo || null,
  });

  if (opciones?.estadoPaquetes && paquetes.length > 0) {
    await cambiarEstado(paquetes, opciones.estadoPaquetes, {
      tipoCambio: 'lote',
      motivo: opciones.motivo || `Lote ${loteCodigo} → ${nuevoEstado}`,
      nota: `Aplicado por cambio de estado del lote ${loteCodigo}`,
    });
  }
}
