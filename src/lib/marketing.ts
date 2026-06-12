// Segmentación y métricas de marketing por cliente, calculadas en cliente a
// partir de los datos ya cargados (clientes, paquetes y pagos).

export const ETIQUETAS_MANUALES = ['VIP', 'Requiere seguimiento', 'No contactar'] as const;

export const ETIQUETA_COLOR: Record<string, string> = {
  'Nuevo': 'bg-tp-blue-light text-tp-blue',
  'Recurrente': 'bg-green-100 text-green-700',
  'VIP': 'bg-purple-100 text-purple-700',
  'Alto valor': 'bg-amber-100 text-amber-800',
  'Inactivo': 'bg-red-100 text-tp-red',
  'Sin envíos': 'bg-gray-100 text-gray-600',
  'Requiere seguimiento': 'bg-orange-100 text-orange-700',
  'No contactar': 'bg-gray-200 text-gray-700',
};

export const DIAS_CLIENTE_NUEVO = 30;
export const DIAS_INACTIVIDAD = 90;
export const UMBRAL_VIP_ENVIOS = 5;
export const UMBRAL_VIP_INGRESOS = 500;
export const UMBRAL_ALTO_VALOR_TICKET = 100;

interface ClienteBase {
  id: string;
  nombre?: string;
  email?: string;
  telefonoEspana?: string;
  documentoIdentidad?: string;
  localidad?: string;
  createdAt?: any;
  etiquetasMarketing?: string[];
  contactos?: { fecha?: any; tipo?: string; nota?: string; usuario?: string }[];
}

interface PaqueteBase {
  clienteId?: string;
  tracking?: string;
  destino?: string;
  createdAt?: any;
  precioFinal?: number | null;
}

const toDateSafe = (f: any): Date | null => (f?.toDate ? f.toDate() : f instanceof Date ? f : null);

export interface MetricasCliente {
  id: string;
  cliente: ClienteBase;
  totalEnvios: number;
  ingresos: number;
  ticketPromedio: number;
  ultimoEnvio: Date | null;
  diasDesdeUltimoEnvio: number | null;
  destinoFrecuente: string;
  etiquetasAuto: string[];
  etiquetasManuales: string[];
  etiquetas: string[];
}

export function calcularMetricasClientes(
  clientes: ClienteBase[],
  paquetes: PaqueteBase[],
  pagosPorTracking: Record<string, number>
): MetricasCliente[] {
  const ahora = Date.now();
  const porCliente: Record<string, PaqueteBase[]> = {};
  for (const p of paquetes) {
    if (!p.clienteId) continue;
    (porCliente[p.clienteId] ||= []).push(p);
  }

  return clientes.map(cliente => {
    const envios = porCliente[cliente.id] || [];
    const ingresos = envios.reduce((acc, p) => {
      const importe = p.precioFinal ?? (p.tracking ? pagosPorTracking[p.tracking] : 0) ?? 0;
      return acc + (importe || 0);
    }, 0);
    const fechas = envios.map(p => toDateSafe(p.createdAt)).filter((d): d is Date => d !== null);
    const ultimoEnvio = fechas.length > 0 ? new Date(Math.max(...fechas.map(d => d.getTime()))) : null;
    const diasDesdeUltimoEnvio = ultimoEnvio ? Math.floor((ahora - ultimoEnvio.getTime()) / 86400000) : null;

    const destinos: Record<string, number> = {};
    for (const p of envios) {
      if (p.destino) destinos[p.destino] = (destinos[p.destino] || 0) + 1;
    }
    const destinoFrecuente = Object.entries(destinos).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const fechaAlta = toDateSafe(cliente.createdAt);
    const diasComoCliente = fechaAlta ? Math.floor((ahora - fechaAlta.getTime()) / 86400000) : null;

    const etiquetasAuto: string[] = [];
    if (envios.length === 0) {
      etiquetasAuto.push('Sin envíos');
    } else if (diasDesdeUltimoEnvio !== null && diasDesdeUltimoEnvio > DIAS_INACTIVIDAD) {
      etiquetasAuto.push('Inactivo');
    }
    if (diasComoCliente !== null && diasComoCliente <= DIAS_CLIENTE_NUEVO && envios.length <= 1) {
      etiquetasAuto.push('Nuevo');
    }
    if (envios.length >= 3 && diasDesdeUltimoEnvio !== null && diasDesdeUltimoEnvio <= DIAS_INACTIVIDAD) {
      etiquetasAuto.push('Recurrente');
    }
    if (envios.length >= UMBRAL_VIP_ENVIOS && ingresos >= UMBRAL_VIP_INGRESOS) {
      etiquetasAuto.push('VIP');
    }
    const ticketPromedio = envios.length > 0 ? ingresos / envios.length : 0;
    if (envios.length > 0 && ticketPromedio >= UMBRAL_ALTO_VALOR_TICKET) {
      etiquetasAuto.push('Alto valor');
    }

    const etiquetasManuales = cliente.etiquetasMarketing || [];
    const etiquetas = [...new Set([...etiquetasAuto, ...etiquetasManuales])];

    return {
      id: cliente.id,
      cliente,
      totalEnvios: envios.length,
      ingresos: Math.round(ingresos * 100) / 100,
      ticketPromedio: Math.round(ticketPromedio * 100) / 100,
      ultimoEnvio,
      diasDesdeUltimoEnvio,
      destinoFrecuente,
      etiquetasAuto,
      etiquetasManuales,
      etiquetas,
    };
  });
}

/** Destinos más frecuentes del total de paquetes (para el panel de marketing). */
export function destinosFrecuentes(paquetes: PaqueteBase[], top = 5): { destino: string; envios: number }[] {
  const conteo: Record<string, number> = {};
  for (const p of paquetes) {
    if (p.destino) conteo[p.destino] = (conteo[p.destino] || 0) + 1;
  }
  return Object.entries(conteo)
    .map(([destino, envios]) => ({ destino, envios }))
    .sort((a, b) => b.envios - a.envios)
    .slice(0, top);
}
