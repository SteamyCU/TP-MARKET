import React, { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, ArrowUpRight,
  Calendar, Filter, Download, DollarSign, Users,
  CheckCircle2, AlertCircle, Calculator, Trophy, Star, Shield, Crown,
  Package, AlertTriangle, CalendarClock,
} from 'lucide-react';
import { CodigoReferidoCard } from '../components/influencer/CodigoReferidoCard';
import { useAuth } from '../AuthContext';
import { getSetting } from '../services/settings';
import { subscribePaquetes } from '../services/paquetes';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import {
  getResumenInfluencer,
  type ResumenInfluencer,
} from '../services/influencers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Vista Influencer
// ---------------------------------------------------------------------------

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ComisionesInfluencer() {
  const { user, loading: authLoading } = useAuth();
  const [resumen, setResumen] = useState<ResumenInfluencer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;
    setLoading(true);
    getResumenInfluencer(user.uid)
      .then((data) => { if (active) setResumen(data); })
      .catch((err) => console.error('Error cargando resumen influencer:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, authLoading]);

  const actividad = resumen?.actividad;
  const comisiones = resumen?.comisiones;
  const clientes = resumen?.clientes || [];
  const activo = !!actividad?.activo;
  const config = resumen?.config;

  // Tabla detallada de comisiones: cada cliente con sus paquetes entregados y si
  // el influencer estaba activo en ese momento.
  // Generamos filas planas a partir de los clientes referidos + sus paquetes.
  // Como el servicio ya tiene los datos agregados, usamos la lista de clientes
  // para la tabla principal. Para el historial detallado por paquete necesitaríamos
  // datos adicionales no expuestos por getResumenInfluencer, así que mostramos
  // la tabla de clientes (que es el nivel de detalle útil para el influencer).

  const stats = [
    { label: 'Clientes nuevos traídos', value: comisiones ? comisiones.clientesNuevosTotal.toString() : '0', icon: Users, color: 'text-blue-500' },
    { label: 'Kg gestionados (este mes)', value: comisiones ? `${comisiones.kgGestionadosMes.toFixed(1)} kg` : '0 kg', icon: Package, color: 'text-purple-500' },
    { label: 'Comisión (este mes)', value: comisiones ? `€${comisiones.comisionesEsteMes.toFixed(2)}` : '€0.00', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Comisión total acumulada', value: comisiones ? `€${comisiones.totalComisiones.toFixed(2)}` : '€0.00', icon: Wallet, color: 'text-tp-red' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-tp-blue">Mis Ganancias</h1>
        <p className="text-tp-blue/60 text-sm">
          Tu comisión actual: <strong>{config ? `${(config.comisionPct * 100).toFixed(0)}%` : '5%'}</strong> por envío entregado de tu cartera, mientras estés activo.
        </p>
      </div>

      {/* Banner de actividad */}
      <div className={cn(
        'rounded-3xl p-6 border flex items-start gap-4 shadow-sm',
        activo ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200',
      )}>
        <div className={cn('p-3 rounded-2xl shrink-0', activo ? 'bg-green-100' : 'bg-amber-100')}>
          {activo
            ? <CheckCircle2 className="w-7 h-7 text-green-600" />
            : <AlertTriangle className="w-7 h-7 text-amber-600" />}
        </div>
        <div className="flex-1">
          <div className={cn('font-black text-lg', activo ? 'text-green-700' : 'text-amber-700')}>
            {loading ? 'Cargando estado…' : activo ? '✅ Activo' : '⚠️ Inactivo'}
          </div>
          <p className={cn('text-sm mt-1', activo ? 'text-green-700/80' : 'text-amber-700/80')}>
            {loading
              ? 'Calculando tu actividad…'
              : activo
                ? <>Tienes hasta el <strong>{formatFecha(actividad?.fechaLimite ?? null)}</strong> para traer un cliente nuevo y seguir generando comisiones de toda tu cartera.</>
                : <>Trae un cliente nuevo para <strong>reactivar las comisiones</strong> de toda tu cartera. Mientras estés inactivo no se generan comisiones.</>}
          </p>
          {activo && actividad?.diasRestantes != null && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              <CalendarClock className="w-4 h-4" />
              {actividad.diasRestantes} {actividad.diasRestantes === 1 ? 'día restante' : 'días restantes'}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
            <kpi.icon className={cn('w-6 h-6 mb-4', kpi.color)} />
            <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Enlace de promoción */}
      <CodigoReferidoCard />

      {/* Tabla clientes referidos con historial */}
      <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center">
          <h2 className="text-lg font-bold text-tp-blue">Historial de comisiones · Clientes referidos</h2>
          <span className="text-sm font-bold text-tp-blue/40">{clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Kg enviados</th>
                <th className="px-6 py-4 text-right">Paquetes</th>
                <th className="px-6 py-4">Última actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-tp-blue">{c.nombre}</div>
                    <div className="text-xs text-tp-blue/40">{c.email}</div>
                  </td>
                  <td className="px-6 py-4 text-tp-blue/60">{formatFecha(c.fechaRegistro)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                      c.esNuevo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    )}>
                      {c.esNuevo ? 'Nuevo' : 'Antiguo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-tp-blue">{c.kgEnviados.toFixed(1)} kg</td>
                  <td className="px-6 py-4 text-right text-tp-blue/60">{c.numPaquetes}</td>
                  <td className="px-6 py-4 text-tp-blue/60">{formatFecha(c.ultimaActividad)}</td>
                </tr>
              ))}
              {!loading && clientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Aún no has traído ningún cliente. Comparte tu enlace para empezar a generar comisiones.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Cargando historial…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista Agente (sin cambios respecto al original)
// ---------------------------------------------------------------------------

function ComisionesAgenteView() {
  const { user, loading: authLoading, profile: userData } = useAuth();
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [simulator, setSimulator] = useState({
    seguidores: 100,
    kilosCliente: 5,
    precioMedioKilo: 6,
  });

  const [levelsConfig, setLevelsConfig] = useState<any>({
    bronce: { min: 0, max: 50, comision: 0.03, bono: 5, subAfiliado: 0, pagoMinimo: 30 },
    plata: { min: 51, max: 200, comision: 0.05, bono: 20, subAfiliado: 0.01, pagoMinimo: 50 },
    oro: { min: 201, max: 500, comision: 0.07, bono: 60, subAfiliado: 0.015, pagoMinimo: 100 },
    elite: { min: 501, max: 999999, comision: 0.10, bono: 150, subAfiliado: 0.02, gestor: true },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const levels = await getSetting<any>('influencer_levels');
        if (levels) setLevelsConfig(levels);
        const preciosData = await getSetting<{ b2b?: number; influencer?: number }>('precios');
        if (preciosData) {
          setSimulator(prev => ({ ...prev, precioMedioKilo: preciosData.influencer || 6 }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    if (userData) fetchSettings();
  }, [userData]);

  useEffect(() => {
    if (authLoading || !user) return;
    const unsub = subscribePaquetes({ referidoPor: user.uid }, (docs) => {
      setComisiones(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'paquetes (comisiones)');
      setLoading(false);
    });
    return () => unsub();
  }, [user, authLoading]);

  const totalAcumulado = userData?.balanceComisiones || 0;
  const tasaComision = userData?.tasaComision || 0;
  const tipoColaborador = userData?.tipoColaborador || 'Freelance';

  const calculateSimulator = () => {
    const totalKilos = simulator.seguidores * simulator.kilosCliente;
    const volumen = totalKilos * simulator.precioMedioKilo;
    let nivel = 'bronce'; let conf = levelsConfig.bronce;
    if (totalKilos > levelsConfig.elite.min) { nivel = 'élite'; conf = levelsConfig.elite; }
    else if (totalKilos > levelsConfig.oro.min) { nivel = 'oro'; conf = levelsConfig.oro; }
    else if (totalKilos > levelsConfig.plata.min) { nivel = 'plata'; conf = levelsConfig.plata; }
    const comisionEnvios = volumen * conf.comision;
    const totalMes = comisionEnvios + conf.bono;
    const canWithdraw = totalKilos >= 50 && simulator.seguidores >= 5;
    return { totalKilos, volumen, nivel, conf, comisionEnvios, totalMes, canWithdraw };
  };

  const simResult = calculateSimulator();

  const getCurrentLevel = () => {
    const envios = comisiones.length;
    if (envios >= levelsConfig.elite.min) return { name: 'Élite', ...levelsConfig.elite, next: null };
    if (envios >= levelsConfig.oro.min) return { name: 'Oro', ...levelsConfig.oro, next: { name: 'Élite', min: levelsConfig.elite.min } };
    if (envios >= levelsConfig.plata.min) return { name: 'Plata', ...levelsConfig.plata, next: { name: 'Oro', min: levelsConfig.oro.min } };
    return { name: 'Bronce', ...levelsConfig.bronce, next: { name: 'Plata', min: levelsConfig.plata.min } };
  };

  const currentLevel = getCurrentLevel();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-tp-blue">Mis Comisiones</h1>
          <p className="text-tp-blue/60">Gestiona tus ganancias y referidos en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-bold text-tp-blue hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            Últimos 30 días
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-tp-blue text-white rounded-xl text-sm font-bold hover:bg-[#004a78] transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="w-10 h-10 bg-tp-blue-light rounded-xl flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-tp-blue" />
          </div>
          <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider mb-1">Balance Disponible</div>
          <div className="text-3xl font-black text-tp-blue">{totalAcumulado.toFixed(2)}€</div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-600">
            <ArrowUpRight className="w-3 h-3" />
            +12% vs mes anterior
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="w-10 h-10 bg-tp-red/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-tp-red" />
          </div>
          <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider mb-1">Tasa de Comisión</div>
          <div className="text-3xl font-black text-tp-blue">{tasaComision}%</div>
          <div className="mt-2 text-[10px] font-bold text-tp-blue/40">
            Nivel: <span className="text-tp-red uppercase">{tipoColaborador}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider mb-1">Referidos Activos</div>
          <div className="text-3xl font-black text-tp-blue">{comisiones.length}</div>
          <div className="mt-2 text-[10px] font-bold text-tp-blue/40">
            Código: <span className="text-tp-blue font-black">{userData?.codigoReferido || 'N/A'}</span>
          </div>
        </div>
        <div className="bg-tp-blue p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="text-xs text-white/60 font-bold uppercase tracking-wider mb-1">Próximo Pago</div>
            <div className="text-2xl font-black text-white">15 Abr 2026</div>
            <button className="mt-4 w-full bg-tp-red text-white py-2 rounded-lg text-xs font-bold hover:bg-[#D91F33] transition-colors">
              SOLICITAR RETIRO
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
          <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center">
            <h3 className="font-black text-tp-blue">Historial de Comisiones</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tp-blue/40" />
                <select className="pl-9 pr-4 py-2 bg-tp-blue-light/30 border-none rounded-lg text-xs font-bold text-tp-blue focus:ring-1 focus:ring-tp-blue outline-none appearance-none">
                  <option>Todos los estados</option>
                  <option>Pagado</option>
                  <option>Pendiente</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tp-blue-light/20 text-[10px] font-black text-tp-blue/50 uppercase tracking-widest">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Paquete / Cliente</th>
                  <th className="px-6 py-4">Monto Envío</th>
                  <th className="px-6 py-4">Comisión</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-gray-soft">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-tp-blue/40 font-bold">Cargando datos...</td></tr>
                ) : comisiones.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-tp-blue/40 font-bold">No hay comisiones registradas aún.</td></tr>
                ) : (
                  comisiones.map((item) => (
                    <tr key={item.id} className="hover:bg-tp-blue-light/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-tp-blue">
                          {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-tp-blue">{item.tracking || 'N/A'}</div>
                        <div className="text-[10px] text-tp-blue/50">{item.remitente?.nombre || 'Cliente Final'}</div>
                      </td>
                      <td className="px-6 py-4"><div className="text-xs font-bold text-tp-blue">{item.precioTotal || 0}€</div></td>
                      <td className="px-6 py-4"><div className="text-xs font-black text-tp-red">+{item.montoComision || 0}€</div></td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Confirmada
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
            <h3 className="font-black text-tp-blue mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-tp-red" />
              Tu Plan de Ganancias
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-tp-blue-light/30 rounded-xl border border-tp-blue/5">
                <div className="text-[10px] font-black text-tp-blue/40 uppercase mb-1">Nivel Actual</div>
                <div className="text-lg font-black text-tp-blue">{tipoColaborador}</div>
                <div className="mt-2 h-1.5 w-full bg-tp-blue/10 rounded-full overflow-hidden">
                  <div className="h-full bg-tp-red w-3/4"></div>
                </div>
                <div className="mt-2 text-[10px] font-bold text-tp-blue/60">Faltan 500€ para el nivel <span className="text-tp-blue font-black">PREMIUM</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-tp-blue/60">Comisión Base</span>
                  <span className="text-tp-blue">{tasaComision}%</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-tp-blue/60">Bono por Volumen</span>
                  <span className="text-green-600">+2%</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-tp-gray-soft pt-3">
                  <span className="text-tp-blue">Total Efectivo</span>
                  <span className="text-tp-red font-black">{(tasaComision + 2)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-tp-red p-6 rounded-2xl shadow-xl text-white">
            <h3 className="font-black text-lg mb-4">¿Necesitas ayuda?</h3>
            <p className="text-white/70 text-xs mb-6 leading-relaxed">Si tienes dudas sobre el cálculo de tus comisiones o quieres solicitar un pago urgente, contacta con tu gestor de cuenta.</p>
            <button className="w-full bg-white text-tp-red py-3 rounded-xl font-black text-sm hover:bg-tp-blue hover:text-white transition-all">CONTACTAR SOPORTE</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
          <h2 className="text-xl font-bold text-tp-blue mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-tp-red" />
            Simulador de Ganancias
          </h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Clientes en tu red</label>
              <input type="number" value={simulator.seguidores} onChange={(e) => setSimulator({ ...simulator, seguidores: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Kilos / cliente / mes</label>
                <input type="number" value={simulator.kilosCliente} onChange={(e) => setSimulator({ ...simulator, kilosCliente: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Precio medio kilo (€)</label>
                <input type="number" value={simulator.precioMedioKilo} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-tp-gray-soft rounded-xl text-tp-blue/60 font-medium cursor-not-allowed" />
              </div>
            </div>
          </div>
          <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="text-tp-blue/60">Total kilos/mes:</div>
              <div className="font-bold text-tp-blue text-right">{simResult.totalKilos} kg</div>
              <div className="text-tp-blue/60">Nivel estimado:</div>
              <div className="font-bold text-tp-red text-right uppercase">{simResult.nivel}</div>
              <div className="text-tp-blue/60">Volumen generado:</div>
              <div className="font-bold text-tp-blue text-right">€{simResult.volumen.toFixed(2)}</div>
              <div className="text-tp-blue/60">Comisión ({simResult.conf.comision * 100}%):</div>
              <div className="font-bold text-tp-blue text-right">€{simResult.comisionEnvios.toFixed(2)}</div>
              <div className="text-tp-blue/60">Bono mensual:</div>
              <div className="font-bold text-tp-blue text-right">€{simResult.conf.bono.toFixed(2)}</div>
              <div className="col-span-2 border-t border-tp-blue/10 pt-4 mt-2 flex justify-between items-center">
                <div className="font-bold text-tp-blue">Total/mes estimado:</div>
                <div className="text-2xl font-black text-green-500">€{simResult.totalMes.toFixed(2)}</div>
              </div>
            </div>
            {!simResult.canWithdraw && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700"><strong>Atención:</strong> Para retirar ganancias necesitas un mínimo de <strong>50 kg</strong> enviados y <strong>5 clientes</strong>.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
          <h2 className="text-xl font-bold text-tp-blue mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-tp-red" />
            Niveles de Afiliado
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Nivel Bronce', icon: <Star className="w-4 h-4 text-orange-400" />, conf: levelsConfig.bronce, range: `${levelsConfig.bronce.min} a ${levelsConfig.bronce.max} kg/mes`, cls: 'border-tp-gray-soft' },
              { name: 'Nivel Plata', icon: <Shield className="w-4 h-4 text-gray-400" />, conf: levelsConfig.plata, range: `${levelsConfig.plata.min} a ${levelsConfig.plata.max} kg/mes`, cls: 'border-tp-gray-soft' },
              { name: 'Nivel Oro', icon: <Trophy className="w-4 h-4 text-yellow-500" />, conf: levelsConfig.oro, range: `${levelsConfig.oro.min} a ${levelsConfig.oro.max} kg/mes`, cls: 'border-tp-gray-soft' },
              { name: 'Nivel Élite', icon: <Crown className="w-4 h-4 text-tp-red" />, conf: levelsConfig.elite, range: `+${levelsConfig.elite.min} kg/mes`, cls: 'border-tp-red/30 bg-tp-red/5' },
            ].map((lvl) => (
              <div key={lvl.name} className={cn('p-4 rounded-2xl border hover:border-tp-blue/30 transition-colors', lvl.cls)}>
                <div className="flex justify-between items-center mb-2">
                  <div className={cn('font-bold flex items-center gap-2', lvl.name === 'Nivel Élite' ? 'text-tp-red' : 'text-tp-blue')}>{lvl.icon} {lvl.name}</div>
                  <div className={cn('text-xs font-bold px-2 py-1 rounded-md', lvl.name === 'Nivel Élite' ? 'text-tp-red/70 bg-tp-red/10' : 'text-tp-blue/50 bg-gray-100')}>{lvl.range}</div>
                </div>
                <div className="text-sm text-tp-blue/70 grid grid-cols-2 gap-2">
                  <div>Comisión: <span className="font-bold">{(lvl.conf.comision * 100).toFixed(0)}%</span></div>
                  <div>Bono: <span className="font-bold">€{lvl.conf.bono}</span></div>
                  {lvl.conf.subAfiliado > 0 && <div>Sub-afiliado: <span className="font-bold">{(lvl.conf.subAfiliado * 100).toFixed(1)}%</span></div>}
                  {lvl.conf.pagoMinimo && <div>Pago mínimo: <span className="font-bold">€{lvl.conf.pagoMinimo}</span></div>}
                  {lvl.conf.gestor && <div>Gestor propio: <span className="font-bold text-tp-red">✓</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Punto de entrada — role-aware
// ---------------------------------------------------------------------------

export function ComisionesAgente() {
  const { role } = useAuth();
  if (role === 'influencer') return <ComisionesInfluencer />;
  return <ComisionesAgenteView />;
}
