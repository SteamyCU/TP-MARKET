import React, { useState, useEffect } from 'react';
import { Wallet, Users, CheckCircle2, Package, TrendingUp, AlertTriangle, CalendarClock } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import {
  getResumenInfluencer,
  type ResumenInfluencer,
} from '../../services/influencers';
import { CodigoReferidoCard } from '../influencer/CodigoReferidoCard';
import { cn } from '../../lib/utils';

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function InfluencerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [resumen, setResumen] = useState<ResumenInfluencer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;
    setLoading(true);
    getResumenInfluencer(user.uid)
      .then((data) => { if (active) setResumen(data); })
      .catch((err) => console.error('Error cargando resumen del influencer:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, authLoading]);

  const actividad = resumen?.actividad;
  const comisiones = resumen?.comisiones;
  const clientes = resumen?.clientes || [];
  const activo = !!actividad?.activo;

  const stats = [
    { label: 'Clientes nuevos traídos', value: comisiones ? comisiones.clientesNuevosTotal.toString() : '0', icon: Users, color: 'text-blue-500' },
    { label: 'Kg gestionados (este mes)', value: comisiones ? `${comisiones.kgGestionadosMes.toFixed(1)} kg` : '0 kg', icon: Package, color: 'text-purple-500' },
    { label: 'Comisión (este mes)', value: comisiones ? `€${comisiones.comisionesEsteMes.toFixed(2)}` : '€0.00', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Comisión total acumulada', value: comisiones ? `€${comisiones.totalComisiones.toFixed(2)}` : '€0.00', icon: Wallet, color: 'text-tp-red' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de estado de actividad */}
      <div
        className={cn(
          'rounded-3xl p-6 sm:p-7 border flex items-start gap-4 shadow-sm',
          activo
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200',
        )}
      >
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

      {/* Card "Tu enlace de promoción" */}
      <CodigoReferidoCard />

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm hover:shadow-md transition-shadow">
            <kpi.icon className={cn('w-6 h-6 mb-4', kpi.color)} />
            <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla "Tus clientes referidos" */}
      <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center">
          <h2 className="text-lg font-bold text-tp-blue">Tus clientes referidos</h2>
          <span className="text-sm font-bold text-tp-blue/40">{clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha de registro</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Kg enviados</th>
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
                  <td className="px-6 py-4 text-tp-blue/60">{formatFecha(c.ultimaActividad)}</td>
                </tr>
              ))}
              {!loading && clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Aún no has traído ningún cliente. Comparte tu enlace para empezar a generar comisiones.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Cargando tus clientes referidos…
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
