import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { subscribeProfiles, updateProfileFields } from '../services/profiles';
import { getSetting, setSetting } from '../services/settings';
import {
  subscribeOfertas, crearOferta, eliminarOferta,
  subscribeSalidas, crearSalida, eliminarSalida,
} from '../services/ofertasSalidas';
import {
  getTarifasEnvio, getTarifasTransporte, deleteTarifaEnvio, deleteTarifaTransporte,
  TarifaEnvio, TarifaTransporteCuba,
} from '../services/tarifas';
import { TarifaEnvioFormModal } from '../components/TarifaEnvioFormModal';
import { TarifaTransporteFormModal } from '../components/TarifaTransporteFormModal';
import { Calendar, Tag, Plus, Trash2, Send, Bell, Building2, Users, Star, Save, RefreshCw, Clock, Pencil, MapPin, Truck, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

import { motion, AnimatePresence } from 'motion/react';

interface Oferta {
  id: string;
  titulo: string;
  descripcion: string;
  precio?: number;
  creadoPor: string;
  fechaCreacion: any;
}

interface Salida {
  id: string;
  fecha: string;
  destino: string;
  estado: string;
  tipoSalida: 'aerea' | 'express';
  creadoPor: string;
  fechaCreacion: any;
}

interface TarifaBaseCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  value: number;
  onChange: (value: number) => void;
}

