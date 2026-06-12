import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, X, Printer, Download, Truck, Lock, PackageCheck,
  AlertTriangle, CheckCircle2, Boxes, RefreshCw, Trash2,
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useReactToPrint } from 'react-to-print';
import { db } from '../../firebase';
import { cn } from '../../lib/utils';
import { exportarCSV } from '../../lib/csv';
import { ChipEstado } from '../ChipEstado';
import { CambioEstadoModal } from '../CambioEstadoModal';
import { LoteFormModal } from './LoteFormModal';
import { ManifiestoLote } from './ManifiestoLote';
import { HojaEntrega } from '../documentos/HojaEntrega';
import {
  agregarPaquetesALote, quitarPaqueteDeLote, cambiarEstadoLote,
  guardarTotalesLote, calcularTotalesLote, type PaqueteEnLote,
} from '../../services/lotes';
import { ESTADOS_FINALES } from '../../constants/estados';
import type { Lote } from '../../types/models';

export interface PaquetePanel extends PaqueteEnLote {
  destino?: string;
  contenido?: string;
  clienteNombre?: string;
  destinatarioNombre?: string;
  destinatarioDocumento?: string;
  loteId?: string | null;
  loteCodigo?: string | null;
}

interface PanelLotesProps {
  paquetes: PaquetePanel[];
}

