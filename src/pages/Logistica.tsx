import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, Truck, Layers, AlertCircle, CheckCircle2, Box, Printer, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { ChipEstado } from '../components/ChipEstado';
import { CambioEstadoModal } from '../components/CambioEstadoModal';
import { DataTable, type ColumnaDef } from '../components/DataTable';
import { cn } from '../lib/utils';
import { useReactToPrint } from 'react-to-print';
import { EtiquetaPaquete } from '../components/EtiquetaPaquete';
import { ESTADOS_PAQUETE, GRUPOS_ESTADO } from '../constants/estados';
import type { PaqueteParaCambio } from '../services/estados';
import { PanelLotes } from '../components/lotes/PanelLotes';

interface Paquete {
  id: string;
  tracking: string;
  peso: number;
  origen: string;
  destino: string;
  estado: string;
  contenido: string;
  detallesIncidencia?: string;
  createdAt: any;
  clienteNombre?: string;
  clienteTelefono?: string;
  destinatarioNombre?: string;
  destinatarioId?: string;
  destinatarioDocumento?: string;
  destinatarioDireccion?: string;
  destinatarioTelefono?: string;
  guiaMaster?: string;
  importePendiente?: number;
  importePagado?: number;
  estadoPago?: string;
  pesoTasable?: number | null;
  volumenCm3?: number | null;
  valorDeclarado?: number | null;
  precioFinal?: number | null;
  loteId?: string | null;
  loteCodigo?: string | null;
}

