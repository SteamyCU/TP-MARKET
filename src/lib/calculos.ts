// Reglas de cálculo de ToPaquete: volumen, peso volumétrico, peso tasable
// y precio sugerido. Los parámetros son configurables en settings/negocio;
// si el documento no existe se usan estos valores por defecto.

export interface ConfigNegocio {
  /** Divisor volumétrico estándar: pesoVol (kg) = volumen (cm³) / factor */
  factorVolumetrico: number;
  /** Tarifa base por kilo tasable (€/kg) cuando no hay tarifa de agente/partner */
  tarifaBaseKg: number;
  /** Multiplicador de tarifa por tipo de envío (1 = sin recargo) */
  recargosTipoEnvio: Record<string, number>;
}

export const CONFIG_NEGOCIO_DEFAULT: ConfigNegocio = {
  factorVolumetrico: 6000,
  tarifaBaseKg: 5,
  recargosTipoEnvio: {
    'Electrodomésticos': 1.25,
    'Móvil / Electrónica': 1.25,
    'Medicinas': 0.9,
  },
};

export function calcularVolumenCm3(ancho?: number | null, largo?: number | null, alto?: number | null): number | null {
  if (!ancho || !largo || !alto || ancho <= 0 || largo <= 0 || alto <= 0) return null;
  return Math.round(ancho * largo * alto);
}

export function calcularPesoVolumetrico(volumenCm3: number | null, factorVolumetrico: number): number | null {
  if (!volumenCm3 || factorVolumetrico <= 0) return null;
  return Math.round((volumenCm3 / factorVolumetrico) * 100) / 100;
}

export function calcularPesoTasable(pesoReal: number | null, pesoVolumetrico: number | null): number | null {
  if (!pesoReal && !pesoVolumetrico) return null;
  return Math.max(pesoReal || 0, pesoVolumetrico || 0);
}

export interface PrecioSugerido {
  precio: number;
  tarifaAplicada: number;
  explicacion: string[];
}

/**
 * Precio sugerido = peso tasable × tarifa (€/kg) × recargo por tipo de envío.
 * Prioridad de tarifa: tarifa específica (partner/agente) > tarifa base global.
 */
export function calcularPrecioSugerido(params: {
  pesoTasable: number | null;
  tipoEnvio?: string;
  tarifaEspecifica?: number | null;
  origenTarifa?: string;
  config: ConfigNegocio;
}): PrecioSugerido | null {
  const { pesoTasable, tipoEnvio, tarifaEspecifica, origenTarifa, config } = params;
  if (!pesoTasable || pesoTasable <= 0) return null;

  const tarifa = tarifaEspecifica && tarifaEspecifica > 0 ? tarifaEspecifica : config.tarifaBaseKg;
  const recargo = (tipoEnvio && config.recargosTipoEnvio[tipoEnvio]) || 1;
  const precio = Math.round(pesoTasable * tarifa * recargo * 100) / 100;

  const explicacion = [
    `Peso tasable: ${pesoTasable.toFixed(2)} kg`,
    tarifaEspecifica && tarifaEspecifica > 0
      ? `Tarifa ${origenTarifa || 'asignada'}: ${tarifa.toFixed(2)} €/kg`
      : `Tarifa base: ${tarifa.toFixed(2)} €/kg`,
  ];
  if (recargo !== 1) {
    explicacion.push(`Ajuste por tipo "${tipoEnvio}": ×${recargo}`);
  }
  explicacion.push(`Total sugerido: ${precio.toFixed(2)} €`);

  return { precio, tarifaAplicada: tarifa, explicacion };
}
