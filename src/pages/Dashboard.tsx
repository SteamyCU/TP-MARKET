import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, AlertCircle, CheckCircle2, Clock, ArrowRight, Users, Wallet, Search, Box, Calculator, Newspaper, TrendingUp, Zap, Building2, Star, ChevronRight } from 'lucide-react';
import { ChipEstado } from '../components/ChipEstado';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { subscribeProfiles, getProfile } from '../services/profiles';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { InfluencerDashboard } from '../components/dashboard/InfluencerDashboard';
import { PartnerB2BDashboard } from '../components/dashboard/PartnerB2BDashboard';
import { PuntoPackDashboard } from '../components/dashboard/PuntoPackDashboard';

export function Dashboard() {
  const { role, user, profile } = useAuth();
  const navigate = useNavigate();
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [totalKilos, setTotalKilos] = useState(0);
  const [lotes, setLotes] = useState<any[]>([]);
  const [trackingInput, setTrackingInput] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [comisionesRecientes, setComisionesRecientes] = useState<any[]>([]);
  const [currentPerformanceSlide, setCurrentPerformanceSlide] = useState(0);
  
  // Calculator state
  const [precioPorKilo, setPrecioPorKilo] = useState(5.00);
  
  // Admin Stats
  const [adminStats, setAdminStats] = useState({
    totalInfluencers: 0,
    totalPartners: 0,
    totalAgentes: 0,
    totalClientes: 0,
    b2bPackages: 0,
    b2bWeight: 0,
    b2bRevenue: 0,
    influencerReferrals: 0,
    influencerCommissions: 0,
    influencerWeight: 0,
    agentePackages: 0,
    agenteWeight: 0,
    agenteCommissions: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    let isMounted = true;
    let unsubscribePaquetes: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeLotes: (() => void) | undefined;

    if (role === 'admin') {
      unsubscribeLotes = onSnapshot(query(collection(db, 'lotes')), (snap) => {
        if (isMounted) setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Fetch all users for stats
      unsubscribeUsers = subscribeProfiles({}, (profiles) => {
        let influencers = 0;
        let partners = 0;
        let agentes = 0;
        let clientes = 0;
        profiles.forEach(u => {
          if (u.role === 'influencer') influencers++;
          else if (u.role === 'partner') partners++;
          else if (u.role === 'agente') agentes++;
          else if (u.role === 'cliente') clientes++;
        });
        if (isMounted) {
          setAdminStats(prev => ({
            ...prev,
            totalInfluencers: influencers,
            totalPartners: partners,
            totalAgentes: agentes,
            totalClientes: clientes
          }));
        }
      });

      const qPaquetes = query(collection(db, 'paquetes'), orderBy('createdAt', 'desc'));
      unsubscribePaquetes = onSnapshot(qPaquetes, (snapshot) => {
        const data: any[] = [];
        let kilos = 0;
        let b2bPkgs = 0;
        let b2bW = 0;
        let b2bRev = 0;
        let infRefs = 0;
        let infComs = 0;
        let infW = 0;
        let agPkgs = 0;
        let agW = 0;
        let agComs = 0;
        let totalRev = 0;

        snapshot.forEach((doc) => {
          const p = { id: doc.id, ...doc.data() } as any;
          data.push(p);
          kilos += (p.peso || 0);
          totalRev += (p.costoTotal || 0);
          
          if (p.partnerId) {
            b2bPkgs++;
            b2bW += (p.peso || 0);
            b2bRev += (p.costoTotal || 0);
          } else if (p.referidoPorRole === 'influencer') {
            infRefs++;
            infComs += (p.montoComision || 0);
            infW += (p.peso || 0);
          } else if (p.referidoPorRole === 'agente' || p.agenteId) {
            agPkgs++;
            agW += (p.peso || 0);
            agComs += (p.montoComision || 0);
          }
        });
        if (isMounted) {
          setPaquetes(data);
          setTotalKilos(kilos);
          setAdminStats(prev => ({
            ...prev,
            b2bPackages: b2bPkgs,
            b2bWeight: b2bW,
            b2bRevenue: b2bRev,
            influencerReferrals: infRefs,
            influencerCommissions: infComs,
            influencerWeight: infW,
            agentePackages: agPkgs,
            agenteWeight: agW,
            agenteCommissions: agComs,
            totalRevenue: totalRev
          }));
        }
      });
    } else if (role === 'agente') {
        getProfile(user.uid).then((p) => {
          if (p && isMounted) {
            setUserData(p);
          }
        });

        const qComisiones = query(
          collection(db, 'paquetes'), 
          where('referidoPor', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        onSnapshot(qComisiones, (snap) => {
          const coms: any[] = [];
          snap.forEach(d => coms.push({ id: d.id, ...d.data() }));
          if (isMounted) setComisionesRecientes(coms);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'paquetes (comisiones)');
          console.error("Error in comisiones snapshot:", error);
        });
    } else if (role === 'cliente' && user?.email) {
      const fetchClientPackages = async () => {
        try {
          const qClient = query(collection(db, 'clientes'), where('email', '==', user.email));
          const clientSnap = await getDocs(qClient);
          if (!clientSnap.empty && isMounted) {
            const clienteDoc = clientSnap.docs[0];
            const clienteId = clienteDoc.id;
            const clienteData = clienteDoc.data();
            
            if (clienteData.agenteId && clienteData.agenteId !== 'self') {
              try {
                const agent = await getProfile(clienteData.agenteId);
                if (agent && agent.precioPorKilo && isMounted) {
                  setPrecioPorKilo(agent.precioPorKilo as number);
                }
              } catch (e) {
                console.error("Error fetching agent price", e);
              }
            }

            if (isMounted) {
              const qPaquetes = query(collection(db, 'paquetes'), where('clienteId', '==', clienteId), orderBy('createdAt', 'desc'));
              unsubscribePaquetes = onSnapshot(qPaquetes, (snapshot) => {
                const data: any[] = [];
                snapshot.forEach((doc) => {
                  data.push({ id: doc.id, ...doc.data() });
                });
                if (isMounted) {
                  setPaquetes(data);
                }
              }, (error) => {
                handleFirestoreError(error, OperationType.LIST, 'paquetes (client)');
                console.error("Error in client paquetes snapshot:", error);
              });
            }
          }
        } catch (error) {
          console.error("Error fetching client packages:", error);
        }
      };
      fetchClientPackages();
    }

    return () => {
      isMounted = false;
      if (unsubscribePaquetes) {
        unsubscribePaquetes();
      }
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
      if (unsubscribeLotes) {
        unsubscribeLotes();
      }
    };
  }, [role, user]);

  if (role === 'admin') {
    const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
    const registradosHoy = paquetes.filter(p => (p.createdAt?.toDate?.()?.getTime() || 0) >= inicioHoy.getTime()).length;
    const pendientesPago = paquetes.filter(p => (p.importePendiente || 0) > 0).length;
    const incidenciasAbiertas = paquetes.filter(p => p.estado === 'Incidencia').length;
    const lotesActivos = lotes.filter(l => ['Abierto', 'Cerrado', 'En Tránsito'].includes(l.estado)).length;
    const entregasPendientes = paquetes.filter(p => ['En Reparto', 'Disponible para recogida'].includes(p.estado)).length;
    const conteoEstados: Record<string, number> = {};
    for (const p of paquetes) {
      const e = p.estado || 'Sin estado';
      conteoEstados[e] = (conteoEstados[e] || 0) + 1;
    }
    const porEstado = Object.entries(conteoEstados).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-6">
        <div className="bg-tp-blue rounded-2xl p-8 text-white">
          <h1 className="text-2xl font-bold mb-2">Panel de Administración Global</h1>
          <p className="text-white/70">Bienvenido, {user?.displayName}. Aquí tienes el resumen de toda la red logística.</p>
        </div>

        {/* Operativa de hoy */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Registrados Hoy', value: registradosHoy, color: 'text-tp-blue', path: '/dashboard/recepcion' },
            { label: 'Pendientes de Pago', value: pendientesPago, color: 'text-amber-600', path: '/dashboard/pagos' },
            { label: 'Incidencias Abiertas', value: incidenciasAbiertas, color: 'text-tp-red', path: '/dashboard/logistica' },
            { label: 'Lotes Activos', value: lotesActivos, color: 'text-purple-600', path: '/dashboard/logistica' },
            { label: 'Entregas Pendientes', value: entregasPendientes, color: 'text-teal-600', path: '/dashboard/logistica' },
          ].map(kpi => (
            <Link key={kpi.label} to={kpi.path} className="bg-white p-4 rounded-2xl border border-tp-gray-soft hover:shadow-md hover:border-tp-blue/20 transition-all">
              <div className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</div>
              <div className="text-[10px] text-tp-blue/50 font-bold uppercase tracking-wider mt-1">{kpi.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { label: 'Ingresos Totales', value: `€${adminStats.totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-green-500', path: '/dashboard/contabilidad' },
            { label: 'Agentes Activos', value: adminStats.totalAgentes.toString(), icon: Users, color: 'text-blue-500', path: '/dashboard/negocios' },
            { label: 'Paquetes en Tránsito', value: paquetes.length.toString(), icon: Package, color: 'text-tp-red' },
            { label: 'Kilos Recepcionados', value: `${totalKilos.toFixed(2)} kg`, icon: Box, color: 'text-orange-500', path: '/dashboard/logistica' },
            { label: 'Partners B2B', value: adminStats.totalPartners.toString(), icon: Building2, color: 'text-purple-500', path: '/dashboard/negocios' },
          ].map((kpi) => (
            <Link 
              key={kpi.label} 
              to={kpi.path || '#'} 
              className={cn(
                "bg-white p-6 rounded-2xl border border-tp-gray-soft transition-all",
                kpi.path ? "hover:shadow-md hover:border-tp-blue/20 cursor-pointer" : ""
              )}
            >
              <kpi.icon className={cn("w-6 h-6 mb-4", kpi.color)} />
              <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
              <div className="text-xs text-tp-blue/60 font-medium uppercase tracking-wider">{kpi.label}</div>
            </Link>
          ))}
        </div>

        {/* Paquetes por estado */}
        {porEstado.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft">
            <h2 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-3">Paquetes por Estado</h2>
            <div className="flex flex-wrap gap-2">
              {porEstado.map(([estado, count]) => (
                <Link key={estado} to="/dashboard/logistica" className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-tp-gray-soft rounded-xl hover:border-tp-blue/30 transition-colors">
                  <ChipEstado estado={estado} />
                  <span className="font-black text-tp-blue text-sm">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Stats Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* B2B Partners Stats */}
          <div className="bg-white p-6 rounded-3xl border border-tp-gray-soft shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Building2 className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-tp-blue text-white rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-tp-blue">Rendimiento B2B / Partners</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-tp-blue-light/30 rounded-2xl">
                <div className="text-2xl font-black text-tp-blue">{adminStats.totalPartners}</div>
                <div className="text-[10px] text-tp-blue/40 font-bold uppercase">Partners</div>
              </div>
              <div className="p-4 bg-tp-blue-light/30 rounded-2xl">
                <div className="text-2xl font-black text-tp-blue">{adminStats.b2bPackages}</div>
                <div className="text-[10px] text-tp-blue/40 font-bold uppercase">Paquetes</div>
              </div>
              <div className="p-4 bg-tp-blue-light/30 rounded-2xl">
                <div className="text-2xl font-black text-tp-blue">{adminStats.b2bWeight.toFixed(1)} <span className="text-xs">kg</span></div>
                <div className="text-[10px] text-tp-blue/40 font-bold uppercase">Peso Total</div>
              </div>
            </div>
            <Link to="/dashboard/negocios" className="mt-6 flex items-center justify-center gap-2 py-3 bg-tp-blue text-white rounded-xl font-bold text-sm hover:bg-[#004a78] transition-all">
              Ver Directorio B2B <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Influencers Stats */}
          <div className="bg-white p-6 rounded-3xl border border-tp-gray-soft shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-tp-red">
              <Star className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-tp-red text-white rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-tp-blue">Impacto Influencers</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-2xl">
                <div className="text-2xl font-black text-tp-red">{adminStats.totalInfluencers}</div>
                <div className="text-[10px] text-tp-red/40 font-bold uppercase">Activos</div>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl">
                <div className="text-2xl font-black text-tp-red">{adminStats.influencerReferrals}</div>
                <div className="text-[10px] text-tp-red/40 font-bold uppercase">Referidos</div>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl">
                <div className="text-2xl font-black text-tp-red">€{adminStats.influencerCommissions.toFixed(2)}</div>
                <div className="text-[10px] text-tp-red/40 font-bold uppercase">Comisiones</div>
              </div>
            </div>
            <Link to="/dashboard/negocios" className="mt-6 flex items-center justify-center gap-2 py-3 bg-tp-red text-white rounded-xl font-bold text-sm hover:bg-[#D91F33] transition-all">
              Configurar Afiliados <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Slider */}
          <div className="bg-white p-6 rounded-3xl border border-tp-gray-soft shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-tp-blue flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-tp-red" />
                Rendimiento de Red
              </h2>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPerformanceSlide(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentPerformanceSlide === i ? "bg-tp-blue w-6" : "bg-tp-blue/20"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="relative h-[280px]">
              {currentPerformanceSlide === 0 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-tp-blue uppercase text-[10px] tracking-widest">Rendimiento Agentes</h3>
                    <Users className="w-4 h-4 text-tp-blue/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                      <div className="text-2xl font-black text-tp-blue">{adminStats.agentePackages}</div>
                      <div className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-wider">Paquetes</div>
                    </div>
                    <div className="p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                      <div className="text-2xl font-black text-tp-blue">{adminStats.agenteWeight.toFixed(1)}</div>
                      <div className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-wider">Kilos Totales</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-tp-blue/60 mb-1">
                      <span>Comisiones Generadas</span>
                      <span>€{adminStats.agenteCommissions.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-tp-blue transition-all duration-1000" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {currentPerformanceSlide === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-tp-blue uppercase text-[10px] tracking-widest">Rendimiento B2B</h3>
                    <Building2 className="w-4 h-4 text-tp-blue/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                      <div className="text-2xl font-black text-tp-blue">{adminStats.b2bPackages}</div>
                      <div className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-wider">Paquetes</div>
                    </div>
                    <div className="p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                      <div className="text-2xl font-black text-tp-blue">€{adminStats.b2bRevenue.toLocaleString()}</div>
                      <div className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-wider">Ingresos B2B</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-tp-blue/60 mb-1">
                      <span>Meta de Peso (5000kg)</span>
                      <span>{(adminStats.b2bWeight / 5000 * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-tp-blue transition-all duration-1000" style={{ width: `${Math.min(100, adminStats.b2bWeight / 5000 * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              )}

              {currentPerformanceSlide === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-tp-blue uppercase text-[10px] tracking-widest">Impacto Influencers</h3>
                    <Star className="w-4 h-4 text-tp-blue/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-red-50 rounded-2xl border border-tp-red/10">
                      <div className="text-2xl font-black text-tp-red">{adminStats.influencerReferrals}</div>
                      <div className="text-[10px] text-tp-red/40 font-bold uppercase tracking-wider">Referidos</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-2xl border border-tp-red/10">
                      <div className="text-2xl font-black text-tp-red">{adminStats.influencerWeight.toFixed(1)}</div>
                      <div className="text-[10px] text-tp-red/40 font-bold uppercase tracking-wider">Kilos</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                      <div className="w-12 h-12 bg-tp-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-tp-blue/20">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-tp-blue">€{adminStats.influencerCommissions.toFixed(2)}</div>
                        <div className="text-[10px] text-tp-blue/60 font-bold uppercase tracking-wider">Comisiones Pagadas</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-tp-gray-soft flex items-center justify-between">
              <button 
                onClick={() => setCurrentPerformanceSlide(prev => (prev === 0 ? 2 : prev - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-tp-blue rotate-180" />
              </button>
              <span className="text-[10px] font-black text-tp-blue/30 uppercase tracking-widest">
                {currentPerformanceSlide === 0 ? 'Agentes' : currentPerformanceSlide === 1 ? 'B2B' : 'Influencers'}
              </span>
              <button 
                onClick={() => setCurrentPerformanceSlide(prev => (prev === 2 ? 0 : prev + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-tp-blue" />
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft">
            <h2 className="text-lg font-bold text-tp-blue mb-4">Alertas de Sistema</h2>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-red-50 text-tp-red rounded-xl border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">Retraso detectado en consolidación Lote #42 (Madrid).</p>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 text-tp-blue rounded-xl border border-blue-100">
                <Clock className="w-5 h-5 shrink-0" />
                <p className="text-sm">Actualización de tarifas pendiente para el próximo mes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'influencer') {
    return <InfluencerDashboard />;
  }

  if (role === 'partner') {
    if (profile?.tipoColaborador === 'punto_pack') {
      return <PuntoPackDashboard />;
    }
    return <PartnerB2BDashboard />;
  }

  if (role === 'cliente') {
    const handleTrack = (e: React.FormEvent) => {
      e.preventDefault();
      if (trackingInput.trim()) {
        navigate(`/seguimiento?t=${trackingInput.trim()}`);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-tp-red rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <h1 className="text-2xl font-bold mb-2 relative z-10">Mis Paquetes</h1>
          <p className="text-white/70 relative z-10">Hola, {user?.displayName}. Sigue el estado de tus envíos en tiempo real.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-tp-gray-soft shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-tp-blue mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-tp-red" />
            Rastrear Paquete
          </h2>
          <form onSubmit={handleTrack} className="flex gap-3">
            <input 
              type="text" 
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Introduce tu número de tracking (TP-ES-...)" 
              className="flex-1 px-4 py-3 bg-tp-blue-light/30 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold text-tp-blue"
            />
            <button type="submit" className="bg-tp-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-[#004a78] transition-all shadow-sm">
              Buscar
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
          <div className="p-5 border-b border-tp-gray-soft flex justify-between items-center">
            <h2 className="text-lg font-bold text-tp-blue">Historial de Envíos</h2>
          </div>
          
          {paquetes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                  <tr>
                    <th className="px-5 py-3">Tracking</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Destino</th>
                    <th className="px-5 py-3">Destinatario</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-gray-soft">
                  {paquetes.map((envio, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-tp-blue">{envio.tracking}</td>
                      <td className="px-5 py-4 text-tp-blue/60">
                        {envio.createdAt ? new Date(envio.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-tp-blue/70">{envio.destino}</td>
                      <td className="px-5 py-4 text-tp-blue/70">{envio.destinatarioNombre}</td>
                      <td className="px-5 py-4"><ChipEstado estado={envio.estado} /></td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => navigate(`/seguimiento?t=${envio.tracking}`)}
                          className="text-tp-blue hover:text-tp-red font-bold transition-colors flex items-center gap-1 ml-auto"
                        >
                          Rastrear <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-tp-blue/50">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No tienes envíos registrados en este momento.</p>
              <p className="text-sm mt-1">Cuando un agente registre un paquete a tu nombre, aparecerá aquí.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Agente Dashboard (Original)
  return (
    <div className="space-y-6">
      {/* Hero Panel */}
      <div className="bg-gradient-to-r from-tp-blue to-[#004a78] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <h1 className="text-2xl font-bold mb-6">Resumen Operativo Hoy (Agente)</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-tp-blue-light" />
              <span className="text-tp-blue-light font-medium">Paquetes Recibidos</span>
            </div>
            <div className="text-4xl font-black">{paquetes.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Box className="w-5 h-5 text-tp-blue-light" />
              <span className="text-tp-blue-light font-medium">Kilos Recepcionados</span>
            </div>
            <div className="text-4xl font-black">{totalKilos.toFixed(2)} <span className="text-lg opacity-70">kg</span></div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-tp-blue-light" />
              <span className="text-tp-blue-light font-medium">Comisiones Acumuladas</span>
            </div>
            <div className="text-4xl font-black">€{userData?.balanceComisiones?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="bg-tp-red/20 backdrop-blur-sm rounded-xl p-5 border border-tp-red/30">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-200" />
              <span className="text-red-100 font-medium">Incidencias</span>
            </div>
            <div className="text-4xl font-black text-white">{paquetes.filter(p => p.estado === 'Incidencia').length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column: Envíos & Workflow */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Panel de Comisiones */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
            <div className="p-5 border-b border-tp-gray-soft flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-tp-blue">Panel de Comisiones</h2>
              <div className="text-xs font-bold text-tp-blue/50 uppercase">Tasa: {userData?.tasaComision || 0}%</div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-tp-blue-light/30 rounded-xl border border-tp-blue/10">
                  <div className="text-xs text-tp-blue/60 font-bold uppercase mb-1">Código de Referido</div>
                  <div className="text-xl font-black text-tp-blue tracking-widest">{userData?.codigoReferido || 'NO ASIGNADO'}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-xs text-green-600 font-bold uppercase mb-1">Tipo de Colaborador</div>
                  <div className="text-xl font-black text-green-700 uppercase">{userData?.tipoColaborador?.replace('_', ' ') || 'AGENTE'}</div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-tp-blue mb-3 uppercase tracking-wider">Últimas Comisiones</h3>
              <div className="space-y-2">
                {comisionesRecientes.map((com, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-tp-blue">{com.tracking}</span>
                      <span className="text-[10px] text-tp-blue/50">{com.clienteNombre}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-green-600">+€{com.montoComision?.toFixed(2) || '0.00'}</div>
                      <div className="text-[10px] text-tp-blue/40">{com.createdAt ? new Date(com.createdAt.toDate()).toLocaleDateString() : ''}</div>
                    </div>
                  </div>
                ))}
                {comisionesRecientes.length === 0 && (
                  <div className="text-center py-4 text-tp-blue/40 italic text-sm">No hay comisiones registradas aún.</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabla Envíos */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
            <div className="p-5 border-b border-tp-gray-soft flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-tp-blue">Últimos Envíos</h2>
              <button className="text-sm font-medium text-tp-blue hover:text-tp-red transition-colors">Ver todos</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                  <tr>
                    <th className="px-5 py-3">Tracking / Hora</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-gray-soft">
                  {paquetes.slice(0, 5).map((envio, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-tp-blue">{envio.tracking}</div>
                        <div className="text-xs text-tp-blue/50 mt-0.5">
                          {envio.createdAt ? new Date(envio.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-tp-blue/80">{envio.clienteNombre || 'N/A'}</td>
                      <td className="px-5 py-4"><ChipEstado estado={envio.estado} /></td>
                      <td className="px-5 py-4 text-tp-blue/70">{envio.destino}</td>
                    </tr>
                  ))}
                  {paquetes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-tp-blue/50">No hay envíos recientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow 4 pasos */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft p-6">
            <h2 className="text-lg font-bold text-tp-blue mb-6">Flujo Operativo</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Recepción', 'Validación', 'Consolidación', 'Despacho'].map((step, i) => (
                <div key={step} className="relative">
                  <div className="bg-tp-blue-light rounded-xl p-4 border border-tp-gray-soft/50 h-full">
                    <div className="w-8 h-8 rounded-full bg-tp-blue text-white flex items-center justify-center font-bold mb-3">
                      {i + 1}
                    </div>
                    <h3 className="font-bold text-tp-blue">{step}</h3>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10 text-tp-gray-soft">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Marketing & Tools for Agents */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft p-6">
            <h2 className="text-lg font-bold text-tp-blue mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-tp-red" />
              Herramientas de Crecimiento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-tp-blue text-white rounded-2xl relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                <h3 className="font-black text-xl mb-2">Calculadora de Tarifas</h3>
                <p className="text-white/60 text-sm mb-4">Calcula el precio final para tu cliente incluyendo tu margen de beneficio.</p>
                <button onClick={() => navigate('/dashboard/calculadora')} className="bg-tp-red text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                  ABRIR CALCULADORA <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-6 bg-tp-blue-light border border-tp-blue/10 rounded-2xl relative overflow-hidden group cursor-pointer">
                <h3 className="font-black text-xl text-tp-blue mb-2">Material de Marketing</h3>
                <p className="text-tp-blue/60 text-sm mb-4">Descarga banners, logos y plantillas para tus redes sociales.</p>
                <button className="bg-tp-blue text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                  DESCARGAR PACK <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Priority & Timeline */}
        <div className="space-y-6">
          
          {/* Cola Prioritaria */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft p-5">
            <h2 className="text-lg font-bold text-tp-blue mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-tp-red" />
              Cola Prioritaria
            </h2>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-tp-blue">TP-ES-240{70 - i}</span>
                    <ChipEstado estado="Peso?" />
                  </div>
                  <p className="text-sm text-tp-blue/70 mb-3">Diferencia de peso detectada en báscula. Requiere revisión manual.</p>
                  <button className="text-xs font-bold text-tp-red hover:text-[#D91F33] uppercase tracking-wider">Resolver ahora</button>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs Pequeños */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-tp-gray-soft p-4">
              <div className="text-xs text-tp-blue/60 font-medium mb-1">Tiempo Medio Reg.</div>
              <div className="text-xl font-bold text-tp-blue">1.2 min</div>
            </div>
            <div className="bg-white rounded-xl border border-tp-gray-soft p-4">
              <div className="text-xs text-tp-blue/60 font-medium mb-1">Entregas a tiempo</div>
              <div className="text-xl font-bold text-green-600 flex items-center gap-1">
                91% <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* News Widget */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
            <div className="p-5 border-b border-tp-gray-soft bg-tp-blue-light/20 flex justify-between items-center">
              <h2 className="text-sm font-black text-tp-blue uppercase tracking-wider flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-tp-red" />
                Noticiero TP
              </h2>
              <Link to="/dashboard/noticias" className="text-[10px] font-bold text-tp-red hover:underline">VER TODO</Link>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3 group cursor-pointer" onClick={() => navigate('/dashboard/noticias')}>
                <div className="w-10 h-10 bg-tp-blue-light rounded-lg flex items-center justify-center shrink-0 group-hover:bg-tp-blue group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-tp-blue group-hover:text-tp-red transition-colors">Tasas elToque</h4>
                  <p className="text-[10px] text-tp-blue/50 line-clamp-2">Consulta el valor del USD, EUR y MLC en el mercado informal hoy.</p>
                </div>
              </div>
              <div className="flex gap-3 group cursor-pointer" onClick={() => navigate('/dashboard/noticias')}>
                <div className="w-10 h-10 bg-tp-blue-light rounded-lg flex items-center justify-center shrink-0 group-hover:bg-tp-blue group-hover:text-white transition-colors">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-tp-blue group-hover:text-tp-red transition-colors">Logística Cuba</h4>
                  <p className="text-[10px] text-tp-blue/50 line-clamp-2">Nuevas regulaciones aduanales y frecuencias de vuelos actualizadas.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