export function Logistica() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clasificacion' | 'despacho'>('dashboard');
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [paquetesParaEstado, setPaquetesParaEstado] = useState<PaqueteParaCambio[]>([]);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const limpiarSeleccionRef = useRef<() => void>(() => {});

  const [paquetesParaImprimir, setPaquetesParaImprimir] = useState<any[]>([]);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Etiquetas-${paquetesParaImprimir.length > 1 ? 'Lote' : paquetesParaImprimir[0]?.tracking || 'paquete'}`,
  });

  useEffect(() => {
    if (paquetesParaImprimir.length > 0 && componentRef.current) {
      handlePrint();
      setPaquetesParaImprimir([]);
    }
  }, [paquetesParaImprimir, handlePrint]);

  const paquetesFiltrados = useMemo(
    () => (filtroEstado ? paquetes.filter(p => p.estado === filtroEstado) : paquetes),
    [paquetes, filtroEstado]
  );

  const imprimirLista = (lista: Paquete[]) => {
    const dataEtiquetas = lista.map(paquete => ({
      tracking: paquete.tracking,
      remitente: paquete.clienteNombre || 'CLIENTE TOPAQUETE',
      consignatario: paquete.destinatarioNombre || 'DESTINATARIO',
      direccion: paquete.destinatarioDireccion || paquete.destino || 'DIRECCIÓN NO ESPECIFICADA',
      telefono: paquete.destinatarioTelefono || paquete.clienteTelefono || 'N/A',
      idDestinatario: paquete.destinatarioDocumento || paquete.destinatarioId || 'N/A',
      peso: paquete.peso || 0,
      piezas: 1,
      guiaMaster: paquete.guiaMaster || 'TP-MASTER-001',
      trackingInterno: paquete.tracking
    }));
    setPaquetesParaImprimir(dataEtiquetas);
  };

  const prepararImpresion = (paquete: Paquete) => imprimirLista([paquete]);

  useEffect(() => {
    const q = query(collection(db, 'paquetes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Paquete[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Paquete);
      });
      setPaquetes(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalKilos = paquetes.reduce((sum, p) => sum + (p.peso || 0), 0);
  const paquetesEnRecepcion = paquetes.filter(p => p.estado === 'Recepción').length;
  const paquetesEnDespacho = paquetes.filter(p => p.estado === 'Despacho').length;
  const incidencias = paquetes.filter(p => p.estado === 'Incidencia').length;

  const abrirCambioIndividual = (paquete: Paquete) => {
    setPaquetesParaEstado([paquete]);
    setIsEstadoModalOpen(true);
  };

  const onEstadoCambiado = (nuevoEstado: string, actualizados: number) => {
    setMensajeExito(
      actualizados === 1
        ? `Estado actualizado a "${nuevoEstado}".`
        : `${actualizados} paquetes actualizados a "${nuevoEstado}".`
    );
    limpiarSeleccionRef.current();
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const columnasClasificacion: ColumnaDef<Paquete>[] = [
    { key: 'tracking', label: 'Tracking', sortable: true, render: (p) => <span className="font-bold text-tp-blue">{p.tracking}</span> },
    { key: 'clienteNombre', label: 'Cliente', sortable: true, valor: (p) => p.clienteNombre || '' },
    { key: 'contenido', label: 'Contenido', valor: (p) => p.contenido || 'N/A' },
    { key: 'destino', label: 'Destino', sortable: true, valor: (p) => p.destino || '' },
    { key: 'peso', label: 'Peso (kg)', sortable: true, valor: (p) => p.peso || 0 },
    {
      key: 'loteCodigo', label: 'Lote', sortable: true, valor: (p) => p.loteCodigo || '',
      render: (p) => p.loteCodigo
        ? <span className="font-mono text-xs font-bold text-tp-blue bg-tp-blue-light px-2 py-1 rounded-lg">{p.loteCodigo}</span>
        : <span className="text-xs text-tp-blue/30 italic">Sin lote</span>,
    },
    { key: 'estado', label: 'Estado', sortable: true, render: (p) => <ChipEstado estado={p.estado} /> },
  ];

  const filaExportPaquete = (p: Paquete) => ({
    Tracking: p.tracking,
    Cliente: p.clienteNombre || '',
    Destinatario: p.destinatarioNombre || '',
    Destino: p.destino || '',
    Contenido: p.contenido || '',
    'Peso (kg)': p.peso || 0,
    'Peso Tasable (kg)': p.pesoTasable || p.peso || 0,
    'Precio Final (€)': p.precioFinal ?? '',
    'Pendiente (€)': p.importePendiente ?? '',
    Lote: p.loteCodigo || '',
    Estado: p.estado,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Logística y Operaciones</h1>
          <p className="text-tp-blue/60 mt-1">Control centralizado de clasificación y despacho</p>
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{mensajeExito}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-tp-gray-soft">
        {[
          { id: 'dashboard', label: 'Dashboard Logístico', icon: Box },
          { id: 'clasificacion', label: 'Clasificación', icon: Layers },
          { id: 'despacho', label: 'Despacho', icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-tp-blue text-tp-blue" 
                : "border-transparent text-tp-blue/50 hover:text-tp-blue hover:bg-tp-blue-light/30"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue">
                    <Box className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-tp-blue/70 uppercase text-xs tracking-wider">Kilos Recepcionados</h3>
                </div>
                <div className="text-3xl font-black text-tp-blue">{totalKilos.toFixed(2)} <span className="text-lg text-tp-blue/50">kg</span></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-tp-blue/70 uppercase text-xs tracking-wider">En Recepción</h3>
                </div>
                <div className="text-3xl font-black text-tp-blue">{paquetesEnRecepcion}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-tp-blue/70 uppercase text-xs tracking-wider">En Despacho</h3>
                </div>
                <div className="text-3xl font-black text-tp-blue">{paquetesEnDespacho}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-tp-red">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-tp-red uppercase text-xs tracking-wider">Incidencias</h3>
                </div>
                <div className="text-3xl font-black text-tp-red">{incidencias}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
              <div className="p-5 border-b border-tp-gray-soft">
                <h2 className="text-lg font-bold text-tp-blue">Vista General de Paquetes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                    <tr>
                      <th className="px-5 py-3">Tracking</th>
                      <th className="px-5 py-3">Contenido</th>
                      <th className="px-5 py-3">Destino</th>
                      <th className="px-5 py-3">Peso (kg)</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-gray-soft">
                    {paquetes.slice(0, 10).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-tp-blue">{p.tracking}</td>
                        <td className="px-5 py-4 text-tp-blue/70">{p.contenido || 'N/A'}</td>
                        <td className="px-5 py-4 text-tp-blue/70">{p.destino}</td>
                        <td className="px-5 py-4 font-medium">{p.peso}</td>
                        <td className="px-5 py-4"><ChipEstado estado={p.estado} /></td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => prepararImpresion(p)}
                            className="p-2 text-tp-blue hover:bg-tp-blue-light rounded-lg transition-colors"
                            title="Imprimir Etiqueta"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paquetes.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-tp-blue/50">No hay paquetes registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clasificacion' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft">
              <h2 className="text-lg font-bold text-tp-blue mb-6">Clasificación de Envíos</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border border-tp-gray-soft rounded-xl bg-gray-50">
                  <h4 className="font-bold text-tp-blue mb-1">Por Categoría</h4>
                  <ul className="space-y-2 text-sm text-tp-blue/70">
                    <li className="flex justify-between"><span>Miscelánea</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">{paquetes.filter(p => p.contenido?.toLowerCase().includes('miscelanea')).length}</span></li>
                    <li className="flex justify-between"><span>Comida</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">{paquetes.filter(p => p.contenido?.toLowerCase().includes('comida')).length}</span></li>
                    <li className="flex justify-between"><span>Baterías</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">{paquetes.filter(p => p.contenido?.toLowerCase().includes('bateria')).length}</span></li>
                  </ul>
                </div>
                <div className="p-4 border border-tp-gray-soft rounded-xl bg-gray-50">
                  <h4 className="font-bold text-tp-blue mb-1">Por Provincia (Top 3)</h4>
                  <ul className="space-y-2 text-sm text-tp-blue/70">
                    <li className="flex justify-between"><span>La Habana</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">{paquetes.filter(p => p.destino?.includes('Habana')).length}</span></li>
                    <li className="flex justify-between"><span>Santiago de Cuba</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">{paquetes.filter(p => p.destino?.includes('Santiago')).length}</span></li>
                    <li className="flex justify-between"><span>Camagüey</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">{paquetes.filter(p => p.destino?.includes('Camagüey')).length}</span></li>
                  </ul>
                </div>
                <div className="p-4 border border-tp-gray-soft rounded-xl bg-gray-50">
                  <h4 className="font-bold text-tp-blue mb-1">Tipo de Entrega</h4>
                  <ul className="space-y-2 text-sm text-tp-blue/70">
                    <li className="flex justify-between"><span>Con Domicilio</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">-</span></li>
                    <li className="flex justify-between"><span>Sin Domicilio (Recogida)</span> <span className="font-bold bg-white px-2 rounded border border-tp-gray-soft">-</span></li>
                  </ul>
                </div>
              </div>

              <DataTable
                datos={paquetesFiltrados}
                columnas={columnasClasificacion}
                isLoading={isLoading}
                buscarEn={(p) => `${p.tracking} ${p.clienteNombre || ''} ${p.destinatarioNombre || ''} ${p.destino || ''}`}
                placeholderBusqueda="Buscar tracking, cliente, destino..."
                filtros={
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="bg-tp-blue-light text-tp-blue px-4 py-2 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none cursor-pointer"
                  >
                    <option value="">Todos los estados</option>
                    {(['origen', 'transito', 'destino', 'final', 'alerta'] as const).map(g => (
                      <optgroup key={g} label={GRUPOS_ESTADO[g]}>
                        {ESTADOS_PAQUETE.filter(e => e.grupo === g).map(e => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                }
                seleccionable
                accionesMasivas={(seleccionados, limpiar) => (
                  <>
                    <button
                      onClick={() => {
                        limpiarSeleccionRef.current = limpiar;
                        setPaquetesParaEstado(seleccionados);
                        setIsEstadoModalOpen(true);
                      }}
                      className="bg-tp-red text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs hover:bg-[#D91F33] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Cambiar Estado ({seleccionados.length})
                    </button>
                    <button
                      onClick={() => imprimirLista(seleccionados)}
                      className="bg-tp-blue text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs hover:bg-[#004a78] transition-colors"
                    >
                      <Printer className="w-4 h-4" /> Imprimir ({seleccionados.length})
                    </button>
                  </>
                )}
                accionesFila={(p) => (
                  <>
                    <button
                      onClick={() => prepararImpresion(p)}
                      className="p-2 text-tp-blue hover:bg-tp-blue-light rounded-lg transition-colors"
                      title="Imprimir Etiqueta"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => abrirCambioIndividual(p)}
                      className="text-tp-blue hover:text-tp-red font-bold transition-colors text-xs"
                    >
                      Actualizar Estado
                    </button>
                  </>
                )}
                exportarNombre="paquetes"
                exportarFila={filaExportPaquete}
                porPagina={25}
                vacio={paquetes.length === 0 ? 'No hay paquetes registrados.' : 'Ningún paquete coincide con la búsqueda o el filtro.'}
              />
            </div>
          </div>
        )}

        {activeTab === 'despacho' && (
          <PanelLotes paquetes={paquetes} />
        )}
      </div>

      {/* Modal de cambio de estado (individual y masivo) */}
      <CambioEstadoModal
        open={isEstadoModalOpen}
        onClose={() => { setIsEstadoModalOpen(false); setPaquetesParaEstado([]); }}
        paquetes={paquetesParaEstado}
        onDone={onEstadoCambiado}
      />

      {/* Hidden Label for Printing */}
      <div className="hidden">
        <div ref={componentRef}>
          {paquetesParaImprimir.map((p, index) => (
            <div key={index} className={cn(index > 0 && "break-before-page")}>
              <EtiquetaPaquete paquete={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