/** Tarjeta compacta y reutilizable para una tarifa base (€/kg) por rol. */
function TarifaBaseCard({ icon: Icon, title, subtitle, value, onChange }: TarifaBaseCardProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-tp-gray-soft hover:border-tp-red/30 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-tp-red/10 text-tp-red rounded-2xl flex items-center justify-center shadow-lg shadow-tp-red/10 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-black text-tp-blue">{title}</p>
          <p className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      <div className="relative w-32">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tp-blue/30 font-black text-sm">€</span>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full pl-8 pr-4 py-3 text-right bg-white border-2 border-transparent focus:border-tp-red/20 rounded-2xl focus:outline-none font-black text-tp-blue transition-all shadow-sm"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

export function OfertasSalidas() {
  const { role, user } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [salidas, setSalidas] = useState<Salida[]>([]);
  
  const [nuevaOferta, setNuevaOferta] = useState({ titulo: '', descripcion: '', precio: '' });
  const [nuevaSalida, setNuevaSalida] = useState({ fecha: '', destino: '', estado: 'Programada', tipoSalida: 'aerea' as 'aerea' | 'express' });

  const [isSubmittingOferta, setIsSubmittingOferta] = useState(false);
  const [isSubmittingSalida, setIsSubmittingSalida] = useState(false);

  // Price Management State
  const [agentes, setAgentes] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [influencerPrice, setInfluencerPrice] = useState<number>(6);
  const [globalB2BPrice, setGlobalB2BPrice] = useState<number>(5);
  const [globalAgentePrice, setGlobalAgentePrice] = useState<number>(5.5);
  const [preciosAgentes, setPreciosAgentes] = useState<Record<string, string>>({});
  const [preciosPartners, setPreciosPartners] = useState<Record<string, string>>({});
  const [isSavingPrecios, setIsSavingPrecios] = useState(false);
  const [activePriceTab, setActivePriceTab] = useState<'agentes' | 'partners' | 'influencers'>('agentes');

  // Tarifas y Precios (sistema de tarifas dinámicas)
  const [tarifasEnvio, setTarifasEnvio] = useState<TarifaEnvio[]>([]);
  const [tarifasTransporte, setTarifasTransporte] = useState<TarifaTransporteCuba[]>([]);
  const [loadingTarifas, setLoadingTarifas] = useState(true);
  const [envioModalOpen, setEnvioModalOpen] = useState(false);
  const [envioModalTarifa, setEnvioModalTarifa] = useState<TarifaEnvio | null>(null);
  const [transporteModalOpen, setTransporteModalOpen] = useState(false);
  const [transporteModalTarifa, setTransporteModalTarifa] = useState<TarifaTransporteCuba | null>(null);

  const reloadTarifas = async () => {
    setLoadingTarifas(true);
    try {
      const [envio, transporte] = await Promise.all([getTarifasEnvio(), getTarifasTransporte()]);
      setTarifasEnvio(envio);
      setTarifasTransporte(transporte);
    } catch (error) {
      console.error('Error cargando tarifas:', error);
    } finally {
      setLoadingTarifas(false);
    }
  };

  useEffect(() => {
    const unsubOfertas = subscribeOfertas((data) => {
      setOfertas(data as unknown as Oferta[]);
    });

    const unsubSalidas = subscribeSalidas((data) => {
      setSalidas(data as unknown as Salida[]);
    });

    let unsubAgentes: () => void;
    let unsubPartners: () => void;

    if (role === 'admin') {
      // Fetch Agents
      unsubAgentes = subscribeProfiles({ role: 'agente' }, (ags) => {
        setAgentes(ags as any[]);
        setPreciosAgentes(prev => {
          const next = { ...prev };
          ags.forEach(ag => {
            if (next[ag.id] === undefined) next[ag.id] = (ag.precioPorKilo as number)?.toString() || '';
          });
          return next;
        });
      });

      // Fetch B2B Partners
      unsubPartners = subscribeProfiles({ role: 'partner' }, (pts) => {
        setPartners(pts as any[]);
        setPreciosPartners(prev => {
          const next = { ...prev };
          pts.forEach(pt => {
            if (next[pt.id] === undefined) next[pt.id] = (pt.precioPorKilo as number)?.toString() || '';
          });
          return next;
        });
      });

      // Fetch Global Prices
      getSetting<{ influencer?: number; b2b_global?: number; agente_global?: number }>('precios').then((data) => {
        if (data) {
          setInfluencerPrice(data.influencer || 6);
          setGlobalB2BPrice(data.b2b_global || 5);
          setGlobalAgentePrice(data.agente_global || 5.5);
        }
      });

      // Fetch Tarifas de envío y transporte
      reloadTarifas();
    }

    return () => {
      unsubOfertas();
      unsubSalidas();
      if (unsubAgentes) unsubAgentes();
      if (unsubPartners) unsubPartners();
    };
  }, [role]);

  const handleSaveAllPrices = async () => {
    setIsSavingPrecios(true);
    try {
      // Save Agents
      for (const ag of agentes) {
        const val = parseFloat(preciosAgentes[ag.id]);
        if (!isNaN(val) && val !== ag.precioPorKilo) {
          await updateProfileFields(ag.id, { precioPorKilo: val });
        }
      }

      // Save Partners
      for (const pt of partners) {
        const val = parseFloat(preciosPartners[pt.id]);
        if (!isNaN(val) && val !== pt.precioPorKilo) {
          await updateProfileFields(pt.id, { precioPorKilo: val });
        }
      }

      // Save Global Prices
      await setSetting('precios', {
        influencer: influencerPrice,
        b2b_global: globalB2BPrice,
        agente_global: globalAgentePrice
      }, true);

      alert('Todos los precios han sido actualizados correctamente.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    } finally {
      setIsSavingPrecios(false);
    }
  };

  const handleAddOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaOferta.titulo || !nuevaOferta.descripcion) return;
    setIsSubmittingOferta(true);
    try {
      await crearOferta({
        titulo: nuevaOferta.titulo,
        descripcion: nuevaOferta.descripcion,
        precio: nuevaOferta.precio ? parseFloat(nuevaOferta.precio) : null,
        creadoPor: user?.uid,
      });
      setNuevaOferta({ titulo: '', descripcion: '', precio: '' });
      alert("Oferta publicada. Los clientes recibirán una notificación.");
    } catch (error) {
      console.error("Error adding oferta:", error);
    } finally {
      setIsSubmittingOferta(false);
    }
  };

  const handleAddSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaSalida.fecha || !nuevaSalida.destino) return;
    setIsSubmittingSalida(true);
    try {
      await crearSalida({
        fecha: nuevaSalida.fecha,
        destino: nuevaSalida.destino,
        estado: nuevaSalida.estado,
        tipoSalida: nuevaSalida.tipoSalida,
        creadoPor: user?.uid,
      });
      setNuevaSalida({ fecha: '', destino: '', estado: 'Programada', tipoSalida: 'aerea' });
    } catch (error) {
      console.error("Error adding salida:", error);
    } finally {
      setIsSubmittingSalida(false);
    }
  };

  const handleDeleteOferta = async (id: string) => {
    if (window.confirm('¿Eliminar esta oferta?')) {
      await eliminarOferta(id);
    }
  };

  const handleDeleteSalida = async (id: string) => {
    if (window.confirm('¿Eliminar esta salida?')) {
      await eliminarSalida(id);
    }
  };

  const handleNotifySalida = () => {
    alert("Se ha enviado un correo a todos los clientes con la actualización de las salidas.");
  };

  const handleDeleteTarifaEnvio = async (id: string) => {
    if (!window.confirm('¿Eliminar este tramo de precio?')) return;
    try {
      await deleteTarifaEnvio(id);
      await reloadTarifas();
    } catch (error) {
      console.error('Error eliminando tarifa de envío:', error);
      alert('No se pudo eliminar el tramo.');
    }
  };

  const handleDeleteTarifaTransporte = async (id: string) => {
    if (!window.confirm('¿Eliminar este grupo provincial?')) return;
    try {
      await deleteTarifaTransporte(id);
      await reloadTarifas();
    } catch (error) {
      console.error('Error eliminando tarifa de transporte:', error);
      alert('No se pudo eliminar el grupo.');
    }
  };

  const canEditOfertas = role === 'agente';
  const canEditSalidas = role === 'admin' || role === 'agente';

  return (
    <div className="space-y-8">
      <div className="relative bg-tp-blue rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden shadow-2xl shadow-tp-blue/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-tp-red/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none"
            >
              Ofertas y <span className="text-tp-red">Salidas</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-lg md:text-xl font-medium leading-relaxed"
            >
              Central de operaciones para la gestión de tarifas globales y programación de expediciones logísticas.
            </motion.p>
          </div>
          <div className="flex flex-row md:flex-col gap-4">
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 min-w-[140px] text-center">
              <div className="text-4xl font-black mb-1">{salidas.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Salidas</div>
            </div>
            <div className="bg-tp-red p-6 rounded-[2rem] shadow-lg shadow-tp-red/30 min-w-[140px] text-center">
              <div className="text-4xl font-black mb-1">{ofertas.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Ofertas</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {/* Top Section: Central de Precios (Admin) or Ofertas (Others) */}
        <div className="space-y-8">
          {role === 'admin' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-tp-red text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-tp-red/20">
                    <Tag className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-tp-blue">Central de Precios</h2>
                    <p className="text-[10px] text-tp-blue/40 font-black uppercase tracking-widest">Actualización masiva de tarifas</p>
                  </div>
                </div>
                <button 
                  onClick={handleSaveAllPrices}
                  disabled={isSavingPrecios}
                  className="bg-tp-blue hover:bg-[#004a78] text-white px-10 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xl shadow-tp-blue/30 active:scale-95 group"
                >
                  {isSavingPrecios ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  {isSavingPrecios ? 'Guardando...' : 'Aplicar Cambios'}
                </button>
              </div>

              {/* Global Price Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white h-20 px-4 rounded-xl border border-tp-gray-soft shadow-sm flex items-center justify-between gap-3 hover:border-tp-blue/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-tp-blue-light text-tp-blue rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-tp-blue text-xs truncate">B2B Global</h3>
                      <p className="text-[9px] text-tp-blue/40 font-bold uppercase tracking-tighter truncate">Precio Mayorista</p>
                    </div>
                  </div>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={globalB2BPrice}
                      onChange={e => setGlobalB2BPrice(Number(e.target.value))}
                      className="w-full pl-6 pr-2 py-1.5 text-right bg-gray-50 border-2 border-transparent focus:border-tp-blue/20 rounded-lg focus:outline-none font-bold text-sm text-tp-blue transition-all"
                    />
                  </div>
                </div>

                <div className="bg-white h-20 px-4 rounded-xl border border-tp-gray-soft shadow-sm flex items-center justify-between gap-3 hover:border-tp-red/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-tp-red/10 text-tp-red rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-tp-blue text-xs truncate">Red Externa</h3>
                      <p className="text-[9px] text-tp-blue/40 font-bold uppercase tracking-tighter truncate">Agentes/Influencers</p>
                    </div>
                  </div>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={globalAgentePrice}
                      onChange={e => setGlobalAgentePrice(Number(e.target.value))}
                      className="w-full pl-6 pr-2 py-1.5 text-right bg-gray-50 border-2 border-transparent focus:border-tp-red/20 rounded-lg focus:outline-none font-bold text-sm text-tp-blue transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-tp-gray-soft shadow-2xl overflow-hidden">
                <div className="flex border-b border-tp-gray-soft bg-gray-50/50 p-3 gap-3">
                  {[
                    { id: 'agentes', label: 'Agentes', icon: Users },
                    { id: 'partners', label: 'Partners B2B', icon: Building2 },
                    { id: 'influencers', label: 'Influencers', icon: Star },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivePriceTab(tab.id as any)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black transition-all",
                        activePriceTab === tab.id 
                          ? "bg-white text-tp-blue shadow-lg border border-tp-gray-soft" 
                          : "text-tp-blue/40 hover:text-tp-blue hover:bg-white/50"
                      )}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePriceTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activePriceTab === 'agentes' && (
                        <div className="space-y-6">
                          <TarifaBaseCard
                            icon={Users}
                            title="Tarifa Base Agentes"
                            subtitle="Aplica a agentes sin tarifa personalizada"
                            value={globalAgentePrice}
                            onChange={setGlobalAgentePrice}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {agentes.map(agente => (
                            <div key={agente.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-tp-gray-soft hover:border-tp-blue/30 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-tp-blue text-white rounded-2xl flex items-center justify-center font-black text-lg italic shadow-lg shadow-tp-blue/20 group-hover:scale-110 transition-transform">
                                  {agente.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <p className="font-black text-tp-blue">{agente.name || 'Sin nombre'}</p>
                                  <p className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-widest">{agente.email}</p>
                                </div>
                              </div>
                              <div className="relative w-32">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tp-blue/30 font-black text-sm">€</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={preciosAgentes[agente.id] || ''}
                                  onChange={e => setPreciosAgentes({...preciosAgentes, [agente.id]: e.target.value})}
                                  className="w-full pl-8 pr-4 py-3 text-right bg-white border-2 border-transparent focus:border-tp-blue/20 rounded-2xl focus:outline-none font-black text-tp-blue transition-all shadow-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          ))}
                          </div>
                        </div>
                      )}

                      {activePriceTab === 'partners' && (
                        <div className="space-y-6">
                          <TarifaBaseCard
                            icon={Building2}
                            title="Tarifa Base Partners B2B"
                            subtitle="Aplica a partners sin tarifa personalizada"
                            value={globalB2BPrice}
                            onChange={setGlobalB2BPrice}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {partners.map(partner => (
                            <div key={partner.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-tp-gray-soft hover:border-tp-blue/30 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-tp-blue text-white rounded-2xl flex items-center justify-center font-black text-lg italic shadow-lg shadow-tp-blue/20 group-hover:scale-110 transition-transform">
                                  {partner.businessName?.charAt(0) || 'P'}
                                </div>
                                <div>
                                  <p className="font-black text-tp-blue">{partner.businessName || 'Sin nombre'}</p>
                                  <p className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-widest">{partner.email}</p>
                                </div>
                              </div>
                              <div className="relative w-32">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tp-blue/30 font-black text-sm">€</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={preciosPartners[partner.id] || ''}
                                  onChange={e => setPreciosPartners({...preciosPartners, [partner.id]: e.target.value})}
                                  className="w-full pl-8 pr-4 py-3 text-right bg-white border-2 border-transparent focus:border-tp-blue/20 rounded-2xl focus:outline-none font-black text-tp-blue transition-all shadow-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          ))}
                          </div>
                        </div>
                      )}

                      {activePriceTab === 'influencers' && (
                        <TarifaBaseCard
                          icon={Star}
                          title="Tarifa Base Influencers"
                          subtitle="Aplica a todos los influencers"
                          value={influencerPrice}
                          onChange={setInfluencerPrice}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Tarifas y Precios */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-tp-blue text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-tp-blue/20">
                    <Truck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-tp-blue">Tarifas y Precios</h2>
                    <p className="text-[10px] text-tp-blue/40 font-black uppercase tracking-widest">Calculadora pública de la landing</p>
                  </div>
                </div>

                {loadingTarifas ? (
                  <div className="bg-white p-16 rounded-[3rem] border-2 border-tp-gray-soft border-dashed text-center">
                    <RefreshCw className="w-10 h-10 text-tp-blue/20 mx-auto mb-4 animate-spin" />
                    <p className="text-tp-blue/40 italic font-bold">Cargando tarifas...</p>
                  </div>
                ) : (
                  <>
                    {/* Sección A: Precios de Envío */}
                    <div className="bg-white rounded-[2.5rem] border border-tp-gray-soft shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
                        <h3 className="font-black text-tp-blue text-lg">Precios de Envío (Regular / Express)</h3>
                        <button
                          onClick={() => { setEnvioModalTarifa(null); setEnvioModalOpen(true); }}
                          className="flex items-center gap-2 text-xs bg-tp-red text-white px-5 py-2.5 rounded-full font-black hover:bg-[#D91F33] transition-all shadow-sm active:scale-95"
                        >
                          <Plus className="w-4 h-4" /> Añadir tramo
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[10px] font-black text-tp-blue/40 uppercase tracking-widest bg-gray-50">
                              <th className="px-6 py-3">Modalidad</th>
                              <th className="px-6 py-3">Peso mínimo (kg)</th>
                              <th className="px-6 py-3">Peso máximo (kg)</th>
                              <th className="px-6 py-3">€/kg</th>
                              <th className="px-6 py-3">Estado</th>
                              <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tarifasEnvio.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-tp-blue/40 italic font-bold">No hay tramos configurados.</td>
                              </tr>
                            ) : (
                              tarifasEnvio.map(tarifa => (
                                <tr key={tarifa.id} className="border-t border-tp-gray-soft hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className={cn(
                                      "text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 tracking-widest",
                                      tarifa.modalidad === 'express'
                                        ? "border-tp-red text-tp-red bg-tp-red/5"
                                        : "border-tp-blue text-tp-blue bg-tp-blue/5"
                                    )}>
                                      {tarifa.modalidad === 'express' ? 'Express' : 'Regular'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-tp-blue">{tarifa.peso_min}</td>
                                  <td className="px-6 py-4 font-bold text-tp-blue">{tarifa.peso_max === null ? 'Sin límite' : tarifa.peso_max}</td>
                                  <td className="px-6 py-4 font-black text-tp-blue">€{tarifa.precio_kg.toFixed(2)}</td>
                                  <td className="px-6 py-4">
                                    {tarifa.activo ? (
                                      <span className="text-[10px] font-black uppercase text-green-600">Activo</span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase text-tp-blue/30">Inactivo</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => { setEnvioModalTarifa(tarifa); setEnvioModalOpen(true); }}
                                        className="p-2 text-tp-blue/40 hover:text-tp-blue hover:bg-tp-blue-light/30 rounded-lg transition-colors"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTarifaEnvio(tarifa.id)}
                                        className="p-2 text-tp-blue/40 hover:text-tp-red hover:bg-tp-red/5 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sección B: Transporte Provincial Cuba */}
                    <div className="bg-white rounded-[2.5rem] border border-tp-gray-soft shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
                        <h3 className="font-black text-tp-blue text-lg">Transporte Provincial Cuba</h3>
                        <button
                          onClick={() => { setTransporteModalTarifa(null); setTransporteModalOpen(true); }}
                          className="flex items-center gap-2 text-xs bg-tp-red text-white px-5 py-2.5 rounded-full font-black hover:bg-[#D91F33] transition-all shadow-sm active:scale-95"
                        >
                          <Plus className="w-4 h-4" /> Añadir grupo
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[10px] font-black text-tp-blue/40 uppercase tracking-widest bg-gray-50">
                              <th className="px-6 py-3">Provincias</th>
                              <th className="px-6 py-3">€/kg recargo</th>
                              <th className="px-6 py-3">Estado</th>
                              <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tarifasTransporte.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-tp-blue/40 italic font-bold">No hay grupos configurados.</td>
                              </tr>
                            ) : (
                              tarifasTransporte.map(grupo => (
                                <tr key={grupo.id} className="border-t border-tp-gray-soft hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5 max-w-md">
                                      {grupo.provincias.map(provincia => (
                                        <span key={provincia} className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-tp-blue-light text-tp-blue tracking-wide">
                                          {provincia}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-black text-tp-blue">€{grupo.precio_kg.toFixed(2)}</td>
                                  <td className="px-6 py-4">
                                    {grupo.activo ? (
                                      <span className="text-[10px] font-black uppercase text-green-600">Activo</span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase text-tp-blue/30">Inactivo</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => { setTransporteModalTarifa(grupo); setTransporteModalOpen(true); }}
                                        className="p-2 text-tp-blue/40 hover:text-tp-blue hover:bg-tp-blue-light/30 rounded-lg transition-colors"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTarifaTransporte(grupo.id)}
                                        className="p-2 text-tp-blue/40 hover:text-tp-red hover:bg-tp-red/5 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (

            <div className="space-y-6">
                {ofertas.length === 0 ? (
                  <div className="bg-white p-16 rounded-[3rem] border-2 border-tp-gray-soft border-dashed text-center">
                    <Tag className="w-16 h-16 text-tp-blue/10 mx-auto mb-6" />
                    <p className="text-tp-blue/40 italic font-bold text-lg">No hay ofertas disponibles en este momento.</p>
                  </div>
                ) : (
                  ofertas.map((oferta, i) => (
                    <motion.div 
                      key={oferta.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-sm relative group hover:shadow-2xl hover:border-tp-red/20 transition-all overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-tp-red/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                      
                      {canEditOfertas && (
                        <button onClick={() => handleDeleteOferta(oferta.id)} className="absolute top-6 right-6 text-tp-blue/10 hover:text-tp-red transition-colors z-10">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10">
                        <div className="space-y-2">
                          <h3 className="font-black text-3xl text-tp-blue group-hover:text-tp-red transition-colors tracking-tight">{oferta.titulo}</h3>
                          <div className="flex items-center gap-3 text-[10px] font-black text-tp-blue/30 uppercase tracking-[0.2em]">
                            <Clock className="w-4 h-4" /> {new Date(oferta.fechaCreacion?.seconds * 1000).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        {oferta.precio && (
                          <div className="bg-tp-red text-white px-8 py-3 rounded-2xl font-black text-2xl shadow-xl shadow-tp-red/20 self-start sm:self-auto">
                            €{oferta.precio}
                          </div>
                        )}
                      </div>
                      <p className="text-tp-blue/60 leading-relaxed font-medium text-lg relative z-10">{oferta.descripcion}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>

        {/* Bottom Section: Salidas */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-tp-red text-white rounded-2xl flex items-center justify-center shadow-lg shadow-tp-red/20">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-tp-blue">Próximas Salidas</h2>
            </div>
            {canEditSalidas && (
              <button onClick={handleNotifySalida} className="flex items-center gap-2 text-xs bg-tp-blue-light text-tp-blue px-5 py-2.5 rounded-full font-black hover:bg-tp-blue hover:text-white transition-all shadow-sm active:scale-95">
                <Send className="w-4 h-4" /> Notificar Red
              </button>
            )}
          </div>

          {canEditSalidas && (
            <form onSubmit={handleAddSalida} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-xl space-y-8">
              <h3 className="font-black text-tp-blue uppercase text-xs tracking-widest mb-2">Programar Expedición</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tp-blue/40 uppercase ml-4 tracking-widest">Fecha de Salida</label>
                    <input 
                      type="date" 
                      required
                      value={nuevaSalida.fecha}
                      onChange={e => setNuevaSalida({...nuevaSalida, fecha: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-tp-blue/20 rounded-2xl focus:outline-none font-bold text-tp-blue transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tp-blue/40 uppercase ml-4 tracking-widest">Destino</label>
                    <input 
                      type="text" 
                      placeholder="Ej: La Habana" 
                      required
                      value={nuevaSalida.destino}
                      onChange={e => setNuevaSalida({...nuevaSalida, destino: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-tp-blue/20 rounded-2xl focus:outline-none font-bold text-tp-blue transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tp-blue/40 uppercase ml-4 tracking-widest">Tipo de Servicio</label>
                  <select
                    value={nuevaSalida.tipoSalida}
                    onChange={e => setNuevaSalida({...nuevaSalida, tipoSalida: e.target.value as any})}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-tp-blue/20 rounded-2xl focus:outline-none font-black text-tp-blue transition-all appearance-none cursor-pointer"
                  >
                    <option value="aerea">Salida Aérea Estándar</option>
                    <option value="express">Salida Express (Agentes/Influencers)</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingSalida}
                className="w-full bg-tp-red text-white py-5 rounded-[1.5rem] font-black hover:bg-[#D91F33] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-tp-red/30 active:scale-95"
              >
                <Plus className="w-6 h-6" /> Confirmar Expedición
              </button>
            </form>
          )}

          <div className="space-y-4">
            {salidas.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] border-2 border-tp-gray-soft border-dashed text-center">
                <Calendar className="w-16 h-16 text-tp-blue/10 mx-auto mb-6" />
                <p className="text-tp-blue/40 italic font-bold text-lg">No hay salidas programadas.</p>
              </div>
            ) : (
              salidas.map((salida, i) => (
                <motion.div 
                  key={salida.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-[2rem] border border-tp-gray-soft shadow-sm flex items-center justify-between group hover:border-tp-blue/40 transition-all hover:shadow-xl"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-tp-blue text-white w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center font-black shadow-xl shadow-tp-blue/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <span className="text-[10px] uppercase opacity-60 tracking-widest">{new Date(salida.fecha).toLocaleString('es', { month: 'short' })}</span>
                      <span className="text-2xl leading-none">{new Date(salida.fecha).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-tp-blue text-xl group-hover:text-tp-red transition-colors">{salida.destino}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-2 px-3 py-1 bg-tp-blue-light text-tp-blue rounded-full text-[10px] font-black uppercase tracking-widest">
                          <div className="w-2 h-2 bg-tp-blue rounded-full animate-pulse"></div>
                          {salida.estado}
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 tracking-widest",
                          salida.tipoSalida === 'express' 
                            ? "border-tp-red text-tp-red bg-tp-red/5" 
                            : "border-tp-blue text-tp-blue bg-tp-blue/5"
                        )}>
                          {salida.tipoSalida === 'express' ? 'Express' : 'Aérea'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {canEditSalidas && (
                    <button onClick={() => handleDeleteSalida(salida.id)} className="text-tp-blue/10 hover:text-tp-red p-3 transition-colors">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <TarifaEnvioFormModal
        open={envioModalOpen}
        tarifa={envioModalTarifa}
        onClose={() => setEnvioModalOpen(false)}
        onSaved={reloadTarifas}
      />
      <TarifaTransporteFormModal
        open={transporteModalOpen}
        tarifa={transporteModalTarifa}
        onClose={() => setTransporteModalOpen(false)}
        onSaved={reloadTarifas}
      />
    </div>
  );
}
