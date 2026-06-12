import React, { useState, useEffect, useRef } from 'react';
import { Package, Truck, Layers, Search, Filter, AlertCircle, CheckCircle2, Clock, MapPin, ArrowRight, Box, Plus, X, Printer } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ChipEstado } from '../components/ChipEstado';
import { cn } from '../lib/utils';
import { useReactToPrint } from 'react-to-print';
import { EtiquetaPaquete } from '../components/EtiquetaPaquete';

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
}

export function Logistica() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clasificacion' | 'despacho'>('dashboard');
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [selectedPaqueteIds, setSelectedPaqueteIds] = useState<Set<string>>(new Set());
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

  const toggleSelectPaquete = (id: string) => {
    const newSelected = new Set(selectedPaqueteIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPaqueteIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPaqueteIds.size === paquetes.length) {
      setSelectedPaqueteIds(new Set());
    } else {
      setSelectedPaqueteIds(new Set(paquetes.map(p => p.id)));
    }
  };

  const prepararImpresion = async (paquete: Paquete) => {
    const dataEtiqueta = {
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
    };
    setPaquetesParaImprimir([dataEtiqueta]);
  };

  const imprimirSeleccionados = () => {
    const seleccionados = paquetes.filter(p => selectedPaqueteIds.has(p.id));
    const dataEtiquetas = seleccionados.map(paquete => ({
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

  const openStatusModal = (paquete: Paquete) => {
    setSelectedPaquete(paquete);
    setNewStatus(paquete.estado);
    setStatusNotes('');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaquete) return;
    
    setIsUpdatingStatus(true);
    try {
      // Update package status
      const paqueteRef = doc(db, 'paquetes', selectedPaquete.id);
      
      const updateData: any = {
        estado: newStatus,
        updatedAt: serverTimestamp()
      };
      
      // If changing from Incidencia to something else, we might want to clear the details
      if (selectedPaquete.estado === 'Incidencia' && newStatus !== 'Incidencia') {
        updateData.detallesIncidencia = '';
      }
      
      await updateDoc(paqueteRef, updateData);

      // Add event
      await addDoc(collection(db, 'eventos'), {
        paqueteId: selectedPaquete.tracking,
        estado: newStatus,
        notas: statusNotes || `Estado actualizado a ${newStatus}`,
        timestamp: serverTimestamp(),
        operadorId: auth.currentUser?.uid || 'unknown'
      });

      setIsStatusModalOpen(false);
      setSelectedPaquete(null);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Logística y Operaciones</h1>
          <p className="text-tp-blue/60 mt-1">Control centralizado de clasificación y despacho</p>
        </div>
      </div>

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
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-tp-blue">Clasificación de Envíos</h2>
                <div className="flex gap-3 w-full md:w-auto">
                  {selectedPaqueteIds.size > 0 && (
                    <button 
                      onClick={imprimirSeleccionados}
                      className="bg-tp-blue text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-[#004a78] transition-colors"
                    >
                      <Printer className="w-4 h-4" /> Imprimir ({selectedPaqueteIds.size})
                    </button>
                  )}
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/40" />
                    <input 
                      type="text" 
                      placeholder="Buscar por tracking..." 
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
                    />
                  </div>
                  <button className="bg-tp-blue-light text-tp-blue px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-tp-blue-light/80 transition-colors">
                    <Filter className="w-4 h-4" /> Filtros
                  </button>
                </div>
              </div>

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

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                    <tr>
                      <th className="px-5 py-3 w-10">
                        <input 
                          type="checkbox" 
                          checked={paquetes.length > 0 && selectedPaqueteIds.size === paquetes.length}
                          onChange={toggleSelectAll}
                          className="rounded border-tp-gray-soft text-tp-blue focus:ring-tp-blue/20"
                        />
                      </th>
                      <th className="px-5 py-3">Tracking</th>
                      <th className="px-5 py-3">Contenido</th>
                      <th className="px-5 py-3">Destino</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-gray-soft">
                    {paquetes.map((p) => (
                      <tr key={p.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedPaqueteIds.has(p.id) && "bg-tp-blue-light/20")}>
                        <td className="px-5 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedPaqueteIds.has(p.id)}
                            onChange={() => toggleSelectPaquete(p.id)}
                            className="rounded border-tp-gray-soft text-tp-blue focus:ring-tp-blue/20"
                          />
                        </td>
                        <td className="px-5 py-4 font-bold text-tp-blue">{p.tracking}</td>
                        <td className="px-5 py-4 text-tp-blue/70">{p.contenido || 'N/A'}</td>
                        <td className="px-5 py-4 text-tp-blue/70">{p.destino}</td>
                        <td className="px-5 py-4"><ChipEstado estado={p.estado} /></td>
                        <td className="px-5 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => prepararImpresion(p)}
                            className="p-2 text-tp-blue hover:bg-tp-blue-light rounded-lg transition-colors"
                            title="Imprimir Etiqueta"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openStatusModal(p)}
                            className="text-tp-blue hover:text-tp-red font-bold transition-colors"
                          >
                            Actualizar Estado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'despacho' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft text-center py-12">
              <Truck className="w-16 h-16 mx-auto text-tp-blue/20 mb-4" />
              <h2 className="text-xl font-bold text-tp-blue mb-2">Módulo de Despacho</h2>
              <p className="text-tp-blue/60 max-w-md mx-auto mb-6">
                Aquí podrás organizar los lotes, contenedores y guías aéreas/marítimas para el envío hacia Cuba.
              </p>
              <button className="bg-tp-blue hover:bg-[#004a78] text-white px-6 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2">
                <Plus className="w-5 h-5" /> Crear Nuevo Lote de Despacho
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedPaquete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Actualizar Estado: {selectedPaquete.tracking}</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              {selectedPaquete.estado === 'Incidencia' && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-tp-red mb-4">
                  <p className="font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Incidencia Actual:</p>
                  <p className="mt-1">{selectedPaquete.detallesIncidencia || 'No hay detalles registrados.'}</p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nuevo Estado</label>
                <select 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value)} 
                  className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none bg-white"
                >
                  <option value="Recepción">Recepción</option>
                  <option value="Validación">Validación</option>
                  <option value="Clasificado">Clasificado</option>
                  <option value="Consolidado">Consolidado</option>
                  <option value="Despacho">Despacho</option>
                  <option value="En Tránsito">En Tránsito</option>
                  <option value="Aduana Cuba">Aduana Cuba</option>
                  <option value="Almacén Cuba">Almacén Cuba</option>
                  <option value="En Reparto">En Reparto</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Incidencia">Incidencia</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Notas (Opcional)</label>
                <textarea 
                  rows={3} 
                  value={statusNotes} 
                  onChange={e => setStatusNotes(e.target.value)} 
                  placeholder="Añade un comentario sobre este cambio de estado..."
                  className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none"
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isUpdatingStatus} className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50">
                  {isUpdatingStatus ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
