import React, { useState, useEffect, useMemo, useRef } from 'react';
import { subscribePagos } from '../services/pagos';
import { Wallet, CreditCard, Banknote, Download, CheckCircle2, Clock, Printer } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, type ColumnaDef } from '../components/DataTable';
import { NuevoCobroModal } from '../components/NuevoCobroModal';
import { ComprobantePago, type DatosComprobante } from '../components/documentos/ComprobantePago';
import { exportarExcel } from '../lib/excel';
import { METODOS_PAGO } from '../constants/estados';

interface Pago {
  id: string;
  paqueteId: string;
  monto: number;
  metodo: string;
  estado: string;
  fecha: any;
  agenteId: string;
}

const fmtFecha = (fecha: any) =>
  fecha?.toDate ? format(fecha.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Reciente';

export function Pagos() {
  const { role } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<DatosComprobante | null>(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const comprobanteRef = useRef<HTMLDivElement>(null);
  const imprimirComprobante = useReactToPrint({ contentRef: comprobanteRef });

  useEffect(() => {
    if (pendingPrint && comprobante) {
      imprimirComprobante();
      setPendingPrint(false);
    }
  }, [pendingPrint, comprobante]);

  const verComprobante = (pago: Pago & { nota?: string }) => {
    setComprobante({
      referencia: pago.id,
      tracking: pago.paqueteId,
      fecha: pago.fecha?.toDate ? pago.fecha.toDate() : undefined,
      monto: pago.monto || 0,
      metodo: pago.metodo,
      estado: pago.estado,
      nota: pago.nota,
    });
    setPendingPrint(true);
  };

  useEffect(() => {
    const unsubscribe = subscribePagos({ limit: 500 }, (pagosData) => {
      setPagos(pagosData as unknown as Pago[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const pagosFiltrados = useMemo(() => pagos.filter(p =>
    (!filtroMetodo || p.metodo === filtroMetodo) &&
    (!filtroEstado || p.estado === filtroEstado)
  ), [pagos, filtroMetodo, filtroEstado]);

  // Guardia de rol después de los hooks para no romper su orden
  if (role === 'cliente') {
    return <Navigate to="/" />;
  }

  const totalRecaudado = pagosFiltrados.filter(p => p.estado !== 'Pendiente').reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const totalTarjeta = pagosFiltrados.filter(p => p.metodo === 'Tarjeta' && p.estado !== 'Pendiente').reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const pendientes = pagosFiltrados.filter(p => p.estado === 'Pendiente');
  const totalPendiente = pendientes.reduce((acc, curr) => acc + (curr.monto || 0), 0);

  const filaExport = (p: Pago) => ({
    'ID Paquete': p.paqueteId,
    'Fecha': fmtFecha(p.fecha),
    'Método': p.metodo,
    'Monto (€)': p.monto || 0,
    'Estado': p.estado,
    'Agente': p.agenteId,
  });

  const columnas: ColumnaDef<Pago>[] = [
    {
      key: 'paqueteId', label: 'ID Paquete', sortable: true,
      render: (p) => (
        <div>
          <div className="font-bold text-tp-blue">{p.paqueteId}</div>
          <div className="text-[10px] text-tp-blue/40 uppercase font-bold tracking-wider">Ref: {p.id.slice(0, 8)}</div>
        </div>
      ),
    },
    {
      key: 'fecha', label: 'Fecha y Hora', sortable: true,
      valor: (p) => p.fecha?.toDate ? p.fecha.toDate().getTime() : 0,
      render: (p) => <span className="text-tp-blue/70">{fmtFecha(p.fecha)}</span>,
    },
    {
      key: 'metodo', label: 'Método', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2 text-tp-blue/70">
          {p.metodo === 'Efectivo' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
          {p.metodo}
        </div>
      ),
    },
    {
      key: 'monto', label: 'Monto', sortable: true,
      valor: (p) => p.monto || 0,
      render: (p) => <span className="font-black text-tp-blue">€{(p.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'estado', label: 'Estado', sortable: true,
      render: (p) => (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          p.estado === 'Pendiente' ? "bg-yellow-50 text-yellow-600 border border-yellow-100" : "bg-green-50 text-green-600 border border-green-100"
        )}>
          {p.estado === 'Pendiente' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {p.estado}
        </div>
      ),
    },
  ];

  const selectClass = "px-3 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none cursor-pointer";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Cobros y Pagos</h1>
          <p className="text-tp-blue/60 text-sm">Registro de transacciones y estados de pago de paquetes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarExcel('reporte-pagos', pagosFiltrados.map(filaExport))}
            disabled={pagosFiltrados.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Exportar Reporte
          </button>
          <button
            onClick={() => setIsCobroModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tp-blue text-white rounded-xl text-sm font-medium hover:bg-[#004a78] transition-colors"
          >
            <Wallet className="w-4 h-4" /> Nuevo Cobro
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{mensaje}</p>
        </div>
      )}

      {/* Resumen de Caja (calculado sobre los pagos cargados) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tp-blue p-6 rounded-2xl text-white shadow-lg shadow-tp-blue/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">{pagosFiltrados.length} pagos</span>
          </div>
          <div className="text-3xl font-black">€{totalRecaudado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-white/60 font-medium mt-1">Total Recaudado</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-blue-light rounded-lg">
              <CreditCard className="w-5 h-5 text-tp-blue" />
            </div>
          </div>
          <div className="text-2xl font-black text-tp-blue">€{totalTarjeta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Pagos con Tarjeta</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tp-blue-light rounded-lg">
              <Clock className="w-5 h-5 text-tp-blue" />
            </div>
            <span className="text-xs font-bold text-tp-red bg-red-50 px-2 py-1 rounded-full">{pendientes.length} Pendientes</span>
          </div>
          <div className="text-2xl font-black text-tp-blue">€{totalPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-tp-blue/50 font-medium mt-1">Pendientes de Cobro</div>
        </div>
      </div>

      {/* Tabla de Transacciones */}
      <DataTable
        datos={pagosFiltrados}
        columnas={columnas}
        isLoading={loading}
        buscarEn={(p) => `${p.paqueteId} ${p.agenteId} ${p.metodo}`}
        placeholderBusqueda="Buscar por ID de paquete o agente..."
        filtros={
          <div className="flex gap-2">
            <select value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)} className={selectClass}>
              <option value="">Todos los métodos</option>
              {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={selectClass}>
              <option value="">Todos los estados</option>
              {['Pagado', 'Pendiente', 'Confirmado'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        }
        accionesFila={(p) => (
          <button
            onClick={() => verComprobante(p)}
            className="text-tp-blue hover:text-tp-red font-bold transition-colors text-xs flex items-center gap-1"
            title="Imprimir comprobante de pago"
          >
            <Printer className="w-3.5 h-3.5" /> Comprobante
          </button>
        )}
        exportarNombre="pagos"
        exportarFila={filaExport}
        porPagina={20}
        vacio="No hay transacciones registradas todavía."
      />

      {/* Comprobante oculto para impresión */}
      {comprobante && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ComprobantePago ref={comprobanteRef} comprobante={comprobante} />
        </div>
      )}

      <NuevoCobroModal
        open={isCobroModalOpen}
        onClose={() => setIsCobroModalOpen(false)}
        onDone={(tracking, monto) => {
          setMensaje(`Cobro de €${monto.toFixed(2)} registrado sobre ${tracking}.`);
          setTimeout(() => setMensaje(null), 4000);
        }}
      />
    </div>
  );
}
