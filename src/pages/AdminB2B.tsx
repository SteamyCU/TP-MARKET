import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, serverTimestamp, where, addDoc, orderBy } from 'firebase/firestore';
import { subscribeProfiles, createStaffProfile, updateProfileFields } from '../services/profiles';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Key,
  FileText,
  Package,
  AlertCircle,
  ExternalLink,
  Wallet,
  Box,
  Download,
  Settings
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface PartnerProfile {
  id: string;
  email: string;
  name: string;
  businessName: string;
  role: 'partner';
  tipoColaborador: 'empresa_b2b' | 'punto_pack';
  capacityPackages?: number;
  telefono?: string;
  dni?: string;
  direccion?: string;
  status: 'active' | 'suspended';
  apiKey?: string;
  createdAt?: any;
}

import { B2BInvoicePDF } from '../components/B2BInvoicePDF';
import { useReactToPrint } from 'react-to-print';

export function AdminB2B() {
  const { role: currentUserRole } = useAuth();
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);
  const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(null);
  
  const [newPartner, setNewPartner] = useState({
    email: '',
    name: '',
    businessName: '',
    tipoColaborador: 'empresa_b2b' as const,
    capacityPackages: 100,
    telefono: '',
    dni: '',
    direccion: ''
  });

  const [editFormData, setEditFormData] = useState({
    businessName: '',
    capacityPackages: 0,
    status: 'active' as 'active' | 'suspended',
    apiKey: '',
    direccion: '',
    telefono: ''
  });

  if (currentUserRole !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    const unsubscribe = subscribeProfiles({ role: 'partner' }, (profiles) => {
      setPartners(profiles as unknown as PartnerProfile[]);
      setLoading(false);
    });

    const qInvoices = query(collection(db, 'b2b_invoices'), orderBy('createdAt', 'desc'));
    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoicesData);
    });

    return () => {
      unsubscribe();
      unsubscribeInvoices();
    };
  }, []);

  const [isViewPackagesModalOpen, setIsViewPackagesModalOpen] = useState(false);
  const [partnerPackages, setPartnerPackages] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Factura_${selectedInvoice?.partnerName}_${selectedInvoice?.month}`,
  });

  const handleViewPackages = (partner: PartnerProfile) => {
    setSelectedPartner(partner);
    setIsViewPackagesModalOpen(true);
    
    const q = query(collection(db, 'paquetes'), where('partnerId', '==', partner.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartnerPackages(pkgs);
    });
    
    return unsubscribe;
  };

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const handleGenerateInvoice = async () => {
    if (!selectedPartner) return;
    setIsUpdating('invoice');
    try {
      // Filter packages for the month
      const startOfMonth = new Date(invoiceMonth + '-01T00:00:00');
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
      
      const pkgs = partnerPackages.filter(pkg => {
        const date = pkg.createdAt?.toDate();
        return date >= startOfMonth && date <= endOfMonth;
      });

      if (pkgs.length === 0) {
        alert("No hay paquetes para este partner en el mes seleccionado.");
        return;
      }

      const items = pkgs.map(pkg => ({
        tracking: pkg.tracking,
        peso: pkg.peso,
        precio: pkg.precioAplicado || 0,
        subtotal: pkg.peso * (pkg.precioAplicado || 0)
      }));

      const totalPeso = items.reduce((sum, item) => sum + item.peso, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

      const invoiceData = {
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.businessName,
        month: invoiceMonth,
        items,
        totalPeso,
        totalAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'b2b_invoices'), invoiceData);
      alert("Factura generada con éxito.");
      setIsInvoiceModalOpen(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Error al generar la factura.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating('new');
    try {
      await createStaffProfile('partner', newPartner.email, { ...newPartner, status: 'active' });
      setIsNewPartnerModalOpen(false);
      setNewPartner({ 
        email: '', 
        name: '', 
        businessName: '', 
        tipoColaborador: 'empresa_b2b', 
        capacityPackages: 100,
        telefono: '',
        dni: '',
        direccion: ''
      });
    } catch (error) {
      console.error("Error creating partner:", error);
      alert("Error al crear el partner.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleOpenEditPartner = (partner: PartnerProfile) => {
    setSelectedPartner(partner);
    setEditFormData({
      businessName: partner.businessName || '',
      capacityPackages: partner.capacityPackages || 0,
      status: partner.status || 'active',
      apiKey: partner.apiKey || '',
      direccion: partner.direccion || '',
      telefono: partner.telefono || ''
    });
    setIsEditPartnerModalOpen(true);
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setIsUpdating(selectedPartner.id);
    try {
      await updateProfileFields(selectedPartner.id, { ...editFormData });
      setIsEditPartnerModalOpen(false);
    } catch (error) {
      console.error("Error updating partner:", error);
      alert("Error al actualizar el partner.");
    } finally {
      setIsUpdating(null);
    }
  };

  const generateApiKey = () => {
    const key = 'tp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setEditFormData({ ...editFormData, apiKey: key });
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || partner.tipoColaborador === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const [activeTab, setActiveTab] = useState<'partners' | 'invoices'>('partners');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Gestión de Partners B2B</h1>
          <p className="text-tp-blue/60 text-sm">Administra empresas asociadas y procesos de facturación</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewPartnerModalOpen(true)}
            className="bg-tp-red hover:bg-[#D91F33] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-tp-red/20 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nuevo Partner
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Partners Activos', value: partners.length.toString(), icon: Building2, color: 'bg-tp-blue/10 text-tp-blue' },
          { label: 'Facturas Pendientes', value: invoices.filter(i => i.status === 'pending').length.toString(), icon: FileText, color: 'bg-tp-red/10 text-tp-red' },
          { label: 'Facturación Mes', value: `€${invoices.filter(i => i.month === new Date().toISOString().slice(0, 7)).reduce((sum, i) => sum + (i.totalAmount || 0), 0).toFixed(2)}`, icon: Wallet, color: 'bg-green-100 text-green-600' },
          { label: 'Capacidad Logística', value: partners.reduce((sum, p) => sum + (p.capacityPackages || 0), 0).toString(), icon: Box, color: 'bg-orange-100 text-orange-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", kpi.color)}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black text-tp-blue">{kpi.value}</div>
              <div className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-wider">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-tp-blue-light/30 p-1 rounded-xl w-fit border border-tp-blue/5">
        <button
          onClick={() => setActiveTab('partners')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'partners' ? "bg-white text-tp-blue shadow-sm" : "text-tp-blue/50 hover:text-tp-blue"
          )}
        >
          <Building2 className="w-4 h-4" /> Directorio de Partners
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'invoices' ? "bg-white text-tp-blue shadow-sm" : "text-tp-blue/50 hover:text-tp-blue"
          )}
        >
          <FileText className="w-4 h-4" /> Historial de Facturación
        </button>
      </div>

      {activeTab === 'partners' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-2xl border border-tp-gray-soft flex flex-col md:flex-row gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
              <input 
                type="text" 
                placeholder="Buscar por empresa, contacto o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm font-bold text-tp-blue"
              >
                <option value="all">Todos los tipos</option>
                <option value="empresa_b2b">Empresa B2B</option>
                <option value="punto_pack">Punto Pack</option>
              </select>
              <button className="p-2.5 bg-tp-blue-light text-tp-blue rounded-xl hover:bg-tp-blue hover:text-white transition-all active:scale-95">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista de Partners */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-tp-blue/70 font-bold border-b border-tp-gray-soft">
                  <tr>
                    <th className="px-6 py-5 uppercase tracking-wider text-[10px]">Empresa / Contacto</th>
                    <th className="px-6 py-5 uppercase tracking-wider text-[10px]">Tipo / Estado</th>
                    <th className="px-6 py-5 uppercase tracking-wider text-[10px]">Capacidad</th>
                    <th className="px-6 py-5 uppercase tracking-wider text-[10px]">Ubicación</th>
                    <th className="px-6 py-5 uppercase tracking-wider text-[10px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-gray-soft">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="w-8 h-8 border-2 border-tp-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-tp-blue/50 font-medium">Cargando partners...</p>
                      </td>
                    </tr>
                  ) : filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-tp-blue/50 italic">
                        No se encontraron partners que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-tp-blue-light/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-tp-blue text-white flex items-center justify-center font-black italic shadow-sm group-hover:scale-110 transition-transform">
                              {partner.businessName?.charAt(0) || partner.email?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-tp-blue">{partner.businessName}</div>
                              <div className="text-[11px] text-tp-blue/50 flex items-center gap-1 font-bold">
                                <Mail className="w-3 h-3" /> {partner.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit shadow-sm",
                              partner.tipoColaborador === 'empresa_b2b' ? "bg-tp-blue text-white" : "bg-tp-red text-white"
                            )}>
                              {partner.tipoColaborador === 'empresa_b2b' ? 'Empresa B2B' : 'Punto Pack'}
                            </div>
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit",
                              partner.status === 'active' ? "text-green-600 bg-green-50" : "text-tp-red bg-red-50"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", partner.status === 'active' ? "bg-green-500" : "bg-tp-red")}></div>
                              {partner.status === 'active' ? 'Activo' : 'Suspendido'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-[10px] text-tp-blue/40 font-black uppercase flex items-center gap-1">
                              <Package className="w-3 h-3" /> Capacidad: {partner.capacityPackages || 0}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-tp-blue/70 flex items-center gap-1.5 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-tp-red" /> {partner.direccion || 'Sin dirección'}
                            </div>
                            <div className="text-xs text-tp-blue/70 flex items-center gap-1.5 font-bold">
                              <Phone className="w-3.5 h-3.5 text-tp-blue/40" /> {partner.telefono || 'Sin teléfono'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleViewPackages(partner)}
                              className="p-2.5 text-tp-blue/40 hover:text-tp-blue hover:bg-tp-blue-light rounded-xl transition-all active:scale-90"
                              title="Ver Paquetes"
                            >
                              <Package className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleOpenEditPartner(partner)}
                              className="p-2.5 text-tp-blue/40 hover:text-tp-red hover:bg-tp-red/5 rounded-xl transition-all active:scale-90"
                              title="Configuración"
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center">
              <h2 className="text-lg font-black text-tp-blue flex items-center gap-2">
                <FileText className="w-5 h-5 text-tp-red" /> Historial de Facturas Generadas
              </h2>
              <div className="text-xs font-bold text-tp-blue/40 uppercase tracking-widest">
                Total: {invoices.length} facturas
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-tp-blue/70 font-bold border-b border-tp-gray-soft">
                  <tr>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Socio B2B</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Periodo</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Paquetes / Peso</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Total Facturado</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Estado</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-gray-soft">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-tp-blue/30 italic">
                        Aún no se han generado facturas mensuales.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-tp-blue-light/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-black text-tp-blue">{inv.partnerName}</div>
                          <div className="text-[10px] text-tp-blue/40 font-bold uppercase">ID: {inv.partnerId.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tp-blue-light rounded-lg text-tp-blue font-black text-xs uppercase">
                            {inv.month}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-tp-blue">{inv.items?.length || 0} paquetes</div>
                          <div className="text-[10px] text-tp-blue/40 font-bold uppercase">{inv.totalPeso?.toFixed(2)} Kg totales</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-black text-tp-blue">€{inv.totalAmount?.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            inv.status === 'paid' ? "bg-green-100 text-green-700" : "bg-tp-red/10 text-tp-red"
                          )}>
                            {inv.status === 'paid' ? 'Pagada' : 'Pendiente de Pago'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setSelectedPartner(partners.find(p => p.id === inv.partnerId));
                              setIsViewInvoiceModalOpen(true);
                            }}
                            className="p-3 bg-tp-blue-light text-tp-blue rounded-xl hover:bg-tp-blue hover:text-white transition-all active:scale-90 shadow-sm"
                            title="Descargar Factura"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {isNewPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Agregar Nuevo Partner B2B</h3>
              <button onClick={() => setIsNewPartnerModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreatePartner} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre de la Empresa</label>
                <input 
                  type="text" 
                  required
                  value={newPartner.businessName}
                  onChange={(e) => setNewPartner({...newPartner, businessName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Email Corporativo</label>
                <input 
                  type="email" 
                  required
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Persona de Contacto</label>
                <input 
                  type="text" 
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Tipo de Colaborador</label>
                <select 
                  value={newPartner.tipoColaborador}
                  onChange={(e) => setNewPartner({...newPartner, tipoColaborador: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                >
                  <option value="empresa_b2b">Empresa B2B</option>
                  <option value="punto_pack">Punto Pack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">CIF / NIF</label>
                <input 
                  type="text" 
                  required
                  value={newPartner.dni}
                  onChange={(e) => setNewPartner({...newPartner, dni: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono</label>
                <input 
                  type="tel" 
                  required
                  value={newPartner.telefono}
                  onChange={(e) => setNewPartner({...newPartner, telefono: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Dirección</label>
                <input 
                  type="text" 
                  required
                  value={newPartner.direccion}
                  onChange={(e) => setNewPartner({...newPartner, direccion: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button 
                  type="submit" 
                  disabled={isUpdating === 'new'}
                  className="w-full bg-tp-red text-white py-3 rounded-xl font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50"
                >
                  {isUpdating === 'new' ? 'Creando...' : 'Crear Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditPartnerModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Configurar Partner: {selectedPartner.businessName}</h3>
              <button onClick={() => setIsEditPartnerModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdatePartner} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre de la Empresa</label>
                <input 
                  type="text" 
                  value={editFormData.businessName}
                  onChange={(e) => setEditFormData({...editFormData, businessName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Capacidad de Paquetes</label>
                <input 
                  type="number" 
                  value={editFormData.capacityPackages}
                  onChange={(e) => setEditFormData({...editFormData, capacityPackages: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Estado del Partner</label>
                <select 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                >
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono</label>
                <input 
                  type="tel" 
                  value={editFormData.telefono}
                  onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Dirección</label>
                <input 
                  type="text" 
                  value={editFormData.direccion}
                  onChange={(e) => setEditFormData({...editFormData, direccion: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">API Key (Acceso Externo)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={editFormData.apiKey}
                    className="flex-1 px-4 py-2.5 bg-gray-100 border border-tp-gray-soft rounded-xl text-tp-blue font-mono text-xs focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={generateApiKey}
                    className="px-4 py-2 bg-tp-blue-light text-tp-blue rounded-xl font-bold hover:bg-tp-blue hover:text-white transition-all flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" /> Generar
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 pt-4">
                <button 
                  type="submit" 
                  disabled={isUpdating === selectedPartner.id}
                  className="w-full bg-tp-blue text-white py-3 rounded-xl font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50"
                >
                  {isUpdating === selectedPartner.id ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewPackagesModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <div>
                <h3 className="text-xl font-bold">Paquetes de {selectedPartner.businessName}</h3>
                <p className="text-white/70 text-xs mt-1">Total: {partnerPackages.length} paquetes</p>
              </div>
              <button onClick={() => setIsViewPackagesModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                  <tr>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Peso</th>
                    <th className="px-4 py-3">Precio Aplicado</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-gray-soft">
                  {partnerPackages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-tp-blue/40">No hay paquetes asociados.</td>
                    </tr>
                  ) : (
                    partnerPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-tp-blue">{pkg.tracking}</td>
                        <td className="px-4 py-3">{pkg.clienteNombre}</td>
                        <td className="px-4 py-3">{pkg.peso} Kg</td>
                        <td className="px-4 py-3">€{(pkg.precioAplicado || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit",
                            pkg.estado === 'Entregado' ? "bg-green-100 text-green-700" : "bg-tp-blue-light text-tp-blue"
                          )}>
                            {pkg.estado}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-tp-blue/50">
                          {pkg.createdAt?.toDate().toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-gray-50 border-t border-tp-gray-soft flex justify-end gap-3">
              <button 
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-6 py-2 bg-tp-red text-white font-bold rounded-xl hover:bg-[#D91F33] transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Generar Factura Mensual
              </button>
              <button 
                onClick={() => setIsViewPackagesModalOpen(false)}
                className="px-6 py-2 bg-tp-blue text-white font-bold rounded-xl hover:bg-[#004a78] transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {isInvoiceModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Generar Factura Mensual</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-tp-blue-light/30 p-4 rounded-xl border border-tp-blue/10">
                <p className="text-sm text-tp-blue font-medium">Partner: <span className="font-bold">{selectedPartner.businessName}</span></p>
                <p className="text-xs text-tp-blue/60 mt-1">Se agruparán todos los paquetes del mes seleccionado.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Mes de Facturación</label>
                <input 
                  type="month" 
                  value={invoiceMonth}
                  onChange={(e) => setInvoiceMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div className="pt-4">
                <button 
                  onClick={handleGenerateInvoice}
                  disabled={isUpdating === 'invoice'}
                  className="w-full bg-tp-red text-white py-3 rounded-xl font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating === 'invoice' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  {isUpdating === 'invoice' ? 'Generando...' : 'Generar Factura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isViewInvoiceModalOpen && selectedInvoice && selectedPartner && (
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
                  partner={selectedPartner} 
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
