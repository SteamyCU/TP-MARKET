import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { exportarExcel } from '../lib/excel';
import { exportarCSV } from '../lib/csv';

export interface ColumnaDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Valor plano para ordenar/exportar; por defecto se usa fila[key] */
  valor?: (fila: T) => string | number;
  /** Render personalizado de la celda; por defecto se muestra el valor */
  render?: (fila: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  datos: T[];
  columnas: ColumnaDef<T>[];
  /** Texto sobre el que actúa el buscador; si se omite, no se muestra buscador */
  buscarEn?: (fila: T) => string;
  placeholderBusqueda?: string;
  /** Controles de filtro adicionales (selects, fechas...) */
  filtros?: React.ReactNode;
  seleccionable?: boolean;
  /** Botones de acción masiva; reciben los seleccionados y un callback para limpiar la selección */
  accionesMasivas?: (seleccionados: T[], limpiarSeleccion: () => void) => React.ReactNode;
  accionesFila?: (fila: T) => React.ReactNode;
  /** Si se indica, muestra botones Exportar Excel/CSV con este nombre de archivo */
  exportarNombre?: string;
  /** Fila plana para exportación; por defecto se construye desde las columnas */
  exportarFila?: (fila: T) => Record<string, unknown>;
  porPagina?: number;
  vacio?: string;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string }>({
  datos, columnas, buscarEn, placeholderBusqueda, filtros, seleccionable,
  accionesMasivas, accionesFila, exportarNombre, exportarFila,
  porPagina = 20, vacio = 'Sin resultados.', isLoading,
}: DataTableProps<T>) {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

  const valorDe = (fila: T, col: ColumnaDef<T>): string | number => {
    if (col.valor) return col.valor(fila);
    const v = (fila as Record<string, unknown>)[col.key];
    return typeof v === 'number' ? v : String(v ?? '');
  };

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    let resultado = term && buscarEn ? datos.filter(d => buscarEn(d).toLowerCase().includes(term)) : datos;
    if (orden) {
      const col = columnas.find(c => c.key === orden.key);
      if (col) {
        resultado = [...resultado].sort((a, b) => {
          const va = valorDe(a, col);
          const vb = valorDe(b, col);
          const cmp = typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb), 'es');
          return orden.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return resultado;
  }, [datos, busqueda, buscarEn, orden, columnas]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const seleccionados = useMemo(() => filtrados.filter(d => seleccion.has(d.id)), [filtrados, seleccion]);
  const limpiarSeleccion = () => setSeleccion(new Set());

  const toggleFila = (id: string) => {
    const next = new Set(seleccion);
    next.has(id) ? next.delete(id) : next.add(id);
    setSeleccion(next);
  };

  const todosSeleccionados = filtrados.length > 0 && filtrados.every(d => seleccion.has(d.id));
  const toggleTodos = () => {
    setSeleccion(todosSeleccionados ? new Set() : new Set(filtrados.map(d => d.id)));
  };

  const construirFilaExport = (fila: T): Record<string, unknown> =>
    exportarFila ? exportarFila(fila) : Object.fromEntries(columnas.map(c => [c.label, valorDe(fila, c)]));

  const handleOrden = (col: ColumnaDef<T>) => {
    if (!col.sortable) return;
    setOrden(prev => prev?.key === col.key
      ? (prev.dir === 'asc' ? { key: col.key, dir: 'desc' } : null)
      : { key: col.key, dir: 'asc' });
  };

  return (
    <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
      {/* Barra de herramientas */}
      <div className="p-4 border-b border-tp-gray-soft flex flex-col md:flex-row gap-3 md:items-center bg-gray-50/50">
        {buscarEn && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/40" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder={placeholderBusqueda || 'Buscar...'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm text-tp-blue"
            />
          </div>
        )}
        {filtros}
        <div className="flex flex-wrap gap-2 md:ml-auto items-center">
          {seleccionados.length > 0 && accionesMasivas?.(seleccionados, limpiarSeleccion)}
          {exportarNombre && (
            <>
              <button
                onClick={() => exportarExcel(exportarNombre, filtrados.map(construirFilaExport))}
                disabled={filtrados.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl text-xs font-bold hover:bg-tp-gray-soft transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={() => exportarCSV(exportarNombre, filtrados.map(construirFilaExport))}
                disabled={filtrados.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl text-xs font-bold hover:bg-tp-gray-soft transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
            <tr>
              {seleccionable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={toggleTodos}
                    className="rounded border-tp-gray-soft text-tp-blue focus:ring-tp-blue/20"
                  />
                </th>
              )}
              {columnas.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleOrden(col)}
                  className={cn("px-4 py-3 select-none", col.sortable && "cursor-pointer hover:text-tp-blue", col.className)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && orden?.key === col.key && (
                      orden.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </th>
              ))}
              {accionesFila && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-tp-gray-soft">
            {isLoading && (
              <tr>
                <td colSpan={columnas.length + (seleccionable ? 1 : 0) + (accionesFila ? 1 : 0)} className="px-4 py-12 text-center">
                  <div className="w-8 h-8 border-2 border-tp-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            )}
            {!isLoading && visibles.length === 0 && (
              <tr>
                <td colSpan={columnas.length + (seleccionable ? 1 : 0) + (accionesFila ? 1 : 0)} className="px-4 py-8 text-center text-tp-blue/40 italic">
                  {vacio}
                </td>
              </tr>
            )}
            {!isLoading && visibles.map(fila => (
              <tr key={fila.id} className={cn("hover:bg-gray-50/50 transition-colors", seleccion.has(fila.id) && "bg-tp-blue-light/20")}>
                {seleccionable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={seleccion.has(fila.id)}
                      onChange={() => toggleFila(fila.id)}
                      className="rounded border-tp-gray-soft text-tp-blue focus:ring-tp-blue/20"
                    />
                  </td>
                )}
                {columnas.map(col => (
                  <td key={col.key} className={cn("px-4 py-3 text-tp-blue/80", col.className)}>
                    {col.render ? col.render(fila) : String(valorDe(fila, col))}
                  </td>
                ))}
                {accionesFila && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">{accionesFila(fila)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-3 border-t border-tp-gray-soft flex flex-wrap justify-between items-center gap-2 text-sm text-tp-blue/60">
        <span>
          {filtrados.length} registro(s){seleccionados.length > 0 ? ` · ${seleccionados.length} seleccionado(s)` : ''}
        </span>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={paginaActual <= 1}
              className="p-1.5 rounded-lg hover:bg-tp-blue-light disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-tp-blue">{paginaActual} / {totalPaginas}</span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              className="p-1.5 rounded-lg hover:bg-tp-blue-light disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
