import React, { useState, useEffect } from 'react';
import { Wallet, Users, Link as LinkIcon, Copy, TrendingUp, Zap, Clock, CheckCircle2, Package, ArrowRight, Share2, Calculator, Trophy, Star, Shield, Crown } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { getSetting } from '../../services/settings';
import { subscribePaquetes } from '../../services/paquetes';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { cn } from '../../lib/utils';

export function InfluencerDashboard() {
  const { user, loading: authLoading, profile } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeReferrals: 0,
    pendingCommissions: 0,
    conversionRate: '4.2%'
  });

  const [levelsConfig, setLevelsConfig] = useState<any>({
    bronce: { min: 0, max: 50, comision: 0.03, bono: 5, subAfiliado: 0, pagoMinimo: 30 },
    plata: { min: 51, max: 200, comision: 0.05, bono: 20, subAfiliado: 0.01, pagoMinimo: 50 },
    oro: { min: 201, max: 500, comision: 0.07, bono: 60, subAfiliado: 0.015, pagoMinimo: 100 },
    elite: { min: 501, max: 999999, comision: 0.10, bono: 150, subAfiliado: 0.02, gestor: true }
  });

  const [simulator, setSimulator] = useState({
    seguidores: 12,
    enviosMes: 10,
    precioMedio: 10
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const levels = await getSetting<any>('influencer_levels');
        if (levels) {
          setLevelsConfig(levels);
        }
      } catch (error) {
        console.error("Error fetching influencer levels:", error);
      }
    };
    fetchSettings();
  }, []);

  const calculateSimulator = () => {
    const totalEnvios = simulator.seguidores * simulator.enviosMes;
    const volumen = totalEnvios * simulator.precioMedio;
    
    let nivel = 'bronce';
    let conf = levelsConfig.bronce;
    
    if (totalEnvios > levelsConfig.elite.min) { nivel = 'élite'; conf = levelsConfig.elite; }
    else if (totalEnvios > levelsConfig.oro.min) { nivel = 'oro'; conf = levelsConfig.oro; }
    else if (totalEnvios > levelsConfig.plata.min) { nivel = 'plata'; conf = levelsConfig.plata; }

    const comisionEnvios = volumen * conf.comision;
    const totalMes = comisionEnvios + conf.bono;

    return { totalEnvios, volumen, nivel, conf, comisionEnvios, totalMes };
  };

  const simResult = calculateSimulator();

  const referralLink = `${window.location.origin}/login?mode=register&ref=${profile?.codigoReferido}`;

  const getCurrentLevel = () => {
    const envios = stats.activeReferrals;
    if (envios >= levelsConfig.elite.min) return { name: 'Élite', ...levelsConfig.elite, next: null };
    if (envios >= levelsConfig.oro.min) return { name: 'Oro', ...levelsConfig.oro, next: { name: 'Élite', min: levelsConfig.elite.min } };
    if (envios >= levelsConfig.plata.min) return { name: 'Plata', ...levelsConfig.plata, next: { name: 'Oro', min: levelsConfig.oro.min } };
    return { name: 'Bronce', ...levelsConfig.bronce, next: { name: 'Plata', min: levelsConfig.plata.min } };
  };

  const currentLevel = getCurrentLevel();

  useEffect(() => {
    if (authLoading || !user?.uid) return;

    const unsubscribe = subscribePaquetes({ referidoPor: user.uid, limit: 10 }, (data) => {
      let total = 0;
      let pending = 0;
      (data as any[]).forEach((p) => {
        if (p.estado === 'Entregado') {
          total += (p.montoComision || 0);
        } else {
          pending += (p.montoComision || 0);
        }
      });
      setReferrals(data);
      setStats(prev => ({
        ...prev,
        totalEarnings: profile?.balanceComisiones || total,
        activeReferrals: data.length,
        pendingCommissions: pending
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'paquetes (influencer)');
      console.error("Error in influencer snapshot:", error);
    });

    return () => unsubscribe();
  }, [user, authLoading, profile]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#7F77DD] to-[#5A52C6] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs opacity-80">Programa de Afiliados</span>
          </div>
          <h1 className="text-3xl font-black mb-2">¡Hola, {profile?.name}!</h1>
          <p className="text-white/70 max-w-xl">
            Tu audiencia es tu mayor activo. Sigue generando envíos y sube de nivel para obtener mejores comisiones.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Ganancias Totales', value: `€${stats.totalEarnings.toFixed(2)}`, icon: Wallet, color: 'text-green-500' },
          { label: 'Comisión Pendiente', value: `€${stats.pendingCommissions.toFixed(2)}`, icon: Clock, color: 'text-orange-500' },
          { label: 'Referidos Activos', value: stats.activeReferrals.toString(), icon: Users, color: 'text-blue-500' },
          { label: 'Tasa de Conversión', value: stats.conversionRate, icon: Zap, color: 'text-purple-500' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm hover:shadow-md transition-shadow">
            <kpi.icon className={cn("w-6 h-6 mb-4", kpi.color)} />
            <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Link & Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
          <h2 className="text-xl font-bold text-tp-blue mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-tp-red" />
            Tu Enlace de Afiliado
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-gray-50 border border-tp-gray-soft rounded-2xl px-4 py-4 font-mono text-sm text-tp-blue/70 break-all flex items-center">
              {referralLink}
            </div>
            <button 
              onClick={copyToClipboard}
              className={cn(
                "px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shrink-0",
                copied ? "bg-green-500 text-white" : "bg-tp-blue text-white hover:bg-[#004a78]"
              )}
            >
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? '¡COPIADO!' : 'COPIAR LINK'}
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
              <div className="text-xs font-bold text-tp-blue/40 uppercase mb-1">Código Promocional</div>
              <div className="text-2xl font-black text-tp-blue tracking-widest">{profile?.codigoReferido}</div>
            </div>
            <div className="p-4 bg-tp-red/5 rounded-2xl border border-tp-red/10">
              <div className="text-xs font-bold text-tp-red/40 uppercase mb-1">Tu Comisión Actual</div>
              <div className="text-2xl font-black text-tp-red">{(profile?.tasaComision * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tp-blue/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-xl font-bold text-tp-blue mb-6">Tu Nivel: <span className="text-tp-red uppercase">{currentLevel.name}</span></h2>
          <div className="space-y-6">
            {currentLevel.next && (
              <div>
                <div className="flex justify-between text-xs font-bold text-tp-blue/60 uppercase mb-2">
                  <span>Progreso a Nivel {currentLevel.next.name}</span>
                  <span>{stats.activeReferrals}/{currentLevel.next.min} envíos</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tp-red transition-all duration-1000" 
                    style={{ width: `${Math.min((stats.activeReferrals / currentLevel.next.min) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-2xl border border-tp-gray-soft">
              <h4 className="text-sm font-bold text-tp-blue mb-2">Beneficios Actuales:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-tp-blue/60">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Comisión: {(currentLevel.comision * 100).toFixed(1)}%
                </li>
                <li className="flex items-center gap-2 text-xs text-tp-blue/60">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Bono: €{currentLevel.bono}
                </li>
                {currentLevel.subAfiliado > 0 && (
                  <li className="flex items-center gap-2 text-xs text-tp-blue/60">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Sub-afiliados: {(currentLevel.subAfiliado * 100).toFixed(1)}%
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center">
          <h2 className="text-lg font-bold text-tp-blue">Últimas Conversiones</h2>
          <button className="text-sm font-bold text-tp-red hover:underline">Ver Historial Completo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">Tracking</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Tu Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {referrals.map((ref, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-tp-blue">{ref.tracking}</td>
                  <td className="px-6 py-4 text-tp-blue/60">
                    {ref.createdAt ? new Date(ref.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-tp-blue/70">{ref.clienteNombre}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      ref.estado === 'Entregado' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {ref.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-tp-blue">
                    €{ref.montoComision?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Aún no tienes conversiones registradas.
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
