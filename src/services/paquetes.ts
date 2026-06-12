// Servicio de paquetes: creación de paquete con su pago inicial y evento de
// historial. Mantiene exactamente los nombres de campos y colecciones que ya
// existen en Firestore ('paquetes', 'pagos', 'eventos'); los campos nuevos
// son aditivos.

import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CONFIG_NEGOCIO_DEFAULT, type ConfigNegocio } from '../lib/calculos';
import type { EntregaPaquete, MedidasPaquete } from '../types/models';
import type { EstadoPago } from '../constants/estados';

export function generarTracking(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TP-ES-${date}-${random}`;
}

/** Lee settings/negocio y lo combina con los valores por defecto. */
export async function cargarConfigNegocio(): Promise<ConfigNegocio> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'negocio'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...CONFIG_NEGOCIO_DEFAULT,
        ...data,
        recargosTipoEnvio: {
          ...CONFIG_NEGOCIO_DEFAULT.recargosTipoEnvio,
          ...(data.recargosTipoEnvio || {}),
        },
      };
    }
  } catch (error) {
    console.error('No se pudo cargar settings/negocio, usando valores por defecto:', error);
  }
  return CONFIG_NEGOCIO_DEFAULT;
}

export interface NuevoPaqueteInput {
  tracking: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  destinatarioId: string;
  destinatarioNombre: string;
  destinatarioDireccion: string;
  destinatarioTelefono: string;
  destinatarioDocumento: string;
  peso: number;
  origen: string;
  destino: string;
  contenido: string;
  medidas: MedidasPaquete;
  estado: string;
  detallesIncidencia: string | null;
  fechaRegistro: Date;
  partnerId: string | null;
  precioAplicado: number | null;
  // Campos Fase 1
  tipoEnvio: string;
  descripcion: string;
  volumenCm3: number | null;
  pesoVolumetrico: number | null;
  pesoTasable: number | null;
  valorDeclarado: number | null;
  precioSugerido: number | null;
  precioFinal: number | null;
  estadoPago: EstadoPago;
  importePagado: number;
  metodoPago: string;
  entrega: EntregaPaquete;
}

export async function crearPaquete(input: NuevoPaqueteInput): Promise<string> {
  const operadorId = auth.currentUser?.uid || 'unknown';
  const precioFinal = input.precioFinal ?? input.precioSugerido ?? null;
  const importePagado = input.estadoPago === 'Pagado'
    ? (precioFinal ?? input.importePagado)
    : input.estadoPago === 'Pendiente' ? 0 : input.importePagado;
  const importePendiente = precioFinal !== null
    ? Math.max(Math.round((precioFinal - importePagado) * 100) / 100, 0)
    : 0;

  const paqueteData = {
    tracking: input.tracking,
    clienteId: input.clienteId,
    clienteNombre: input.clienteNombre,
    clienteTelefono: input.clienteTelefono,
    destinatarioId: input.destinatarioId,
    destinatarioNombre: input.destinatarioNombre,
    destinatarioDireccion: input.destinatarioDireccion,
    destinatarioTelefono: input.destinatarioTelefono,
    destinatarioDocumento: input.destinatarioDocumento,
    peso: input.peso,
    origen: input.origen,
    destino: input.destino,
    contenido: input.contenido,
    medidas: input.medidas,
    estado: input.estado,
    detallesIncidencia: input.estado === 'Incidencia' ? input.detallesIncidencia : null,
    createdAt: input.fechaRegistro,
    updatedAt: input.fechaRegistro,
    operadorId,
    referidoPor: operadorId,
    partnerId: input.partnerId,
    precioAplicado: input.precioAplicado,
    esB2B: !!input.partnerId,
    // Campos Fase 1 (aditivos)
    tipoEnvio: input.tipoEnvio,
    descripcion: input.descripcion,
    volumenCm3: input.volumenCm3,
    pesoVolumetrico: input.pesoVolumetrico,
    pesoTasable: input.pesoTasable,
    valorDeclarado: input.valorDeclarado,
    precioSugerido: input.precioSugerido,
    precioFinal,
    estadoPago: input.estadoPago,
    importePagado,
    importePendiente,
    entrega: input.entrega,
  };

  const docRef = await addDoc(collection(db, 'paquetes'), paqueteData);

  // Pago inicial (se mantiene el esquema existente de la colección 'pagos')
  if (importePagado > 0) {
    await addDoc(collection(db, 'pagos'), {
      paqueteId: input.tracking,
      monto: importePagado,
      metodo: input.metodoPago,
      estado: input.estadoPago === 'Parcial' ? 'Pagado' : input.estadoPago,
      fecha: input.fechaRegistro,
      agenteId: operadorId,
    });
  }

  // Evento inicial de historial (esquema existente de 'eventos')
  await addDoc(collection(db, 'eventos'), {
    paqueteId: input.tracking,
    estado: input.estado,
    notas: input.estado === 'Incidencia'
      ? `Paquete recibido con incidencia: ${input.detallesIncidencia || ''}`
      : 'Paquete recibido en oficina',
    timestamp: input.fechaRegistro,
    operadorId,
  });

  return docRef.id;
}
