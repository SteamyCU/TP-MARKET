// Caché en memoria de los datos de empresa (settings/negocio.empresa) para que
// los documentos imprimibles, que son componentes síncronos, lean siempre la
// configuración vigente. Se rellena al cargar la config en el Layout.

import { CONFIG_NEGOCIO_DEFAULT, type EmpresaConfig } from './calculos';

let empresaActual: EmpresaConfig = CONFIG_NEGOCIO_DEFAULT.empresa;
let condicionesActuales: string = CONFIG_NEGOCIO_DEFAULT.condicionesRecibo;

export function setEmpresa(empresa?: Partial<EmpresaConfig>, condicionesRecibo?: string): void {
  if (empresa) empresaActual = { ...CONFIG_NEGOCIO_DEFAULT.empresa, ...empresa };
  if (condicionesRecibo) condicionesActuales = condicionesRecibo;
}

export function getEmpresa(): EmpresaConfig {
  return empresaActual;
}

export function getCondicionesRecibo(): string {
  return condicionesActuales;
}
