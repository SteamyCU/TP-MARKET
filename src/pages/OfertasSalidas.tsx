import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeProfiles, updateProfileFields } from '../services/profiles';
import { Calendar, Tag, Plus, Trash2, Send, Bell, Building2, Users, Star, Save, RefreshCw, Clock } from 'lucide-react';
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

  useEffect(() => {
    const qOfertas = query(collection(db, 'ofertas'), orderBy('fechaCreacion', 'desc'));
    const unsubOfertas = onSnapshot(qOfertas, (snap) => {
      setOfertas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Oferta)));
    });

    const qSalidas = query(collection(db, 'salidas'), orderBy('fecha', 'asc'));
    const unsubSalidas = onSnapshot(qSalidas, (snap) => {
      setSalidas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salida)));
    });

    let unsubAgentes: () => void;
    let unsubPartners: () => void;
    let unsubPrecios: () => void;

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
      unsubPrecios = onSnapshot(doc(db, 'settings', 'precios'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setInfluencerPrice(data.influencer || 6);
          setGlobalB2BPrice(data.b2b_global || 5);
          setGlobalAgentePrice(data.agente_global || 5.5);
        }
      });
    }

    return () => {
      unsubOfertas();
      unsubSalidas();
      if (unsubAgentes) unsubAgentes();
      if (unsubPartners) unsubPartners();
      if (unsubPrecios) unsubPrecios();
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
      await updateDoc(doc(db, 'settings', 'precios'), { 
        influencer: influencerPrice,
        b2b_global: globalB2BPrice,
        agente_global: globalAgentePrice
      });

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
      await addDoc(collection(db, 'ofertas'), {
        titulo: nuevaOferta.titulo,
        descripcion: nuevaOferta.descripcion,
        precio: nuevaOferta.precio ? parseFloat(nuevaOferta.precio) : null,
        creadoPor: user?.uid,
        fechaCreacion: serverTimestamp()
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
      await addDoc(collection(db, 'salidas'), {
        fecha: nuevaSalida.fecha,
        destino: nuevaSalida.destino,
        estado: nuevaSalida.estado,
        tipoSalida: nuevaSalida.tipoSalida,
        creadoPor: user?.uid,
        fechaCreacion: serverTimestamp()
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
      await deleteDoc(doc(db, 'ofertas', id));
    }
  };

  const handleDeleteSalida = async (id: string) => {
    if (window.confirm('¿Eliminar esta salida?')) {
      await deleteDoc(doc(db, 'salidas', id));
    }
  };

  const handleNotifySalida = () => {
    alert("Se ha enviado un correo a todos los clientes con la actualización de las salidas.");
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm flex items-center justify-between group hover:border-tp-blue/20 transition-all hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tp-blue-light text-tp-blue rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-tp-blue text-base">B2B Global</h3>
                      <p className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-tighter">Precio Mayorista</p>
                    </div>
                  </div>
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">€</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={globalB2BPrice}
                      onChange={e => setGlobalB2BPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 text-right bg-gray-50 border-2 border-transparent focus:border-tp-blue/20 rounded-lg focus:outline-none font-bold text-lg text-tp-blue transition-all"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm flex items-center justify-between group hover:border-tp-red/20 transition-all hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tp-red/10 text-tp-red rounded-xl flex items-center justify-center group-hover:-rotate-6 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-tp-blue text-base">Red Externa</h3>
                      <p className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-tighter">Agentes/Influencers</p>
                    </div>
                  </div>
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">€</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={globalAgentePrice}
                      onChange={e => setGlobalAgentePrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 text-right bg-gray-50 border-2 border-transparent focus:border-tp-red/20 rounded-lg focus:outline-none font-bold text-lg text-tp-blue transition-all"
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
                      )}

                      {activePriceTab === 'partners' && (
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
                      )}

                      {activePriceTab === 'influencers' && (
                        <div className="max-w-lg mx-auto py-12 text-center space-y-8">
                          <motion.div 
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 5 }}
                            className="w-24 h-24 bg-tp-red/10 text-tp-red rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"
                          >
                            <Star className="w-12 h-12" />
                          </motion.div>
                          <div>
                            <h3 className="text-3xl font-black text-tp-blue mb-4 tracking-tight">Tarifa Base Influencers</h3>
                            <p className="text-tp-blue/60 mb-8 font-medium">Este precio se aplica automáticamente a todos los influencers registrados en el programa de afiliados.</p>
                            <div className="relative w-64 mx-auto">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-tp-blue/30 font-black text-2xl">€</span>
                              <input 
                                type="number" 
                                step="0.01"
                                value={influencerPrice}
                                onChange={e => setInfluencerPrice(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-6 text-center bg-gray-50 border-4 border-white focus:border-tp-red/10 rounded-[2rem] focus:outline-none font-black text-4xl text-tp-blue shadow-2xl transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
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
    </div>
  );
}