export function PanelLotes({ paquetes }: PanelLotesProps) {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [isLoteFormOpen, setIsLoteFormOpen] = useState(false);
  const [isAgregarOpen, setIsAgregarOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionAgregar, setSeleccionAgregar] = useState<Set<string>>(new Set());
  const [isCambioEstadoPaquetesOpen, setIsCambioEstadoPaquetesOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const manifiestoRef = useRef<HTMLDivElement>(null);
  const imprimirManifiesto = useReactToPrint({ contentRef: manifiestoRef });
  const hojaEntregaRef = useRef<HTMLDivElement>(null);
  const imprimirHojaEntrega = useReactToPrint({ contentRef: hojaEntregaRef });

  useEffect(() => {
    const q = query(collection(db, 'lotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Lote[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Lote));
      setLotes(data);
    });
    return () => unsubscribe();
  }, []);

  const lote = lotes.find(l => l.id === selectedLoteId) || null;
  const paquetesDelLote = useMemo(
    () => (lote ? paquetes.filter(p => p.loteId === lote.id) : []),
    [paquetes, lote]
  );
  const paquetesSinLote = useMemo(
    () => paquetes.filter(p => !p.loteId && !ESTADOS_FINALES.includes(p.estado)),
    [paquetes]
  );
  const totales = useMemo(() => calcularTotalesLote(paquetesDelLote), [paquetesDelLote]);
  const beneficioEstimado = Math.round((totales.ingresosEstimados - (lote?.costesEstimados || 0)) * 100) / 100;

  const incompletos = useMemo(() => paquetesDelLote.filter(p =>
    !p.peso || p.peso <= 0 || !p.destinatarioDireccion || (p.importePendiente || 0) > 0
  ), [paquetesDelLote]);

  const candidatosAgregar = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return paquetesSinLote;
    return paquetesSinLote.filter(p =>
      (p.tracking || '').toLowerCase().includes(term) ||
      (p.clienteNombre || '').toLowerCase().includes(term) ||
      (p.destinatarioNombre || '').toLowerCase().includes(term) ||
      (p.destino || '').toLowerCase().includes(term)
    );
  }, [paquetesSinLote, busqueda]);

  const notificar = (tipo: 'ok' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const ejecutar = async (accion: () => Promise<void>, exito: string) => {
    setIsWorking(true);
    try {
      await accion();
      notificar('ok', exito);
    } catch (err) {
      console.error('Error en operación de lote:', err);
      notificar('error', 'Error en la operación. Verifica tu conexión y permisos.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleAgregarSeleccionados = () => {
    if (!lote || seleccionAgregar.size === 0) return;
    const aAgregar = paquetesSinLote.filter(p => seleccionAgregar.has(p.id));
    ejecutar(async () => {
      await agregarPaquetesALote(lote.id, lote.codigo, aAgregar);
      await guardarTotalesLote(lote.id, calcularTotalesLote([...paquetesDelLote, ...aAgregar]), lote.costesEstimados);
      setSeleccionAgregar(new Set());
      setIsAgregarOpen(false);
    }, `${aAgregar.length} paquete(s) agregados al lote ${lote.codigo}.`);
  };

  const handleQuitar = (paquete: PaquetePanel) => {
    if (!lote) return;
    if (!window.confirm(`¿Quitar el paquete ${paquete.tracking} del lote ${lote.codigo}?`)) return;
    ejecutar(async () => {
      await quitarPaqueteDeLote(lote.id, lote.codigo, paquete);
      await guardarTotalesLote(lote.id, calcularTotalesLote(paquetesDelLote.filter(p => p.id !== paquete.id)), lote.costesEstimados);
    }, `Paquete ${paquete.tracking} retirado del lote.`);
  };

  const handleCerrarLote = () => {
    if (!lote) return;
    if (!window.confirm(`¿Cerrar el lote ${lote.codigo} con ${paquetesDelLote.length} paquetes? No se podrán agregar más paquetes.`)) return;
    ejecutar(async () => {
      await guardarTotalesLote(lote.id, totales, lote.costesEstimados);
      await cambiarEstadoLote(lote.id, lote.codigo, 'Cerrado', paquetesDelLote, {
        estadoPaquetes: 'Listo para salida',
        motivo: `Cierre del lote ${lote.codigo}`,
      });
    }, `Lote ${lote.codigo} cerrado. ${paquetesDelLote.length} paquetes marcados "Listo para salida".`);
  };

  const handleConfirmarSalida = () => {
    if (!lote) return;
    if (!window.confirm(`¿Confirmar la SALIDA del lote ${lote.codigo}? Los ${paquetesDelLote.length} paquetes pasarán a "En Tránsito".`)) return;
    ejecutar(async () => {
      await guardarTotalesLote(lote.id, totales, lote.costesEstimados);
      await cambiarEstadoLote(lote.id, lote.codigo, 'En Tránsito', paquetesDelLote, {
        estadoPaquetes: 'En Tránsito',
        motivo: `Salida confirmada del lote ${lote.codigo}`,
      });
    }, `Salida del lote ${lote.codigo} confirmada.`);
  };

  const handleConfirmarLlegada = () => {
    if (!lote) return;
    if (!window.confirm(`¿Confirmar la LLEGADA del lote ${lote.codigo}? Los ${paquetesDelLote.length} paquetes pasarán a "Almacén Cuba".`)) return;
    ejecutar(async () => {
      await cambiarEstadoLote(lote.id, lote.codigo, 'Recibido', paquetesDelLote, {
        estadoPaquetes: 'Almacén Cuba',
        motivo: `Llegada confirmada del lote ${lote.codigo}`,
      });
    }, `Llegada del lote ${lote.codigo} confirmada.`);
  };

  const handleExportar = () => {
    if (!lote || paquetesDelLote.length === 0) return;
    exportarCSV(`${lote.codigo}-paquetes`, paquetesDelLote.map(p => ({
      Tracking: p.tracking,
      Remitente: p.clienteNombre || '',
      Destinatario: p.destinatarioNombre || '',
      Documento: p.destinatarioDocumento || '',
      Destino: p.destino || '',
      Contenido: p.contenido || '',
      'Peso (kg)': p.peso || 0,
      'Peso Tasable (kg)': p.pesoTasable || p.peso || 0,
      'Precio Final (€)': p.precioFinal || '',
      'Pendiente (€)': p.importePendiente || 0,
      Estado: p.estado,
    })));
  };

  const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const loteAbierto = lote?.estado === 'Abierto';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {mensaje && (
        <div className={cn(
          "rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border",
          mensaje.tipo === 'ok' ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-tp-red"
        )}>
          {mensaje.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-tp-blue">Lotes de Salida</h2>
          <p className="text-sm text-tp-blue/60">{paquetesSinLote.length} paquetes pendientes sin lote</p>
        </div>
        <button
          onClick={() => setIsLoteFormOpen(true)}
          className="bg-tp-red hover:bg-[#D91F33] text-white px-5 py-2.5 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Crear Nuevo Lote
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de lotes */}
        <div className="space-y-3">
          {lotes.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-tp-gray-soft text-center text-tp-blue/40">
              <Boxes className="w-12 h-12 mx-auto mb-3 text-tp-blue/20" />
              <p className="font-medium">Aún no hay lotes creados.</p>
            </div>
          )}
          {lotes.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLoteId(l.id)}
              className={cn(
                "w-full text-left bg-white p-4 rounded-2xl border-2 transition-all",
                selectedLoteId === l.id ? "border-tp-blue shadow-md" : "border-tp-gray-soft hover:border-tp-blue/30"
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono font-black text-tp-blue">{l.codigo}</span>
                <ChipEstado estado={l.estado} />
              </div>
              <p className="text-sm text-tp-blue/70 mt-1">{l.ruta || 'Sin ruta'}</p>
              <div className="flex justify-between text-xs text-tp-blue/50 mt-2">
                <span>{paquetes.filter(p => p.loteId === l.id).length} paquetes</span>
                <span>{l.fechaEstimadaSalida ? `Salida: ${l.fechaEstimadaSalida}` : 'Sin fecha'}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detalle del lote */}
        <div className="lg:col-span-2">
          {!lote ? (
            <div className="bg-white p-12 rounded-2xl border border-tp-gray-soft text-center text-tp-blue/40 h-full flex flex-col items-center justify-center">
              <Truck className="w-16 h-16 mb-4 text-tp-blue/20" />
              <p className="font-bold text-tp-blue/60">Selecciona un lote para ver su detalle</p>
              <p className="text-sm mt-1">o crea uno nuevo para empezar a consolidar paquetes.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
              {/* Cabecera del lote */}
              <div className="p-5 border-b border-tp-gray-soft">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono font-black text-xl text-tp-blue">{lote.codigo}</h3>
                      <ChipEstado estado={lote.estado} />
                    </div>
                    <p className="text-sm text-tp-blue/60 mt-1">
                      {lote.ruta || 'Sin ruta'}{lote.contenedor ? ` · ${lote.contenedor}` : ''}{lote.responsable ? ` · Resp: ${lote.responsable}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => imprimirManifiesto()} disabled={paquetesDelLote.length === 0} className="px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-tp-gray-soft transition-colors disabled:opacity-50">
                      <Printer className="w-4 h-4" /> Manifiesto
                    </button>
                    <button onClick={() => imprimirHojaEntrega()} disabled={paquetesDelLote.length === 0} className="px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-tp-gray-soft transition-colors disabled:opacity-50">
                      <Printer className="w-4 h-4" /> Hoja de Entrega
                    </button>
                    <button onClick={handleExportar} disabled={paquetesDelLote.length === 0} className="px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-tp-gray-soft transition-colors disabled:opacity-50">
                      <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                    {paquetesDelLote.length > 0 && (
                      <button onClick={() => setIsCambioEstadoPaquetesOpen(true)} disabled={isWorking} className="px-3 py-2 bg-tp-blue-light text-tp-blue rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-tp-gray-soft transition-colors disabled:opacity-50">
                        <RefreshCw className="w-4 h-4" /> Estado Paquetes
                      </button>
                    )}
                  </div>
                </div>

                {/* Totales */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
                  <div className="text-center p-2 bg-gray-50 rounded-xl border border-tp-gray-soft">
                    <p className="text-[9px] font-bold text-tp-blue/50 uppercase">Paquetes</p>
                    <p className="font-black text-tp-blue">{totales.totalPaquetes}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl border border-tp-gray-soft">
                    <p className="text-[9px] font-bold text-tp-blue/50 uppercase">Peso Real</p>
                    <p className="font-black text-tp-blue">{fmt(totales.pesoTotal)} kg</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl border border-tp-gray-soft">
                    <p className="text-[9px] font-bold text-tp-blue/50 uppercase">Peso Tasable</p>
                    <p className="font-black text-tp-blue">{fmt(totales.pesoTasableTotal)} kg</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl border border-tp-gray-soft">
                    <p className="text-[9px] font-bold text-tp-blue/50 uppercase">Valor Declarado</p>
                    <p className="font-black text-tp-blue">{fmt(totales.valorDeclaradoTotal)} €</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl border border-tp-gray-soft">
                    <p className="text-[9px] font-bold text-tp-blue/50 uppercase">Ingresos Est.</p>
                    <p className="font-black text-tp-blue">{fmt(totales.ingresosEstimados)} €</p>
                  </div>
                  <div className="text-center p-2 bg-tp-blue-light/40 rounded-xl border border-tp-blue/10">
                    <p className="text-[9px] font-bold text-tp-blue/50 uppercase">Beneficio Est.</p>
                    <p className={cn("font-black", beneficioEstimado >= 0 ? "text-green-700" : "text-tp-red")}>{fmt(beneficioEstimado)} €</p>
                  </div>
                </div>

                {incompletos.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {incompletos.length} paquete(s) con datos incompletos o pago pendiente (marcados en la tabla).
                  </div>
                )}

                {/* Acciones de ciclo de vida */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {loteAbierto && (
                    <>
                      <button onClick={() => { setSeleccionAgregar(new Set()); setBusqueda(''); setIsAgregarOpen(true); }} disabled={isWorking} className="px-4 py-2 bg-tp-blue text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-[#004a78] transition-colors disabled:opacity-50">
                        <Plus className="w-4 h-4" /> Agregar Paquetes
                      </button>
                      <button onClick={handleCerrarLote} disabled={isWorking || paquetesDelLote.length === 0} className="px-4 py-2 bg-tp-blue/10 text-tp-blue rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-tp-blue/20 transition-colors disabled:opacity-50">
                        <Lock className="w-4 h-4" /> Cerrar Lote
                      </button>
                    </>
                  )}
                  {(lote.estado === 'Cerrado' || lote.estado === 'Abierto') && paquetesDelLote.length > 0 && (
                    <button onClick={handleConfirmarSalida} disabled={isWorking} className="px-4 py-2 bg-tp-red text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-[#D91F33] transition-colors disabled:opacity-50">
                      <Truck className="w-4 h-4" /> Confirmar Salida
                    </button>
                  )}
                  {lote.estado === 'En Tránsito' && (
                    <button onClick={handleConfirmarLlegada} disabled={isWorking} className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50">
                      <PackageCheck className="w-4 h-4" /> Confirmar Llegada
                    </button>
                  )}
                </div>
              </div>

              {/* Tabla de paquetes del lote */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                    <tr>
                      <th className="px-4 py-3">Tracking</th>
                      <th className="px-4 py-3">Destinatario</th>
                      <th className="px-4 py-3">Destino</th>
                      <th className="px-4 py-3">Peso</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-gray-soft">
                    {paquetesDelLote.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-tp-blue/40 italic">El lote está vacío. Usa "Agregar Paquetes".</td>
                      </tr>
                    )}
                    {paquetesDelLote.map(p => {
                      const esIncompleto = incompletos.includes(p);
                      return (
                        <tr key={p.id} className={cn("hover:bg-gray-50/50 transition-colors", esIncompleto && "bg-amber-50/50")}>
                          <td className="px-4 py-3 font-bold text-tp-blue">
                            <span className="flex items-center gap-1.5">
                              {esIncompleto && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                              {p.tracking}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-tp-blue/70">{p.destinatarioNombre || '—'}</td>
                          <td className="px-4 py-3 text-tp-blue/70">{p.destino || '—'}</td>
                          <td className="px-4 py-3 font-mono text-tp-blue/70">{p.peso ? `${p.peso} kg` : '—'}</td>
                          <td className="px-4 py-3"><ChipEstado estado={p.estado} /></td>
                          <td className="px-4 py-3 text-right">
                            {loteAbierto && (
                              <button
                                onClick={() => handleQuitar(p)}
                                disabled={isWorking}
                                className="p-2 text-tp-blue/40 hover:text-tp-red transition-colors disabled:opacity-50"
                                title="Quitar del lote"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear lote */}
      <LoteFormModal
        open={isLoteFormOpen}
        onClose={() => setIsLoteFormOpen(false)}
        onCreated={(id) => { setSelectedLoteId(id); notificar('ok', 'Lote creado correctamente.'); }}
      />

      {/* Modal cambio de estado de los paquetes del lote (reutilizado) */}
      <CambioEstadoModal
        open={isCambioEstadoPaquetesOpen}
        onClose={() => setIsCambioEstadoPaquetesOpen(false)}
        paquetes={paquetesDelLote}
        tipoCambio="lote"
        onDone={(estado, n) => notificar('ok', `${n} paquetes del lote actualizados a "${estado}".`)}
      />

      {/* Modal agregar paquetes */}
      {isAgregarOpen && lote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Agregar Paquetes al Lote {lote.codigo}</h3>
              <button onClick={() => setIsAgregarOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/40" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar tracking, cliente, destino..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
                />
              </div>
              <div className="max-h-[45vh] overflow-y-auto border border-tp-gray-soft rounded-xl divide-y divide-tp-gray-soft">
                {candidatosAgregar.length === 0 && (
                  <p className="p-6 text-center text-tp-blue/40 italic text-sm">No hay paquetes disponibles sin lote.</p>
                )}
                {candidatosAgregar.map(p => (
                  <label key={p.id} className={cn("flex items-center gap-3 p-3 cursor-pointer hover:bg-tp-blue-light/20 transition-colors", seleccionAgregar.has(p.id) && "bg-tp-blue-light/30")}>
                    <input
                      type="checkbox"
                      checked={seleccionAgregar.has(p.id)}
                      onChange={() => {
                        const next = new Set(seleccionAgregar);
                        next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                        setSeleccionAgregar(next);
                      }}
                      className="w-4 h-4 accent-tp-blue"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-tp-blue text-sm">{p.tracking} <span className="font-normal text-tp-blue/60">· {p.clienteNombre || 'sin cliente'}</span></p>
                      <p className="text-xs text-tp-blue/50 truncate">{p.destinatarioNombre || '—'} · {p.destino || '—'} · {p.peso ? `${p.peso} kg` : 'sin peso'}</p>
                    </div>
                    <ChipEstado estado={p.estado} />
                  </label>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setSeleccionAgregar(seleccionAgregar.size === candidatosAgregar.length ? new Set() : new Set(candidatosAgregar.map(p => p.id)))}
                  className="text-sm font-bold text-tp-blue hover:underline"
                >
                  {seleccionAgregar.size === candidatosAgregar.length && candidatosAgregar.length > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setIsAgregarOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                  <button
                    onClick={handleAgregarSeleccionados}
                    disabled={isWorking || seleccionAgregar.size === 0}
                    className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50"
                  >
                    {isWorking ? 'Agregando...' : `Agregar ${seleccionAgregar.size} paquete(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documentos ocultos para impresión */}
      {lote && paquetesDelLote.length > 0 && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ManifiestoLote ref={manifiestoRef} lote={lote} paquetes={paquetesDelLote} />
          <HojaEntrega ref={hojaEntregaRef} lote={lote} paquetes={paquetesDelLote} />
        </div>
      )}
    </div>
  );
}
