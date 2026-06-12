import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { 
  Calculator, 
  TrendingUp, 
  Scale, 
  MapPin, 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#00314F', '#EE293B', '#004a78', '#D91F33', '#64748B'];

// Datos de ejemplo para visualización
const dataProvincias = [
  { name: 'La Habana', kilos: 450, ingresos: 2800 },
  { name: 'Santiago', kilos: 320, ingresos: 1950 },
  { name: 'Camagüey', kilos: 210, ingresos: 1200 },
  { name: 'Holguín', kilos: 180, ingresos: 1100 },
  { name: 'Matanzas', kilos: 150, ingresos: 950 },
];

const dataAgentes = [
  { name: 'Juan Pérez', envios: 85, kilos: 240, ingresos: 1500 },
  { name: 'Elena Gómez', envios: 62, kilos: 180, ingresos: 1100 },
  { name: 'Roberto Díaz', envios: 45, kilos: 120, ingresos: 850 },
  { name: 'Ana Ruiz', envios: 38, kilos: 95, ingresos: 600 },
];

export function Contabilidad() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentIdParam = searchParams.get('agente');
  
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedAgent, setSelectedAgent] = useState(agentIdParam || 'all');

  // Sync state with URL param
  useEffect(() => {
    if (agentIdParam) {
      setSelectedAgent(agentIdParam);
    } else {
      setSelectedAgent('all');
    }
  }, [agentIdParam]);

  const handleAgentChange = (id: string) => {
    setSelectedAgent(id);
    if (id === 'all') {
      searchParams.delete('agente');
    } else {
      searchParams.set('agente', id);
    }
    setSearchParams(searchParams);
  };
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [pagos, setPagos] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [globalPrice, setGlobalPrice] = useState<number>(0);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Global Price
    const fetchSettings = async () => {
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      if (settingsDoc.exists()) {
        setGlobalPrice(settingsDoc.data().globalWholesalePrice || 0);
      }
    };
    fetchSettings();

    // Fetch Agentes
    const qAgentes = query(collection(db, 'users'));
    const unsubAgentes = onSnapshot(qAgentes, (snap) => {
      setAgentes(snap.docs.filter(d => d.data().role === 'agente').map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Pagos
    const qPagos = query(collection(db, 'pagos'), orderBy('fecha', 'desc'), limit(100));
    const unsubPagos = onSnapshot(qPagos, (snap) => {
      setPagos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Fetch Paquetes
    const qPaquetes = query(collection(db, 'paquetes'), orderBy('createdAt', 'desc'), limit(100));
    const unsubPaquetes = onSnapshot(qPaquetes, (snap) => {
      setPaquetes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAgentes();
      unsubPagos();
      unsubPaquetes();
    };
  }, []);

  const handleUpdateGlobalPrice = async () => {
    setIsUpdatingPrice(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), { globalWholesalePrice: globalPrice }, { merge: true });
      alert("Precio global actualizado.");
    } catch (error) {
      console.error("Error updating global price:", error);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleConfirmPayment = async (pagoId: string) => {
    try {
      await updateDoc(doc(db, 'pagos', pagoId), {
        estado: 'Confirmado',
        confirmadoPor: user?.uid,
        fechaConfirmacion: serverTimestamp()
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  if (role === 'cliente') {
    return <Navigate to="/" />;
  }

  // Filter data
  const filteredPagos = pagos.filter(p => {
    if (selectedAgent !== 'all' && p.agenteId !== selectedAgent) return false;
    return true;
  });

  const totalIngresos = filteredPagos.reduce((acc, p) => acc + (p.monto || 0), 0);
  const totalKilos = paquetes
    .filter(p => selectedAgent === 'all' || p.operadorId === selectedAgent)
    .reduce((acc, p) => acc + (p.peso || 0), 0);
  const pendingConfirmations = filteredPagos.filter(p => p.estado === 'Pendiente').length;
  const accountsReceivable = filteredPagos.filter(p => p.estado === 'Pendiente').reduce((acc, p) => acc + (p.monto || 0), 0);

  // Stats for charts
  const statsByProvince = dataProvincias; // Keep mock for now or calculate from real data if needed
  const statsByAgent = agentes.map(a => {
    const agentPagos = pagos.filter(p => p.agenteId === a.id);
    return {
      name: a.name,
      ingresos: agentPagos.reduce((acc, p) => acc + (p.monto || 0), 0),
      kilos: paquetes.filter(p => p.operadorId === a.id).reduce((acc, p) => acc + (p.peso || 0), 0)
    };
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-tp-blue">
              {selectedAgent !== 'all' ? `Contabilidad: ${agentes.find(a => a.id === selectedAgent)?.name || 'Cargando...'}` : 'Contabilidad y Finanzas'}
            </h1>
            {selectedAgent !== 'all' && (
              <button 
                onClick={() => handleAgentChange('all')}
                className="text-[10px] font-bold text-tp-red bg-tp-red/10 px-2 py-0.5 rounded-full hover:bg-tp-red hover:text-white transition-all uppercase"
              >
                Ver Global
              </button>
            )}
          </div>
          <p className="text-tp-blue/60 text-sm">
            {selectedAgent !== 'all' 
              ? `Resumen financiero detallado para el agente seleccionado`
              : 'Control de ingresos, pesaje por provincia y rendimiento de agentes'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Exportar Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-tp-blue text-white rounded-xl text-sm font-medium hover:bg-[#004a78] transition-colors">
            <Calendar className="w-4 h-4" /> Período: {timeRange === '30d' ? 'Último Mes' : 'Personalizado'}
          </button>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-blue-light rounded-lg">
              <DollarSign className="w-5 h-5 text-tp-blue" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+15%</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">€{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Ingresos Totales</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-red/5 rounded-lg">
              <Scale className="w-5 h-5 text-tp-red" />
            </div>
            <span className="text-xs font-bold text-tp-blue bg-tp-blue-light px-2 py-1 rounded-full">Meta: 2T</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">{totalKilos.toFixed(1)} Kg</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Total Kilos Enviados</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-blue-light rounded-lg">
              <Users className="w-5 h-5 text-tp-blue" />
            </div>
            <span className="text-xs font-bold text-tp-blue/40">Promedio</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">€{(totalKilos > 0 ? totalIngresos / totalKilos : 0).toFixed(2)}</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Ingreso por Kilo</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Calculator className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs font-bold text-tp-red bg-red-50 px-2 py-1 rounded-full">{pendingConfirmations} Pend.</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">€{accountsReceivable.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Cuentas por Cobrar</div>
        </div>
      </div>

      {/* Configuración Global (Solo Admin) */}
      {role === 'admin' && (
        <div className="bg-tp-blue p-6 rounded-2xl text-white shadow-lg shadow-tp-blue/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Precio Mayorista Global</h3>
              <p className="text-white/60 text-sm">Define el precio base por kilo para todos los agentes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">€</span>
              <input 
                type="number" 
                step="0.01"
                value={isNaN(globalPrice) ? '' : globalPrice}
                onChange={(e) => setGlobalPrice(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 font-bold"
              />
            </div>
            <button 
              onClick={handleUpdateGlobalPrice}
              disabled={isUpdatingPrice}
              className="px-6 py-2 bg-white text-tp-blue rounded-xl font-bold hover:bg-tp-blue-light transition-colors disabled:opacity-50"
            >
              {isUpdatingPrice ? '...' : 'Actualizar'}
            </button>
          </div>
        </div>
      )}

      {/* Herramientas y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-tp-gray-soft flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
          <input 
            type="text" 
            placeholder="Buscar por factura, guía o cliente..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
              {role === 'admin' && (
                <select 
                  value={selectedAgent}
                  onChange={(e) => handleAgentChange(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                >
                  <option value="all">Todos los Agentes</option>
                  {agentes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
          <select 
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
          >
            <option value="all">Todas las Provincias</option>
            <option value="habana">La Habana</option>
            <option value="santiago">Santiago</option>
            <option value="camaguey">Camagüey</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-tp-blue-light text-tp-blue rounded-xl text-sm font-bold hover:bg-tp-blue hover:text-white transition-all">
            <Filter className="w-4 h-4" /> Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Gráficos de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Kilos por Provincia */}
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-tp-blue flex items-center gap-2">
              <MapPin className="w-4 h-4 text-tp-red" /> Análisis por Provincia
            </h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-tp-blue flex items-center gap-1"><div className="w-2 h-2 bg-tp-blue rounded-full"></div> Ingresos</span>
              <span className="text-tp-red flex items-center gap-1"><div className="w-2 h-2 bg-tp-red rounded-full"></div> Kilos</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProvincias}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#EE293B', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar yAxisId="left" dataKey="ingresos" fill="#00314F" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="kilos" fill="#EE293B" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rendimiento de Agentes (Solo Admin) */}
        {role === 'admin' && (
          <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
            <h3 className="font-bold text-tp-blue mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-tp-blue" /> Rendimiento por Agente
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsByAgent.filter(s => s.ingresos > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="ingresos"
                  >
                    {statsByAgent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {statsByAgent.map((agent, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <div className="text-xs">
                      <span className="font-bold text-tp-blue">{agent.name}</span>
                      <span className="text-tp-blue/50 ml-2">{agent.kilos.toFixed(1)} Kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla Detallada de Contabilidad */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-hidden">
        <div className="p-6 border-b border-tp-gray-soft flex items-center justify-between">
          <h3 className="font-bold text-tp-blue">Detalle de Transacciones</h3>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-tp-blue px-3 py-1.5 bg-gray-50 rounded-lg border border-tp-gray-soft">Hoy</button>
            <button className="text-xs font-bold text-tp-blue/40 px-3 py-1.5 hover:text-tp-blue transition-colors">Esta Semana</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">Referencia</th>
                <th className="px-6 py-4">Agente / Oficina</th>
                <th className="px-6 py-4">Provincia</th>
                <th className="px-6 py-4">Peso (Kg)</th>
                <th className="px-6 py-4">Ingreso</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {filteredPagos.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-tp-blue">{row.paqueteId}</td>
                  <td className="px-6 py-4 text-tp-blue/70">
                    {agentes.find(a => a.id === row.agenteId)?.name || 'Desconocido'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-tp-blue-light text-tp-blue rounded text-[10px] font-bold uppercase">
                      {paquetes.find(p => p.id === row.paqueteId)?.destino || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {paquetes.find(p => p.id === row.paqueteId)?.peso || 0} Kg
                  </td>
                  <td className="px-6 py-4 font-black text-tp-blue">€{row.monto.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase",
                        row.estado === 'Confirmado' ? "text-green-600" : row.estado === 'Pagado' ? "text-blue-600" : "text-yellow-600"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                          row.estado === 'Confirmado' ? "bg-green-600" : row.estado === 'Pagado' ? "bg-blue-600" : "bg-yellow-600"
                        )}></div>
                        {row.estado}
                      </div>
                      {role === 'admin' && row.estado !== 'Confirmado' && (
                        <button 
                          onClick={() => handleConfirmPayment(row.id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Confirmar Pago"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
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
