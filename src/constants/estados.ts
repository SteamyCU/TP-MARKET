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
  { value: 'Recepción', label: 'Recepción', color: 'bg-tp-blue-light text-tp-blue', grupo: 'origen', legacy: true },
  { value: 'Validación', label: 'Validación', color: 'bg-blue-100 text-blue-700', grupo: 'origen', legacy: true },
  { value: 'Clasificado', label: 'Clasificado', color: 'bg-indigo-100 text-indigo-700', grupo: 'origen', legacy: true },
  { value: 'Consolidado', label: 'Consolidado', color: 'bg-purple-100 text-purple-700', grupo: 'origen', legacy: true },
  { value: 'Despacho', label: 'Despacho', color: 'bg-orange-100 text-orange-700', grupo: 'origen', legacy: true },
  { value: 'En Tránsito', label: 'En Tránsito', color: 'bg-amber-100 text-amber-700', grupo: 'transito', legacy: true },
  { value: 'Aduana Cuba', label: 'Aduana Cuba', color: 'bg-yellow-100 text-yellow-800', grupo: 'transito', legacy: true },
  { value: 'Almacén Cuba', label: 'Almacén Cuba', color: 'bg-cyan-100 text-cyan-700', grupo: 'destino', legacy: true },
  { value: 'En Reparto', label: 'En Reparto', color: 'bg-teal-100 text-teal-700', grupo: 'destino', legacy: true },
  { value: 'Entregado', label: 'Entregado', color: 'bg-green-100 text-green-700', grupo: 'final', legacy: true },
  { value: 'Incidencia', label: 'Incidencia', color: 'bg-red-100 text-tp-red', grupo: 'alerta', legacy: true },
];

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
