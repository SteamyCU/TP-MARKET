// Utilidades de Excel basadas en SheetJS (xlsx): exportación de tablas,
// lectura de archivos .xlsx/.csv y descarga de plantillas de importación.

import * as XLSX from 'xlsx';

export function exportarExcel(nombreArchivo: string, filas: Record<string, unknown>[], nombreHoja = 'Datos'): void {
  if (filas.length === 0) return;
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
  XLSX.writeFile(libro, nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`);
}

/** Lee la primera hoja de un .xlsx/.xls/.csv y devuelve las filas como objetos (clave = cabecera). */
export async function leerArchivoTabla(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array' });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });
}

export interface ColumnaPlantilla {
  key: string;
  label: string;
  ejemplo?: string;
}

/** Descarga una plantilla .xlsx con las cabeceras esperadas y una fila de ejemplo. */
export function descargarPlantilla(nombreArchivo: string, columnas: ColumnaPlantilla[]): void {
  const filas = [columnas.map(c => c.label)];
  if (columnas.some(c => c.ejemplo)) {
    filas.push(columnas.map(c => c.ejemplo || ''));
  }
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Plantilla');
  XLSX.writeFile(libro, nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`);
}

/** Normaliza una cabecera para emparejarla con un campo (sin tildes, minúsculas). */
export function normalizarCabecera(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
