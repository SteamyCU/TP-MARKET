import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Wallet, CreditCard, Banknote, ArrowUpRight, ArrowDownRight, Search, Filter, Calendar, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pago {
  id: string;
  paqueteId: string;
  monto: number;
  metodo: string;
  estado: string;
  fecha: any;
  agenteId: string;
}

export function Pagos() {
  const { role } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  if (role === 'cliente') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    const q = query(collection(db, 'pagos'), orderBy('fecha', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pagosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pago[];
      setPagos(pagosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalRecaudado = pagos.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Cobros y Pagos</h1>
          <p className="text-tp-blue/60 text-sm">Registro de transacciones y estados de pago de paquetes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Exportar Reporte
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-tp-blue text-white rounded-xl text-sm font-medium hover:bg-[#004a78] transition-colors">
            <Wallet className="w-4 h-4" /> Nuevo Cobro
          </button>
        </div>
      </div>

      {/* Resumen de Caja */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tp-blue p-6 rounded-2xl text-white shadow-lg shadow-tp-blue/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Hoy</span>
          </div>
          <div className="text-3xl font-black">€{totalRecaudado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-white/60 font-medium mt-1">Total Recaudado (Muestra)</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-blue-light rounded-lg">
              <CreditCard className="w-5 h-5 text-tp-blue" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+8.4%</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">€4,120.50</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Pagos con Tarjeta</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-blue-light rounded-lg">
              <Clock className="w-5 h-5 text-tp-blue" />
            </div>
            <span className="text-xs font-bold text-tp-red bg-red-50 px-2 py-1 rounded-full">12 Pendientes</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">€850.00</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Pendientes de Cobro</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-tp-gray-soft flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
          <input 
            type="text" 
            placeholder="Buscar por ID de paquete o agente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue">
            <Calendar className="w-4 h-4" /> Fecha
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue">
            <Filter className="w-4 h-4" /> Método
          </button>
        </div>
      </div>

      {/* Tabla de Transacciones */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">ID Paquete</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-2 border-tp-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-tp-blue/50">Cargando transacciones...</p>
                  </td>
                </tr>
              ) : pagos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-tp-blue/50">
                    No hay transacciones registradas todavía.
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-tp-blue">{pago.paqueteId}</div>
                      <div className="text-[10px] text-tp-blue/40 uppercase font-bold tracking-wider">Ref: {pago.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-tp-blue/70">
                        {pago.fecha?.toDate ? format(pago.fecha.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Reciente'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-tp-blue/70">
                        {pago.metodo === 'Efectivo' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        {pago.metodo}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-tp-blue">
                      €{pago.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        pago.estado === 'Pagado' ? "bg-green-50 text-green-600 border border-green-100" : "bg-yellow-50 text-yellow-600 border border-yellow-100"
                      )}>
                        {pago.estado === 'Pagado' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {pago.estado}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-tp-blue font-bold hover:underline">Ver Recibo</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
