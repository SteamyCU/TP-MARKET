import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Package, Users, Wallet, Download, MapPin, Boxes, Receipt,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeProfiles } from '../services/profiles';
import { subscribeClientes } from '../services/clientes';
import { cn } from '../lib/utils';
import { ChipEstado } from '../components/ChipEstado';
import { exportarExcel } from '../lib/excel';

const COLORS = ['#00314F', '#EE293B', '#004a78', '#D91F33', '#64748B', '#0E7490'];

const toDateSafe = (f: any): Date | null => (f?.toDate ? f.toDate() : f instanceof Date ? f : null);
const eur = (n: number) => `€${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

export function Reportes() {
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    const subs = [
      onSnapshot(query(collection(db, 'paquetes'), orderBy('createdAt', 'desc'), limit(1000)), s => setPaquetes(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'pagos'), orderBy('fecha', 'desc'), limit(1000)), s => setPagos(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'gastos')), s => setGastos(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      subscribeClientes({}, (clientes) => setClientes(clientes)),
      onSnapshot(query(collection(db, 'lotes')), s => setLotes(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      subscribeProfiles({}, (profiles) => setUsuarios(profiles)),
    ];
    return () => subs.forEach(u => u());
  }, []);

  const hoy = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const esCobro = (p: any) => p.estado !== 'Pendiente';

  const ingresosMes = pagos.filter(p => esCobro(p) && (toDateSafe(p.fecha)?.getTime() || 0) >= inicioMes.getTime()).reduce((a, p) => a + (p.monto || 0), 0);
  const gastosMes = gastos.filter(g => (toDateSafe(g.fecha)?.getTime() || 0) >= inicioMes.getTime()).reduce((a, g) => a + (g.monto || 0), 0);
  const paquetesMes = paquetes.filter(p => (toDateSafe(p.createdAt)?.getTime() || 0) >= inicioMes.getTime()).length;
  const clientesNuevosMes = clientes.filter(c => (toDateSafe(c.createdAt)?.getTime() || 0) >= inicioMes.getTime()).length;
  const pendienteCobro = paquetes.reduce((a, p) => a + (p.importePendiente || 0), 0);

  // Ingresos por día (últimos 14 días)
  const ingresosPorDia = useMemo(() => {
    const dias: { name: string; ingresos: number; cobros: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      const siguiente = new Date(d); siguiente.setDate(siguiente.getDate() + 1);
      const delDia = pagos.filter(p => {
        if (!esCobro(p)) return false;
        const t = toDateSafe(p.fecha)?.getTime() || 0;
        return t >= d.getTime() && t < siguiente.getTime();
      });
      dias.push({
        name: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        ingresos: Math.round(delDia.reduce((a, p) => a + (p.monto || 0), 0) * 100) / 100,
        cobros: delDia.length,
      });
    }
    return dias;
  }, [pagos, hoy]);

  // Distribución por destino
  const porDestino = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const p of paquetes) {
      const d = p.destino || 'Sin destino';
      conteo[d] = (conteo[d] || 0) + 1;
    }
    const ordenado = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
    const top = ordenado.slice(0, 5).map(([name, value]) => ({ name, value }));
    const resto = ordenado.slice(5).reduce((a, [, v]) => a + v, 0);
    if (resto > 0) top.push({ name: 'Otros', value: resto });
    return top;
  }, [paquetes]);

  // Paquetes por estado
  const porEstado = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const p of paquetes) {
      const e = p.estado || 'Sin estado';
      conteo[e] = (conteo[e] || 0) + 1;
    }
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  }, [paquetes]);

  // Rendimiento real por agente/operador
  const porAgente = useMemo(() => {
    const nombres: Record<string, string> = {};
    for (const u of usuarios) nombres[u.id] = u.name || u.email || u.id;
    const stats: Record<string, { paquetes: number; kilos: number; ingresos: number }> = {};
    for (const p of paquetes) {
      const id = p.operadorId || 'desconocido';
      (stats[id] ||= { paquetes: 0, kilos: 0, ingresos: 0 });
      stats[id].paquetes++;
      stats[id].kilos += p.peso || 0;
    }
    for (const pago of pagos) {
      if (!esCobro(pago)) continue;
      const id = pago.agenteId || 'desconocido';
      (stats[id] ||= { paquetes: 0, kilos: 0, ingresos: 0 });
      stats[id].ingresos += pago.monto || 0;
    }
    return Object.entries(stats)
      .map(([id, s]) => ({ id, nombre: nombres[id] || 'Desconocido', ...s }))
      .sort((a, b) => b.ingresos - a.ingresos);
  }, [paquetes, pagos, usuarios]);

  // Beneficio por lote (ingresos de sus paquetes vs gastos asociados + costes estimados)
  const porLote = useMemo(() => {
    const gastosPorLote: Record<string, number> = {};
    for (const g of gastos) {
      if (g.loteId) gastosPorLote[g.loteId] = (gastosPorLote[g.loteId] || 0) + (g.monto || 0);
    }
    return lotes.map(l => {
      const paquetesLote = paquetes.filter(p => p.loteId === l.id);
      const ingresos = paquetesLote.reduce((a, p) => a + (p.precioFinal || 0), 0) || l.ingresosEstimados || 0;
      const gastosLote = (gastosPorLote[l.id] || 0) + (l.costesEstimados || 0);
      return {
        id: l.id,
        codigo: l.codigo,
        estado: l.estado,
        ruta: l.ruta || '',
        paquetes: paquetesLote.length || l.totalPaquetes || 0,
        ingresos: Math.round(ingresos * 100) / 100,
        gastos: Math.round(gastosLote * 100) / 100,
        beneficio: Math.round((ingresos - gastosLote) * 100) / 100,
      };
    }).sort((a, b) => b.beneficio - a.beneficio);
  }, [lotes, paquetes, gastos]);

  const kpis = [
    { label: 'Ingresos del Mes', value: eur(ingresosMes), icon: Wallet, color: 'text-green-600' },
    { label: 'Gastos del Mes', value: eur(gastosMes), icon: Receipt, color: 'text-tp-red' },
    { label: 'Beneficio del Mes', value: eur(ingresosMes - gastosMes), icon: TrendingUp, color: ingresosMes - gastosMes >= 0 ? 'text-green-600' : 'text-tp-red' },
    { label: 'Paquetes del Mes', value: String(paquetesMes), icon: Package, color: 'text-tp-blue' },
    { label: 'Clientes Nuevos (Mes)', value: String(clientesNuevosMes), icon: Users, color: 'text-tp-blue' },
    { label: 'Pendiente de Cobro', value: eur(pendienteCobro), icon: Wallet, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Reportes e Inteligencia de Negocio</h1>
          <p className="text-tp-blue/60 mt-1">Datos reales de operación, finanzas y logística</p>
        </div>
        <button
          onClick={() => exportarExcel('reporte-agentes', porAgente.map(a => ({
            Agente: a.nombre, Paquetes: a.paquetes, 'Kilos': Math.round(a.kilos * 10) / 10, 'Ingresos (€)': Math.round(a.ingresos * 100) / 100,
          })))}
          disabled={porAgente.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exportar Rendimiento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm">
            <kpi.icon className={cn("w-5 h-5 mb-3", kpi.color)} />
            <div className="text-xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-[10px] text-tp-blue/50 font-bold uppercase tracking-wider mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <h3 className="font-bold text-tp-blue mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-tp-red" /> Ingresos por Día (últimos 14 días)
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresosPorDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [name === 'ingresos' ? eur(Number(value)) : value, name === 'ingresos' ? 'Ingresos' : 'Cobros']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ingresos" fill="#00314F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <h3 className="font-bold text-tp-blue mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-tp-red" /> Distribución por Destino
          </h3>
          {porDestino.length === 0 ? (
            <p className="text-sm text-tp-blue/40 italic py-12 text-center">Sin datos de envíos todavía.</p>
          ) : (
            <>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porDestino} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {porDestino.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {porDestino.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="font-bold text-tp-blue truncate">{d.name}</span>
                    <span className="text-tp-blue/50 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Paquetes por estado */}
      <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
        <h3 className="font-bold text-tp-blue mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-tp-red" /> Paquetes por Estado
        </h3>
        <div className="flex flex-wrap gap-3">
          {porEstado.length === 0 && <p className="text-sm text-tp-blue/40 italic">Sin paquetes registrados.</p>}
          {porEstado.map(([estado, count]) => (
            <div key={estado} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl">
              <ChipEstado estado={estado} />
              <span className="font-black text-tp-blue">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento por agente */}
        <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-hidden">
          <div className="p-5 border-b border-tp-gray-soft">
            <h3 className="font-bold text-tp-blue flex items-center gap-2"><Users className="w-4 h-4 text-tp-red" /> Rendimiento por Agente / Operador</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                <tr>
                  <th className="px-5 py-3">Agente</th>
                  <th className="px-5 py-3">Paquetes</th>
                  <th className="px-5 py-3">Kilos</th>
                  <th className="px-5 py-3 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-gray-soft">
                {porAgente.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-tp-blue/40 italic">Sin datos todavía.</td></tr>
                )}
                {porAgente.slice(0, 10).map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-tp-blue">{a.nombre}</td>
                    <td className="px-5 py-3 text-tp-blue/70">{a.paquetes}</td>
                    <td className="px-5 py-3 text-tp-blue/70">{a.kilos.toFixed(1)} kg</td>
                    <td className="px-5 py-3 text-right font-black text-tp-blue">{eur(a.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Beneficio por lote */}
        <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-hidden">
          <div className="p-5 border-b border-tp-gray-soft flex justify-between items-center">
            <h3 className="font-bold text-tp-blue flex items-center gap-2"><Boxes className="w-4 h-4 text-tp-red" /> Beneficio por Lote</h3>
            <button
              onClick={() => exportarExcel('beneficio-lotes', porLote.map(l => ({
                Lote: l.codigo, Estado: l.estado, Ruta: l.ruta, Paquetes: l.paquetes,
                'Ingresos (€)': l.ingresos, 'Gastos (€)': l.gastos, 'Beneficio (€)': l.beneficio,
              })))}
              disabled={porLote.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-tp-blue-light text-tp-blue rounded-lg text-xs font-bold hover:bg-tp-gray-soft transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                <tr>
                  <th className="px-5 py-3">Lote</th>
                  <th className="px-5 py-3">Ingresos</th>
                  <th className="px-5 py-3">Gastos</th>
                  <th className="px-5 py-3 text-right">Beneficio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-gray-soft">
                {porLote.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-tp-blue/40 italic">Aún no hay lotes creados.</td></tr>
                )}
                {porLote.slice(0, 10).map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-tp-blue">{l.codigo}</span>
                      <span className="ml-2"><ChipEstado estado={l.estado} /></span>
                    </td>
                    <td className="px-5 py-3 text-tp-blue/70">{eur(l.ingresos)}</td>
                    <td className="px-5 py-3 text-tp-red/80">{eur(l.gastos)}</td>
                    <td className={cn("px-5 py-3 text-right font-black", l.beneficio >= 0 ? "text-green-700" : "text-tp-red")}>{eur(l.beneficio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
