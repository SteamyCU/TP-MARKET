import React, { useState } from 'react';
import { BarChart3, TrendingUp, Package, Users, Wallet, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const dataEnvios = [
  { name: 'Lun', envios: 45, ingresos: 1200 },
  { name: 'Mar', envios: 52, ingresos: 1500 },
  { name: 'Mie', envios: 38, ingresos: 1100 },
  { name: 'Jue', envios: 65, ingresos: 2100 },
  { name: 'Vie', envios: 48, ingresos: 1400 },
  { name: 'Sab', envios: 24, ingresos: 800 },
  { name: 'Dom', envios: 15, ingresos: 400 },
];

const dataDestinos = [
  { name: 'La Habana', value: 400 },
  { name: 'Santiago', value: 300 },
  { name: 'Camagüey', value: 200 },
  { name: 'Holguín', value: 100 },
];

const COLORS = ['#00314F', '#EE293B', '#004a78', '#D91F33'];

export function Reportes() {
  const { role } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  if (role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Reportes e Inteligencia de Negocio</h1>
          <p className="text-tp-blue/60 text-sm">Análisis detallado de operaciones, ingresos y rendimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-tp-blue text-white rounded-xl text-sm font-medium hover:bg-[#004a78] transition-colors">
            <Calendar className="w-4 h-4" /> Rango: Últimos 7 días
          </button>
        </div>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', value: '€12,450.00', trend: '+12.5%', up: true, icon: Wallet, path: '/contabilidad' },
          { label: 'Paquetes Procesados', value: '287', trend: '+5.2%', up: true, icon: Package },
          { label: 'Nuevos Clientes', value: '42', trend: '-2.1%', up: false, icon: Users },
          { label: 'Eficiencia de Entrega', value: '94.2%', trend: '+0.8%', up: true, icon: TrendingUp },
        ].map((kpi, i) => (
          <Link 
            key={i} 
            to={kpi.path || '#'}
            className={cn(
              "bg-white p-6 rounded-2xl border border-tp-gray-soft transition-all",
              kpi.path ? "hover:shadow-md hover:border-tp-blue/20 cursor-pointer" : ""
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-tp-blue-light rounded-lg">
                <kpi.icon className="w-5 h-5 text-tp-blue" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                kpi.up ? "bg-green-50 text-green-600" : "bg-red-50 text-tp-red"
              )}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend}
              </div>
            </div>
            <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-xs text-tp-blue/50 font-medium mt-1">{kpi.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Envíos e Ingresos */}
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-tp-blue">Rendimiento Semanal</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-tp-blue rounded-full"></div>
                <span className="text-tp-blue/60">Envíos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-tp-red rounded-full"></div>
                <span className="text-tp-blue/60">Ingresos (€)</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataEnvios}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="envios" fill="#00314F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Destinos */}
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <h3 className="font-bold text-tp-blue mb-6">Distribución por Destino</h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataDestinos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataDestinos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pr-8">
              {dataDestinos.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <div className="text-xs font-bold text-tp-blue">{item.name}</div>
                  <div className="text-xs text-tp-blue/50 ml-auto">{((item.value / 1000) * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Rendimiento de Agentes */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-hidden">
        <div className="p-6 border-b border-tp-gray-soft flex items-center justify-between">
          <h3 className="font-bold text-tp-blue">Rendimiento por Agente</h3>
          <button className="text-tp-blue text-xs font-bold hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium">
              <tr>
                <th className="px-6 py-4">Agente</th>
                <th className="px-6 py-4">Oficina</th>
                <th className="px-6 py-4">Paquetes</th>
                <th className="px-6 py-4">Ingresos</th>
                <th className="px-6 py-4">Calificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {[
                { name: 'Juan Pérez', oficina: 'Madrid Centro', paquetes: 142, ingresos: '€5,420', rating: 4.8 },
                { name: 'Elena Gómez', oficina: 'Barcelona Port', paquetes: 98, ingresos: '€3,150', rating: 4.9 },
                { name: 'Roberto Díaz', oficina: 'Valencia Sur', paquetes: 47, ingresos: '€1,880', rating: 4.5 },
              ].map((agent, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-tp-blue">{agent.name}</td>
                  <td className="px-6 py-4 text-tp-blue/70">{agent.oficina}</td>
                  <td className="px-6 py-4 font-medium">{agent.paquetes}</td>
                  <td className="px-6 py-4 font-bold text-tp-blue">{agent.ingresos}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-bold">{agent.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
