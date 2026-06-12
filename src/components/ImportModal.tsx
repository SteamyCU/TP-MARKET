import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { leerArchivoTabla, descargarPlantilla, normalizarCabecera, type ColumnaPlantilla } from '../lib/excel';

export interface CampoImportacion extends ColumnaPlantilla {
  requerido?: boolean;
}

interface FilaProcesada {
  indice: number;
  datos: Record<string, string>;
  error: string | null;
  duplicado: string | null;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  plantillaNombre: string;
  campos: CampoImportacion[];
  /** Devuelve un mensaje de error si la fila no es válida */
  validarFila?: (fila: Record<string, string>) => string | null;
  /** Devuelve una descripción si la fila duplica un registro existente (se omitirá) */
  detectarDuplicado?: (fila: Record<string, string>) => string | null;
  /** Guarda las filas válidas; devuelve cuántas se importaron */
  onImportar: (filas: Record<string, string>[]) => Promise<number>;
}

export function ImportModal({ open, onClose, titulo, plantillaNombre, campos, validarFila, detectarDuplicado, onImportar }: ImportModalProps) {
  const [filas, setFilas] = useState<FilaProcesada[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const validas = filas.filter(f => !f.error && !f.duplicado);
  const conError = filas.filter(f => f.error);
  const duplicadas = filas.filter(f => !f.error && f.duplicado);

  const reset = () => {
    setFilas([]);
    setNombreArchivo('');
    setError(null);
    setResultado(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResultado(null);
    setNombreArchivo(file.name);
    try {
      const crudas = await leerArchivoTabla(file);
      if (crudas.length === 0) {
        setError('El archivo está vacío o no tiene un formato de tabla reconocible.');
        setFilas([]);
        return;
      }
      // Mapear cabeceras del archivo a los campos esperados (por label o key, sin tildes)
      const cabeceras = Object.keys(crudas[0]);
      const mapa: Record<string, string> = {};
      for (const campo of campos) {
        const objetivo = [normalizarCabecera(campo.label), normalizarCabecera(campo.key)];
        const encontrada = cabeceras.find(h => objetivo.includes(normalizarCabecera(h)));
        if (encontrada) mapa[campo.key] = encontrada;
      }
      const requeridosSinColumna = campos.filter(c => c.requerido && !mapa[c.key]);
      if (requeridosSinColumna.length > 0) {
        setError(`Faltan columnas obligatorias en el archivo: ${requeridosSinColumna.map(c => c.label).join(', ')}. Descarga la plantilla para ver el formato esperado.`);
        setFilas([]);
        return;
      }

      const procesadas: FilaProcesada[] = crudas.map((cruda, i) => {
        const datos: Record<string, string> = {};
        for (const campo of campos) {
          datos[campo.key] = mapa[campo.key] ? String(cruda[mapa[campo.key]] ?? '').trim() : '';
        }
        let errorFila: string | null = null;
        const faltan = campos.filter(c => c.requerido && !datos[c.key]);
        if (faltan.length > 0) {
          errorFila = `Faltan datos: ${faltan.map(c => c.label).join(', ')}`;
        } else if (validarFila) {
          errorFila = validarFila(datos);
        }
        const duplicado = !errorFila && detectarDuplicado ? detectarDuplicado(datos) : null;
        return { indice: i + 2, datos, error: errorFila, duplicado };
      });
      setFilas(procesadas);
    } catch (err) {
      console.error('Error reading import file:', err);
      setError('No se pudo leer el archivo. Asegúrate de que es un .xlsx o .csv válido.');
      setFilas([]);
    }
  };

  const handleImportar = async () => {
    if (validas.length === 0) return;
    setIsImporting(true);
    setError(null);
    try {
      const importadas = await onImportar(validas.map(f => f.datos));
      setResultado(`${importadas} registro(s) importados correctamente.${duplicadas.length > 0 ? ` ${duplicadas.length} duplicado(s) omitidos.` : ''}${conError.length > 0 ? ` ${conError.length} fila(s) con errores no se importaron.` : ''}`);
      setFilas([]);
      setNombreArchivo('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      console.error('Error importing rows:', err);
      setError('Error al guardar los registros. Verifica tu conexión y permisos.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> {titulo}</h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-tp-blue/60">Formatos admitidos: <span className="font-bold">.xlsx, .xls, .csv</span></p>
            <button
              onClick={() => descargarPlantilla(plantillaNombre, campos)}
              className="flex items-center gap-1.5 px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl text-xs font-bold hover:bg-tp-gray-soft transition-colors"
            >
              <Download className="w-4 h-4" /> Descargar Plantilla
            </button>
          </div>

          <div className="relative border-2 border-dashed border-tp-gray-soft rounded-2xl p-6 text-center hover:border-tp-blue/30 transition-colors group">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleArchivo}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-tp-blue font-bold text-sm">{nombreArchivo || 'Haz clic o arrastra el archivo aquí'}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-tp-red text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {resultado && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2 text-green-800 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {resultado}
            </div>
          )}

          {filas.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700">{validas.length} válidas</span>
                {duplicadas.length > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{duplicadas.length} duplicadas (se omiten)</span>}
                {conError.length > 0 && <span className="px-2.5 py-1 rounded-full bg-red-100 text-tp-red">{conError.length} con errores</span>}
              </div>

              <div className="max-h-[40vh] overflow-y-auto border border-tp-gray-soft rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      {campos.slice(0, 4).map(c => <th key={c.key} className="px-3 py-2">{c.label}</th>)}
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-gray-soft">
                    {filas.map(f => (
                      <tr key={f.indice} className={cn(f.error && "bg-red-50/50", !f.error && f.duplicado && "bg-amber-50/50")}>
                        <td className="px-3 py-2 text-tp-blue/50">{f.indice}</td>
                        {campos.slice(0, 4).map(c => (
                          <td key={c.key} className="px-3 py-2 text-tp-blue/80 max-w-[150px] truncate">{f.datos[c.key] || '—'}</td>
                        ))}
                        <td className="px-3 py-2">
                          {f.error ? (
                            <span className="inline-flex items-center gap-1 text-tp-red font-bold"><AlertCircle className="w-3 h-3" /> {f.error}</span>
                          ) : f.duplicado ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold"><AlertTriangle className="w-3 h-3" /> {f.duplicado}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-700 font-bold"><CheckCircle2 className="w-3 h-3" /> OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cerrar</button>
            <button
              onClick={handleImportar}
              disabled={isImporting || validas.length === 0}
              className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50"
            >
              {isImporting ? 'Importando...' : `Importar ${validas.length} registro(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
