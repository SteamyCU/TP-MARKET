import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, X, MapPin, Phone, Mail, CreditCard, Package, Clock, CheckCircle2, AlertCircle, Download, Upload } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where, orderBy, writeBatch } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { ChipEstado } from '../components/ChipEstado';
import { ImportModal } from '../components/ImportModal';
import { exportarExcel } from '../lib/excel';
import { registrarAuditoria } from '../services/auditoria';
import parsedClients from '../parsed_clients.json';

interface Cliente {
  id: string;
  nombre: string;
  documentoIdentidad: string;
  telefonoEspana: string;
  email: string;
  codigoPostal: string;
  localidad: string;
  direccion: string;
  agenteId: string;
  referido_por?: string;
}

interface Destinatario {
  id: string;
  clienteId: string;
  nombre: string;
  carnetPasaporte: string;
  telefonoCuba: string;
  email: string;
  direccion: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
}

export function Clientes() {
  const { role } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDestinatarioModalOpen, setIsDestinatarioModalOpen] = useState(false);
  const [isPaquetesModalOpen, setIsPaquetesModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientePaquetes, setClientePaquetes] = useState<any[]>([]);
  const [paqueteEventos, setPaqueteEventos] = useState<Record<string, any[]>>({});
  const [expandedPaqueteId, setExpandedPaqueteId] = useState<string | null>(null);
  
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    documentoIdentidad: '',
    telefonoEspana: '',
    email: '',
    codigoPostal: '',
    localidad: '',
    direccion: '',
    agenteId: '',
    referido_por: ''
  });

  const [destinatarioForm, setDestinatarioForm] = useState({
    nombre: '',
    carnetPasaporte: '',
    telefonoCuba: '',
    email: '',
    direccion: '',
    provincia: '',
    municipio: '',
    codigoPostal: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [agentes, setAgentes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role === 'admin') {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const agentesMap: Record<string, string> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          agentesMap[doc.id] = data.name || data.email || 'Desconocido';
        });
        setAgentes(agentesMap);
      });
      return () => unsubscribe();
    }
  }, [role]);

  useEffect(() => {
    const q = query(collection(db, 'clientes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientesData: Cliente[] = [];
      snapshot.forEach((doc) => {
        clientesData.push({ id: doc.id, ...doc.data() } as Cliente);
      });
      setClientes(clientesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      const q = query(collection(db, 'destinatarios'), where('clienteId', '==', selectedCliente.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const destData: Destinatario[] = [];
        snapshot.forEach((doc) => {
          destData.push({ id: doc.id, ...doc.data() } as Destinatario);
        });
        setDestinatarios(destData);
      });
      return () => unsubscribe();
    } else {
      setDestinatarios([]);
    }
  }, [selectedCliente]);

  const handleMigrateRoxana = async () => {
    if (!window.confirm('¿Migrar todos los clientes al agente Roxana Enamorado?')) return;
    try {
      // Find Roxana user
      const qUsers = query(collection(db, 'users'));
      const snapshot = await getDocs(qUsers);
      let roxanaId = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.email?.toLowerCase().includes('roxana') || data.name?.toLowerCase().includes('roxana')) {
          roxanaId = doc.id;
        }
      });

      if (!roxanaId) {
        alert('No se encontró el agente Roxana Enamorado');
        return;
      }

      // Update all clients
      const qClientes = query(collection(db, 'clientes'));
      const clientesSnap = await getDocs(qClientes);
      let count = 0;
      for (const clientDoc of clientesSnap.docs) {
        await updateDoc(doc(db, 'clientes', clientDoc.id), {
          agenteId: roxanaId
        });
        count++;
      }
      alert(`Se han actualizado ${count} clientes al agente Roxana Enamorado.`);
    } catch (error) {
      console.error('Error migrating clients:', error);
      alert('Error en la migración.');
    }
  };

  const handleImportClients = async () => {
    if (!window.confirm('¿Estás seguro de que deseas importar los clientes de prueba? Esto añadirá ' + parsedClients.length + ' clientes.')) return;
    setIsImporting(true);
    try {
      let count = 0;
      for (const client of parsedClients) {
        await addDoc(collection(db, 'clientes'), {
          nombre: client.nombre,
          documentoIdentidad: client.documentoIdentidad,
          telefonoEspana: client.telefonoEspana,
          email: client.email,
          direccion: client.direccion,
          agenteId: auth.currentUser?.uid || 'unknown',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
        if (count % 10 === 0) console.log(`Imported ${count} clients...`);
      }
      alert('Importación completada con éxito.');
    } catch (error) {
      console.error('Error importing clients:', error);
      alert('Error al importar clientes.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...clienteForm,
        agenteId: role === 'admin' && clienteForm.agenteId ? clienteForm.agenteId : (selectedCliente?.agenteId || auth.currentUser?.uid || 'unknown'),
        updatedAt: serverTimestamp()
      };

      if (selectedCliente) {
        await updateDoc(doc(db, 'clientes', selectedCliente.id), dataToSave);
        await registrarAuditoria({
          accion: 'cambio_datos_cliente',
          entidad: 'cliente',
          entidadId: selectedCliente.nombre,
          descripcion: `Datos del cliente modificados`,
          valorAnterior: `${selectedCliente.nombre} · ${selectedCliente.documentoIdentidad} · ${selectedCliente.telefonoEspana} · ${selectedCliente.email}`,
          valorNuevo: `${clienteForm.nombre} · ${clienteForm.documentoIdentidad} · ${clienteForm.telefonoEspana} · ${clienteForm.email}`,
        });
      } else {
        await addDoc(collection(db, 'clientes'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }
      setIsClienteModalOpen(false);
      setSelectedCliente(null);
      resetClienteForm();
    } catch (error) {
      console.error("Error saving cliente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDestinatario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'destinatarios'), {
        ...destinatarioForm,
        clienteId: selectedCliente.id,
        createdAt: serverTimestamp()
      });
      setIsDestinatarioModalOpen(false);
      resetDestinatarioForm();
    } catch (error) {
      console.error("Error saving destinatario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDestinatario = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este destinatario?')) {
      try {
        await deleteDoc(doc(db, 'destinatarios', id));
      } catch (error) {
        console.error("Error deleting destinatario:", error);
      }
    }
  };

  const openEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setClienteForm({
      nombre: cliente.nombre,
      documentoIdentidad: cliente.documentoIdentidad,
      telefonoEspana: cliente.telefonoEspana,
      email: cliente.email,
      codigoPostal: cliente.codigoPostal,
      localidad: cliente.localidad,
      direccion: cliente.direccion,
      agenteId: cliente.agenteId || '',
      referido_por: cliente.referido_por || ''
    });
    setIsClienteModalOpen(true);
  };

  const openPaquetesModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsPaquetesModalOpen(true);
    
    const q = query(collection(db, 'paquetes'), where('clienteId', '==', cliente.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pData: any[] = [];
      snapshot.forEach(doc => pData.push({ id: doc.id, ...doc.data() }));
      setClientePaquetes(pData);
    });
  };

  const togglePaqueteExpanded = async (tracking: string) => {
    if (expandedPaqueteId === tracking) {
      setExpandedPaqueteId(null);
      return;
    }
    setExpandedPaqueteId(tracking);
    
    if (!paqueteEventos[tracking]) {
      const q = query(collection(db, 'eventos'), where('paqueteId', '==', tracking), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const events: any[] = [];
      snapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
      setPaqueteEventos(prev => ({ ...prev, [tracking]: events }));
    }
  };

  const resetClienteForm = () => {
    setClienteForm({
      nombre: '',
      documentoIdentidad: '',
      telefonoEspana: '',
      email: '',
      codigoPostal: '',
      localidad: '',
      direccion: '',
      agenteId: '',
      referido_por: ''
    });
  };

  const resetDestinatarioForm = () => {
    setDestinatarioForm({
      nombre: '',
      carnetPasaporte: '',
      telefonoCuba: '',
      email: '',
      direccion: '',
      provincia: '',
      municipio: '',
      codigoPostal: ''
    });
  };

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documentoIdentidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportarClientes = () => {
    exportarExcel('clientes', filteredClientes.map(c => ({
      Nombre: c.nombre,
      'Documento': c.documentoIdentidad,
      Email: c.email,
      'Teléfono': c.telefonoEspana,
      'Dirección': c.direccion,
      Localidad: c.localidad,
      'Código Postal': c.codigoPostal,
      Agente: agentes[c.agenteId] || c.agenteId || '',
    })));
  };

  const normalizarDato = (v: string) => v.trim().toLowerCase();
  const detectarClienteDuplicado = (fila: Record<string, string>): string | null => {
    const existente = clientes.find(c =>
      (fila.documentoIdentidad && normalizarDato(c.documentoIdentidad || '') === normalizarDato(fila.documentoIdentidad)) ||
      (fila.email && normalizarDato(c.email || '') === normalizarDato(fila.email))
    );
    return existente ? `Ya existe: ${existente.nombre}` : null;
  };

  const importarClientes = async (filas: Record<string, string>[]): Promise<number> => {
    const TAM_BATCH = 400;
    for (let i = 0; i < filas.length; i += TAM_BATCH) {
      const batch = writeBatch(db);
      for (const fila of filas.slice(i, i + TAM_BATCH)) {
        batch.set(doc(collection(db, 'clientes')), {
          nombre: fila.nombre,
          documentoIdentidad: fila.documentoIdentidad,
          email: fila.email,
          telefonoEspana: fila.telefonoEspana || '',
          direccion: fila.direccion || '',
          localidad: fila.localidad || '',
          codigoPostal: fila.codigoPostal || '',
          agenteId: auth.currentUser?.uid || 'unknown',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
    await registrarAuditoria({
      accion: 'importacion',
      entidad: 'cliente',
      entidadId: `${filas.length} clientes`,
      descripcion: `Importación masiva de ${filas.length} cliente(s) desde Excel/CSV`,
    });
    return filas.length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Gestión de Clientes</h1>
          <p className="text-tp-blue/60 mt-1">Administra clientes y sus destinatarios en Cuba</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role === 'admin' && (
            <button
              onClick={handleMigrateRoxana}
              className="bg-tp-blue-light text-tp-blue hover:bg-tp-blue hover:text-white px-4 py-2 rounded-xl font-bold transition-colors"
            >
              Migrar a Roxana
            </button>
          )}
          <button
            onClick={handleExportarClientes}
            disabled={filteredClientes.length === 0}
            className="bg-white border border-tp-gray-soft text-tp-blue hover:bg-gray-50 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-tp-gray-soft text-tp-blue hover:bg-gray-50 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button
            onClick={() => {
              setSelectedCliente(null);
              resetClienteForm();
              setIsClienteModalOpen(true);
            }}
            className="bg-tp-red hover:bg-[#D91F33] text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
        <div className="p-4 border-b border-tp-gray-soft flex gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tp-blue/40" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">DNI / NIE / Pasaporte</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Teléfono</th>
                {role === 'admin' && <th className="px-5 py-3">Agente</th>}
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-tp-blue">{cliente.nombre}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{cliente.documentoIdentidad}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{cliente.email}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{cliente.telefonoEspana}</td>
                  {role === 'admin' && (
                    <td className="px-5 py-4 text-tp-blue/70">
                      {agentes[cliente.agenteId] || 'Desconocido'}
                    </td>
                  )}
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openPaquetesModal(cliente)}
                      className="text-tp-blue hover:text-tp-blue-light p-2 transition-colors"
                      title="Ver Paquetes y Seguimiento"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditCliente(cliente)}
                      className="text-tp-blue hover:text-tp-red p-2 transition-colors"
                      title="Modificar Cliente y Destinatarios"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan={role === 'admin' ? 6 : 5} className="px-5 py-8 text-center text-tp-blue/50">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cliente */}
      {isClienteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">{selectedCliente ? 'Modificar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setIsClienteModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form id="cliente-form" onSubmit={handleSaveCliente} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre *</label>
                    <input type="text" required value={clienteForm.nombre} onChange={e => setClienteForm({...clienteForm, nombre: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">DNI / NIE / Pasaporte *</label>
                    <input type="text" required value={clienteForm.documentoIdentidad} onChange={e => setClienteForm({...clienteForm, documentoIdentidad: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono España</label>
                    <input type="tel" value={clienteForm.telefonoEspana} onChange={e => setClienteForm({...clienteForm, telefonoEspana: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico *</label>
                    <input type="email" required value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
                    <input type="text" value={clienteForm.codigoPostal} onChange={e => setClienteForm({...clienteForm, codigoPostal: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Localidad</label>
                    <input type="text" value={clienteForm.localidad} onChange={e => setClienteForm({...clienteForm, localidad: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Calle, número, piso, etc. *</label>
                  <textarea required rows={2} value={clienteForm.direccion} onChange={e => setClienteForm({...clienteForm, direccion: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-tp-gray-soft">
                  {role === 'admin' && (
                    <div>
                      <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Asignar Agente</label>
                      <select 
                        value={clienteForm.agenteId} 
                        onChange={e => setClienteForm({...clienteForm, agenteId: e.target.value})} 
                        className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none bg-white"
                      >
                        <option value="">Sin agente asignado</option>
                        {Object.entries(agentes).map(([id, nombre]) => (
                          <option key={id} value={id}>{nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código de Influencer (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: MARIA20"
                      value={clienteForm.referido_por} 
                      onChange={e => setClienteForm({...clienteForm, referido_por: e.target.value.toUpperCase()})} 
                      className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" 
                    />
                  </div>
                </div>
              </form>

              {selectedCliente && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-tp-blue">Destinatarios</h4>
                    <button 
                      onClick={() => setIsDestinatarioModalOpen(true)}
                      className="bg-tp-blue hover:bg-[#004a78] text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Nuevo Destinatario
                    </button>
                  </div>
                  <div className="border border-tp-gray-soft rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                        <tr>
                          <th className="px-4 py-2">Nombre</th>
                          <th className="px-4 py-2">Teléfono Cuba</th>
                          <th className="px-4 py-2">Provincia</th>
                          <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-tp-gray-soft">
                        {destinatarios.map(dest => (
                          <tr key={dest.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 font-medium text-tp-blue">{dest.nombre}</td>
                            <td className="px-4 py-2 text-tp-blue/70">{dest.telefonoCuba}</td>
                            <td className="px-4 py-2 text-tp-blue/70">{dest.provincia}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => handleDeleteDestinatario(dest.id)} className="text-tp-red hover:text-red-700 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {destinatarios.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-tp-blue/50 text-xs">
                              No hay destinatarios registrados para este cliente.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-tp-gray-soft flex justify-end gap-3">
              <button 
                onClick={() => setIsClienteModalOpen(false)}
                className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                form="cliente-form"
                type="submit"
                disabled={isSubmitting}
                className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : (selectedCliente ? 'Aplicar Cambios' : 'Crear Cliente')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Destinatario */}
      {isDestinatarioModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Nuevo Destinatario</h3>
              <button onClick={() => setIsDestinatarioModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDestinatario} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre *</label>
                <input type="text" required value={destinatarioForm.nombre} onChange={e => setDestinatarioForm({...destinatarioForm, nombre: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Carnet o Pasaporte *</label>
                  <input type="text" required value={destinatarioForm.carnetPasaporte} onChange={e => setDestinatarioForm({...destinatarioForm, carnetPasaporte: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono en Cuba *</label>
                  <input type="tel" required value={destinatarioForm.telefonoCuba} onChange={e => setDestinatarioForm({...destinatarioForm, telefonoCuba: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico</label>
                  <input type="email" value={destinatarioForm.email} onChange={e => setDestinatarioForm({...destinatarioForm, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Calle, número, piso, etc. *</label>
                <textarea required rows={2} value={destinatarioForm.direccion} onChange={e => setDestinatarioForm({...destinatarioForm, direccion: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Provincia *</label>
                  <select required value={destinatarioForm.provincia} onChange={e => setDestinatarioForm({...destinatarioForm, provincia: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="La Habana">La Habana</option>
                    <option value="Santiago de Cuba">Santiago de Cuba</option>
                    <option value="Camagüey">Camagüey</option>
                    <option value="Holguín">Holguín</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Municipio *</label>
                  <input type="text" required value={destinatarioForm.municipio} onChange={e => setDestinatarioForm({...destinatarioForm, municipio: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
                  <input type="text" value={destinatarioForm.codigoPostal} onChange={e => setDestinatarioForm({...destinatarioForm, codigoPostal: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDestinatarioModalOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paquetes y Seguimiento */}
      {isPaquetesModalOpen && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Paquetes de {selectedCliente.nombre}</h3>
              <button onClick={() => setIsPaquetesModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 bg-gray-50 min-h-[400px]">
              {clientePaquetes.length === 0 ? (
                <div className="text-center py-12 text-tp-blue/50">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Este cliente no tiene paquetes registrados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientePaquetes.map(paquete => (
                    <div key={paquete.id} className="bg-white border border-tp-gray-soft rounded-xl overflow-hidden shadow-sm">
                      <div 
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => togglePaqueteExpanded(paquete.tracking)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-tp-blue">{paquete.tracking}</div>
                            <div className="text-sm text-tp-blue/60">{paquete.destino} • {paquete.peso} kg</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <ChipEstado estado={paquete.estado} />
                          <span className="text-tp-blue/40 text-sm">
                            {expandedPaqueteId === paquete.tracking ? 'Ocultar historial' : 'Ver historial'}
                          </span>
                        </div>
                      </div>

                      {expandedPaqueteId === paquete.tracking && (
                        <div className="p-6 border-t border-tp-gray-soft bg-gray-50/50">
                          <h4 className="font-bold text-tp-blue mb-4 text-sm uppercase tracking-wider">Historial de Seguimiento</h4>
                          
                          {paqueteEventos[paquete.tracking] ? (
                            paqueteEventos[paquete.tracking].length > 0 ? (
                              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-tp-gray-soft before:to-transparent">
                                {paqueteEventos[paquete.tracking].map((evento, index) => (
                                  <div key={evento.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-tp-blue-light text-tp-blue shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                      {evento.estado === 'Entregado' ? <CheckCircle2 className="w-4 h-4" /> : 
                                       evento.estado === 'Incidencia' ? <AlertCircle className="w-4 h-4 text-tp-red" /> : 
                                       <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-tp-gray-soft bg-white shadow-sm">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-tp-blue">{evento.estado}</span>
                                        <span className="text-xs font-medium text-tp-blue/50">
                                          {evento.timestamp ? new Date(evento.timestamp.toDate()).toLocaleDateString() : ''}
                                        </span>
                                      </div>
                                      <p className="text-sm text-tp-blue/70">{evento.notas}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-tp-blue/50">No hay eventos registrados para este paquete.</p>
                            )
                          ) : (
                            <div className="flex justify-center py-4">
                              <div className="w-6 h-6 border-2 border-tp-blue border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Importación masiva de clientes desde Excel/CSV */}
      <ImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        titulo="Importar Clientes"
        plantillaNombre="plantilla-clientes"
        campos={[
          { key: 'nombre', label: 'Nombre', requerido: true, ejemplo: 'María Pérez García' },
          { key: 'documentoIdentidad', label: 'Documento', requerido: true, ejemplo: '12345678X' },
          { key: 'email', label: 'Email', requerido: true, ejemplo: 'maria@email.com' },
          { key: 'telefonoEspana', label: 'Teléfono', ejemplo: '+34 600 000 000' },
          { key: 'direccion', label: 'Dirección', requerido: true, ejemplo: 'Calle Mayor 1, Madrid' },
          { key: 'localidad', label: 'Localidad', ejemplo: 'Madrid' },
          { key: 'codigoPostal', label: 'Código Postal', ejemplo: '28001' },
        ]}
        validarFila={(fila) => {
          if (fila.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fila.email)) return 'Email no válido';
          return null;
        }}
        detectarDuplicado={detectarClienteDuplicado}
        onImportar={importarClientes}
      />
    </div>
  );
}
