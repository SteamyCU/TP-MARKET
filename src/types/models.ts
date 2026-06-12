// Modelos de datos compartidos de ToPaquete.
// Reflejan los documentos reales de Firestore. Los campos nuevos son siempre
// opcionales para mantener compatibilidad con documentos existentes.

import type { EstadoPago } from '../constants/estados';

export interface Cliente {
  id: string;
  nombre: string;
  documentoIdentidad: string;
  telefonoEspana: string;
  telefonoSecundario?: string;
  email: string;
  codigoPostal?: string;
  localidad?: string;
  direccion?: string;
  observaciones?: string;
  agenteId?: string;
  referido_por?: string;
}

export interface Destinatario {
  id: string;
  clienteId: string;
  nombre: string;
  carnetPasaporte?: string;
  telefonoCuba: string;
  telefonoSecundario?: string;
  email?: string;
  direccion?: string;
  provincia: string;
  municipio?: string;
  codigoPostal?: string;
  puntoRecogida?: string;
}

export interface MedidasPaquete {
  alto: number | null;
  ancho: number | null;
  largo: number | null;
}

export interface EntregaPaquete {
  modo: 'destinatario' | 'manual';
  direccion: string;
  provincia: string;
  municipio: string;
  confirmada: boolean;
}

export interface Paquete {
  id: string;
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
  medidas?: MedidasPaquete;
  estado: string;
  detallesIncidencia?: string | null;
  operadorId: string;
  referidoPor?: string | null;
  partnerId?: string | null;
  precioAplicado?: number | null;
  esB2B?: boolean;
  // Campos añadidos en Fase 1 (opcionales: los paquetes antiguos no los tienen)
  tipoEnvio?: string;
  descripcion?: string;
  volumenCm3?: number | null;
  pesoVolumetrico?: number | null;
  pesoTasable?: number | null;
  valorDeclarado?: number | null;
  precioSugerido?: number | null;
  precioFinal?: number | null;
  estadoPago?: EstadoPago;
  importePagado?: number;
  importePendiente?: number;
  entrega?: EntregaPaquete;
  // Fase 3: asignación a lote de salida
  loteId?: string | null;
  loteCodigo?: string | null;
}

export interface Lote {
  id: string;
  codigo: string;
  estado: string;
  ruta?: string;
  contenedor?: string;
  oficinaOrigen?: string;
  oficinaDestino?: string;
  responsable?: string;
  fechaEstimadaSalida?: string;
  fechaRealSalida?: unknown;
  fechaEstimadaLlegada?: string;
  fechaRealLlegada?: unknown;
  paqueteIds?: string[];
  totalPaquetes?: number;
  pesoTotal?: number;
  pesoTasableTotal?: number;
  volumenTotalCm3?: number;
  valorDeclaradoTotal?: number;
  ingresosEstimados?: number;
  costesEstimados?: number | null;
  beneficioEstimado?: number;
  notas?: string;
  creadoPor?: string;
}

export interface Pago {
  id: string;
  paqueteId: string;
  monto: number;
  metodo: string;
  estado: string;
  agenteId: string;
}

export interface EventoPaquete {
  id: string;
  paqueteId: string;
  estado: string;
  notas?: string;
  operadorId: string;
  ubicacion?: string;
}
