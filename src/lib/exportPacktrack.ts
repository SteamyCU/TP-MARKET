// Exportación de manifiestos Excel para el proveedor PackTrack: por cada
// expedición/lote se generan dos archivos con formatos fijos (España/aduanas
// y Cuba/entrega) usando SheetJS (xlsx).

import * as XLSX from 'xlsx';

export interface DatosExpedicion {
  mawb: string;
  contenedor: string;
  almacen: string;
  precinto: string;
  fecha: string;
}

export interface PaquetePacktrack {
  tracking: string;
  clienteId?: string | null;
  clienteNombre?: string | null;
  destinatarioId?: string | null;
  destinatarioNombre?: string | null;
  destinatarioTelefono?: string | null;
  destinatarioDireccion?: string | null;
  destino?: string | null;
  contenido?: string | null;
  descripcion?: string | null;
  peso?: number | null;
  pesoTasable?: number | null;
  valorDeclarado?: number | null;
  precioAplicado?: number | null;
}

export interface ClientePacktrack {
  id: string;
  documentoIdentidad?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codigoPostal?: string | null;
}

export interface DestinatarioPacktrack {
  id: string;
  municipio?: string | null;
  codigoPostal?: string | null;
}

function descargarHoja(filas: unknown[][], nombreArchivo: string): void {
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Manifiesto');
  XLSX.writeFile(libro, nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`);
}

/** Manifiesto de aduanas (España): un paquete por fila, con datos del remitente y destinatario. */
export function exportarExcelEspana(
  paquetes: PaquetePacktrack[],
  datosExpedicion: DatosExpedicion,
  clientes: ClientePacktrack[],
  destinatarios: DestinatarioPacktrack[],
  nombreArchivo: string,
): void {
  const clientesPorId = new Map(clientes.map(c => [c.id, c]));
  const destinatariosPorId = new Map(destinatarios.map(d => [d.id, d]));

  const filas: unknown[][] = [
    ['CLIENTE:', 'ToPaquete'],
    ['DESTINO:', 'CUBA'],
    ['MAWB:', datosExpedicion.mawb || ''],
    ['ALMACEN DE SALIDA:', datosExpedicion.almacen || ''],
    ['FECHA:', datosExpedicion.fecha || ''],
    ['CONTENEDOR:', datosExpedicion.contenedor || ''],
    ['PRECINTO:', datosExpedicion.precinto || ''],
    [
      'EXPEDIENTE', 'REMITENTE', 'NIF', 'DIRECCION', 'LOCALIDAD', 'PROVINCIA', 'CP',
      'DESTINATARIO', 'TELEFONO', 'DIRECCION', 'LOCALIDAD', 'PROVINCIA', 'CP',
      'DESCRIPCION DE LA MERCANCIA', 'BULTOS', 'KG', 'IMPORTE', 'MONEDA',
    ],
  ];

  for (const p of paquetes) {
    const cliente = p.clienteId ? clientesPorId.get(p.clienteId) : undefined;
    const destinatario = p.destinatarioId ? destinatariosPorId.get(p.destinatarioId) : undefined;
    filas.push([
      p.tracking,
      p.clienteNombre || '',
      cliente?.documentoIdentidad || '',
      cliente?.direccion || '',
      cliente?.localidad || '',
      cliente?.provincia || '',
      cliente?.codigoPostal || '',
      p.destinatarioNombre || '',
      p.destinatarioTelefono || '',
      p.destinatarioDireccion || '',
      destinatario?.municipio || '',
      p.destino || '',
      destinatario?.codigoPostal || '',
      p.contenido || '',
      1,
      p.pesoTasable ?? p.peso ?? 0,
      p.valorDeclarado ?? p.precioAplicado ?? '',
      'EUR',
    ]);
  }

  descargarHoja(filas, nombreArchivo);
}

/** Manifiesto de entrega (Cuba): un paquete por fila, con datos de destino. */
export function exportarExcelCuba(
  paquetes: PaquetePacktrack[],
  datosExpedicion: DatosExpedicion,
  nombreArchivo: string,
): void {
  const totalBultos = paquetes.length;
  const totalPeso = paquetes.reduce((s, p) => s + (p.pesoTasable ?? p.peso ?? 0), 0);

  const filas: unknown[][] = [
    ['Agencia origen:', 'ToPaquete'],
    ['País:', 'Cuba'],
    ['MBL / MAWB:', datosExpedicion.mawb || ''],
    ['Contenedor No.:', datosExpedicion.contenedor || ''],
    ['Cantidad de Bultos:', totalBultos],
    ['Total Peso (kg):', Math.round(totalPeso * 100) / 100],
    ['NO PAQUETE', 'ENVIA', 'RECIBE', 'MOVIL', 'DIRECCION', 'OBSERVACIONES', 'TIPO DE PAQUETE', 'AGENCIA', 'PESO'],
  ];

  for (const p of paquetes) {
    const primerNombre = (p.destinatarioNombre || '').trim().split(/\s+/)[0] || '';
    filas.push([
      p.tracking,
      p.clienteNombre || '',
      primerNombre,
      p.destinatarioTelefono || '',
      p.destinatarioDireccion || '',
      p.descripcion || '',
      p.contenido || '',
      'AEROVARADERO',
      p.pesoTasable ?? p.peso ?? 0,
    ]);
  }

  descargarHoja(filas, nombreArchivo);
}
