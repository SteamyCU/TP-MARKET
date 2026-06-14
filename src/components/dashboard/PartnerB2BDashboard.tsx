import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Box, TrendingUp, CheckCircle2, Wallet, FileText, Key, Plus, ArrowRight, Download, Search, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { subscribePaquetes } from '../../services/paquetes';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { cn } from '../../lib/utils';
import { ChipEstado } from '../ChipEstado';
import { B2BInvoicePDF } from '../B2BInvoicePDF';
import { useReactToPrint } from 'react-to-print';
import { XCircle } from 'lucide-react';

export function PartnerB2BDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Factura_${selectedInvoice?.month}_${profile?.businessName || 'B2B'}`,
  });

  const [stats, setStats] = useState({
    totalKilos: 0,
    activeShipments: 0,
    pendingInvoice: 0,
    wholesaleRate: '€4.20/kg'
  });

  useEffect(() => {
    if (authLoading || !user?.uid) return;

    // Fetch packages sent by this partner
    const unsubscribePaquetes = subscribePaquetes({ partnerId: user.uid, limit: 50 }, (data) => {
      const kilos = data.reduce((sum, p) => sum + ((p.peso as number) || 0), 0);
      setPaquetes(data);
      setStats(prev => ({
        ...prev,
        totalKilos: kilos,
        activeShipments: data.filter(p => p.estado !== 'Entregado').length
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'paquetes (partner)');
      console.error("Error in partner paquetes snapshot:", error);
    });

    // Fetch invoices
    const qInvoices = query(
      collection(db, 'b2b_invoices'),
      where('partnerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      const data: any[] = [];
      let pending = 0;
      snapshot.forEach((doc) => {
        const inv = { id: doc.id, ...doc.data() } as any;
        data.push(inv);
        if (inv.status === 'pending') {
          pending += (inv.totalAmount || 0);
        }
      });
      setInvoices(data);
      setStats(prev => ({
        ...prev,
        pendingInvoice: pending
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'b2b_invoices (partner)');
      console.error("Error in partner invoices snapshot:", error);
    });

    return () => {
      unsubscribePaquetes();
      unsubscribeInvoices();
    };
  }, [user, authLoading]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-tp-blue rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs opacity-80">Portal de Socio B2B</span>
          </div>
          <h1 className="text-3xl font-black mb-2">{profile?.businessName || profile?.name}</h1>
          <p className="text-white/70 max-w-xl">
            Gestión logística mayorista. Crea envíos masivos, descarga facturas y gestiona tu integración API.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Kilos Totales', value: `${stats.totalKilos.toFixed(2)} kg`, icon: Box, color: 'text-tp-red' },
          { label: 'Envíos Activos', value: stats.activeShipments.toString(), icon: Package, color: 'text-blue-500' },
          { label: 'Factura Pendiente', value: `€${stats.pendingInvoice.toFixed(2)}`, icon: Wallet, color: 'text-green-500' },
          { label: 'Tasa Mayorista', value: stats.wholesaleRate, icon: TrendingUp, color: 'text-orange-500' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm hover:shadow-md transition-shadow">
            <kpi.icon className={cn("w-6 h-6 mb-4", kpi.color)} />
            <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipments Management */}
          <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-tp-blue">Gestión de Envíos</h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-tp-blue" : "text-tp-blue/40")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-tp-blue" : "text-tp-blue/40")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard/recepcion')}
                className="bg-tp-red text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#D91F33] transition-all shadow-md flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> NUEVO ENVÍO B2B
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="text" 
                  placeholder="Buscar por tracking, cliente o destino..." 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm font-medium"
                />
              </div>

              {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                      <tr>
                        <th className="px-5 py-3">Tracking</th>
                        <th className="px-5 py-3">Peso</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Destino</th>
                        <th className="px-5 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tp-gray-soft">
                      {paquetes.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4 font-bold text-tp-blue">{p.tracking}</td>
                          <td className="px-5 py-4 text-tp-blue/70">{p.peso} kg</td>
                          <td className="px-5 py-4"><ChipEstado estado={p.estado} /></td>
                          <td className="px-5 py-4 text-tp-blue/70">{p.destino}</td>
                          <td className="px-5 py-4 text-right">
                            <button className="text-tp-blue hover:text-tp-red font-bold transition-colors">Detalles</button>
                          </td>
                        </tr>
                      ))}
                      {paquetes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-tp-blue/30 italic">No hay envíos registrados aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paquetes.map((p, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-tp-gray-soft hover:border-tp-blue/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-black text-tp-blue">{p.tracking}</span>
                        <ChipEstado estado={p.estado} />
                      </div>
                      <div className="flex justify-between text-xs text-tp-blue/60 mb-4">
                        <span>{p.peso} kg</span>
                        <span>{p.destino}</span>
                      </div>
                      <button className="w-full py-2 bg-white border border-tp-gray-soft rounded-lg text-xs font-bold text-tp-blue hover:bg-tp-blue hover:text-white transition-all">
                        GESTIONAR
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Integration */}
          <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tp-red/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-lg font-bold text-tp-blue mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-tp-red" />
              Integración API
            </h2>
            <p className="text-xs text-tp-blue/60 mb-6 leading-relaxed">
              Usa tu API Key para integrar To Paquete directamente en tu E-commerce o ERP.
            </p>
            <div className="bg-gray-50 border border-tp-gray-soft rounded-2xl p-4 mb-4">
              <div className="text-[10px] font-bold text-tp-blue/40 uppercase mb-1">Tu API Key (Live)</div>
              <div className="text-xs font-mono text-tp-blue/70 break-all">{profile?.apiKey || 'NO GENERADA'}</div>
            </div>
            <button className="w-full bg-tp-blue text-white py-3 rounded-xl font-bold text-xs hover:bg-[#004a78] transition-all flex items-center justify-center gap-2">
              VER DOCUMENTACIÓN <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Invoices */}
          <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
            <h2 className="text-lg font-bold text-tp-blue mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-tp-blue" />
              Facturación Mensual
            </h2>
            <div className="space-y-4">
              {invoices.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-tp-gray-soft">
                  <div className="flex flex-col">
                    <span className="font-bold text-tp-blue text-sm">Factura {inv.month}</span>
                    <span className="text-[10px] text-tp-blue/50">{inv.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-tp-blue text-sm">€{(inv.totalAmount || 0).toFixed(2)}</span>
                    <button 
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsViewInvoiceModalOpen(true);
                      }}
                      className="p-2 bg-white rounded-lg border border-tp-gray-soft text-tp-blue hover:text-tp-red transition-colors"
                      title="Descargar Factura"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="text-center py-8 text-tp-blue/30 italic text-sm">No hay facturas aún.</div>
              )}
              <button className="w-full py-3 text-xs font-bold text-tp-blue/50 hover:text-tp-red transition-colors uppercase tracking-widest">
                Ver Todo el Historial
              </button>
            </div>
          </div>
        </div>
      </div>

      {isViewInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Vista Previa de Factura</h3>
              <button onClick={() => setIsViewInvoiceModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              <div className="shadow-xl">
                <B2BInvoicePDF 
                  ref={invoiceRef} 
                  invoice={selectedInvoice} 
                  partner={profile} 
                />
              </div>
            </div>
            <div className="p-6 bg-white border-t border-tp-gray-soft flex justify-end gap-3">
              <button 
                onClick={() => handlePrint()}
                className="px-6 py-2 bg-tp-red text-white font-bold rounded-xl hover:bg-[#D91F33] transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Descargar PDF
              </button>
              <button 
                onClick={() => setIsViewInvoiceModalOpen(false)}
                className="px-6 py-2 bg-tp-blue text-white font-bold rounded-xl hover:bg-[#004a78] transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
