// Exportación CSV sin dependencias externas (compatible con Excel mediante
// BOM UTF-8 y separador ';'). La importación/exportación XLSX completa
// llegará en la fase de Excel con una librería dedicada.

function escaparCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[";\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function exportarCSV(nombreArchivo: string, filas: Record<string, unknown>[]): void {
  if (filas.length === 0) return;
  const columnas = Object.keys(filas[0]);
  const lineas = [
    columnas.join(';'),
    ...filas.map(fila => columnas.map(c => escaparCelda(fila[c])).join(';')),
  ];
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
