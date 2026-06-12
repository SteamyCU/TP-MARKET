// Catálogo central de estados de ToPaquete.
// IMPORTANTE: los valores de estado ya guardados en Firestore se mantienen tal cual
// (compatibilidad con datos en producción). No renombrar valores existentes.

export interface EstadoInfo {
  value: string;
  label: string;
  color: string;
  grupo: 'origen' | 'transito' | 'destino' | 'final' | 'alerta';
  /** Estados que ya existían antes del catálogo central */
  legacy?: boolean;
}

export const ESTADOS_PAQUETE: EstadoInfo[] = [
  // ── En origen (España) ──
  { value: 'Borrador', label: 'Borrador', color: 'bg-gray-100 text-gray-600', grupo: 'origen' },
  { value: 'Registrado', label: 'Registrado', color: 'bg-tp-blue-light text-tp-blue', grupo: 'origen' },
  { value: 'Pendiente de datos', label: 'Pendiente de datos', color: 'bg-amber-100 text-amber-700', grupo: 'origen' },
  { value: 'Pendiente de pago', label: 'Pendiente de pago', color: 'bg-amber-100 text-amber-800', grupo: 'origen' },
  { value: 'Recepción', label: 'Recepción', color: 'bg-tp-blue-light text-tp-blue', grupo: 'origen', legacy: true },
  { value: 'Validación', label: 'Validación', color: 'bg-blue-100 text-blue-700', grupo: 'origen', legacy: true },
  { value: 'Clasificado', label: 'Clasificado', color: 'bg-indigo-100 text-indigo-700', grupo: 'origen', legacy: true },
  { value: 'En preparación', label: 'En preparación', color: 'bg-indigo-100 text-indigo-700', grupo: 'origen' },
  { value: 'Consolidado', label: 'Consolidado', color: 'bg-purple-100 text-purple-700', grupo: 'origen', legacy: true },
  { value: 'Asignado a lote', label: 'Asignado a lote', color: 'bg-purple-100 text-purple-700', grupo: 'origen' },
  { value: 'En contenedor', label: 'En contenedor', color: 'bg-violet-100 text-violet-700', grupo: 'origen' },
  { value: 'Listo para salida', label: 'Listo para salida', color: 'bg-orange-100 text-orange-700', grupo: 'origen' },
  { value: 'Despacho', label: 'Despacho', color: 'bg-orange-100 text-orange-700', grupo: 'origen', legacy: true },
  // ── En tránsito ──
  { value: 'En Tránsito', label: 'En Tránsito', color: 'bg-amber-100 text-amber-700', grupo: 'transito', legacy: true },
  { value: 'Aduana Cuba', label: 'Aduana Cuba', color: 'bg-yellow-100 text-yellow-800', grupo: 'transito', legacy: true },
  // ── En destino (Cuba) ──
  { value: 'Almacén Cuba', label: 'Almacén Cuba', color: 'bg-cyan-100 text-cyan-700', grupo: 'destino', legacy: true },
  { value: 'En Reparto', label: 'En Reparto', color: 'bg-teal-100 text-teal-700', grupo: 'destino', legacy: true },
  { value: 'Disponible para recogida', label: 'Disponible para recogida', color: 'bg-emerald-100 text-emerald-700', grupo: 'destino' },
  // ── Finales ──
  { value: 'Entregado', label: 'Entregado', color: 'bg-green-100 text-green-700', grupo: 'final', legacy: true },
  { value: 'Devuelto', label: 'Devuelto', color: 'bg-rose-100 text-rose-700', grupo: 'final' },
  { value: 'Cancelado', label: 'Cancelado', color: 'bg-gray-200 text-gray-700', grupo: 'final' },
  // ── Alertas ──
  { value: 'Incidencia', label: 'Incidencia', color: 'bg-red-100 text-tp-red', grupo: 'alerta', legacy: true },
];

export const GRUPOS_ESTADO: Record<EstadoInfo['grupo'], string> = {
  origen: 'En Origen (España)',
  transito: 'En Tránsito',
  destino: 'En Destino (Cuba)',
  final: 'Estados Finales',
  alerta: 'Alertas',
};

/** Estados que cierran el ciclo de vida del paquete */
export const ESTADOS_FINALES = ['Entregado', 'Devuelto', 'Cancelado'];

/** Estados del ciclo de vida de un lote de salida */
export const ESTADOS_LOTE = ['Abierto', 'Cerrado', 'En Tránsito', 'Recibido', 'Cancelado'] as const;
export type EstadoLote = (typeof ESTADOS_LOTE)[number];

/** Estados de una solicitud de envío del portal cliente */
export const ESTADOS_SOLICITUD = [
  'Nueva',
  'Pendiente de revisión',
  'Faltan datos',
  'Aprobada',
  'Convertida en paquete',
  'Rechazada',
  'Cancelada',
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

/** Estados de solicitud que el propio cliente aún puede cancelar/editar */
export const ESTADOS_SOLICITUD_ABIERTOS: string[] = ['Nueva', 'Pendiente de revisión', 'Faltan datos'];

/** Estados iniciales válidos al registrar un paquete en recepción */
export const ESTADOS_INICIALES = ['Recepción', 'Validación', 'Incidencia'];

/** Mapa lowercase → clases de color, incluye alias legacy y estados de pago */
export const ESTADO_COLOR: Record<string, string> = {
  ...Object.fromEntries(ESTADOS_PAQUETE.map(e => [e.value.toLowerCase(), e.color])),
  // Alias y valores legacy que pueden existir en datos antiguos
  'pendiente': 'bg-tp-blue-light text-tp-blue',
  'validado': 'bg-blue-100 text-blue-700',
  'peso?': 'bg-red-100 text-tp-red',
  // Estados de pago
  'pagado': 'bg-green-100 text-green-700',
  'parcial': 'bg-amber-100 text-amber-700',
  'confirmado': 'bg-green-100 text-green-700',
  // Estados de lote
  'abierto': 'bg-green-100 text-green-700',
  'cerrado': 'bg-gray-200 text-gray-700',
  'recibido': 'bg-cyan-100 text-cyan-700',
  // Estados de solicitud (portal cliente)
  'nueva': 'bg-tp-blue-light text-tp-blue',
  'pendiente de revisión': 'bg-amber-100 text-amber-700',
  'faltan datos': 'bg-amber-100 text-amber-800',
  'aprobada': 'bg-green-100 text-green-700',
  'convertida en paquete': 'bg-emerald-100 text-emerald-700',
  'rechazada': 'bg-red-100 text-tp-red',
  'cancelada': 'bg-gray-200 text-gray-700',
};

export const ESTADOS_PAGO = ['Pagado', 'Parcial', 'Pendiente'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'] as const;

export const TIPOS_ENVIO = [
  'Miscelánea',
  'Ropa y Calzado',
  'Medicinas',
  'Alimentos',
  'Electrodomésticos',
  'Móvil / Electrónica',
  'Documentos',
  'Otro',
] as const;

export const PROVINCIAS_CUBA = [
  'Pinar del Río', 'Artemisa', 'La Habana', 'Mayabeque', 'Matanzas',
  'Villa Clara', 'Cienfuegos', 'Sancti Spíritus', 'Ciego de Ávila',
  'Camagüey', 'Las Tunas', 'Holguín', 'Granma', 'Santiago de Cuba',
  'Guantánamo', 'Isla de la Juventud',
];
