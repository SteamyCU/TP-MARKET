import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, X, MapPin, Phone, Mail, CreditCard, Package, Clock, CheckCircle2, AlertCircle, Download, Upload } from 'lucide-react';
import { auth } from '../supabase';
import { subscribePaquetes } from '../services/paquetes';
import { listEventos } from '../services/eventos';
import { subscribeProfiles, listProfiles } from '../services/profiles';
import {
  subscribeClientes, createCliente, updateCliente,
} from '../services/clientes';
import {
  subscribeDestinatarios, createDestinatario, deleteDestinatario,
} from '../services/destinatarios';
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
  provincia?: string;
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
    provincia: '',
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

  // Migración masiva de clientes entre agentes/partners (solo admin).
  const [isMigrarModalOpen, setIsMigrarModalOpen] = useState(false);
  const [agentesPartners, setAgentesPartners] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [migrarDesde, setMigrarDesde] = useState('');
  const [migrarHacia, setMigrarHacia] = useState('');
  const [migrarConfirmado, setMigrarConfirmado] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const SIN_AGENTE = '__sin_agente__';

  useEffect(() => {
    if (role === 'admin') {
      const unsubscribe = subscribeProfiles({}, (profiles) => {
        const agentesMap: Record<string, string> = {};
        profiles.forEach((p) => {
          agentesMap[p.id] = (p.name as string) || p.email || 'Desconocido';
        });
        setAgentes(agentesMap);
      });
      return () => unsubscribe();
    }
  }, [role]);

  useEffect(() => {
    const unsubscribe = subscribeClientes({}, (clientes) => {
      setClientes(clientes as unknown as Cliente[]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      const unsubscribe = subscribeDestinatarios({ clienteId: selectedCliente.id }, (data) => {
        setDestinatarios(data as unknown as Destinatario[]);
      });
      return () => unsubscribe();
    } else {
      setDestinatarios([]);
    }
  }, [selectedCliente]);

  // Carga los agentes/partners disponibles como destino/origen de la migración.
  useEffect(() => {
    if (role !== 'admin') return;
    listProfiles({ roles: ['agente', 'partner'] })
      .then((perfiles) => {
        setAgentesPartners(
          perfiles.map((p) => ({
            id: p.id,
            nombre: (p.name as string) || p.email || 'Sin nombre',
            email: p.email || '',
          })),
        );
      })
      .catch((err) => console.error('Error cargando agentes/partners:', err));
  }, [role]);

  // Nº de clientes por agente y nº sin agente asignado.
  const conteoPorAgente = React.useMemo(() => {
    const m: Record<string, number> = {};
    clientes.forEach((c) => {
      const k = c.agenteId || SIN_AGENTE;
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [clientes]);

  // Clientes afectados por la selección "Migrar de" actual.
  const clientesAMigrar = React.useMemo(() => {
    if (!migrarDesde) return [];
    if (migrarDesde === SIN_AGENTE) return clientes.filter((c) => !c.agenteId);
    return clientes.filter((c) => c.agenteId === migrarDesde);
  }, [migrarDesde, clientes]);

  const nombreAgente = (id: string) =>
    agentesPartners.find((a) => a.id === id)?.nombre || agentes[id] || 'agente';

  // Clientes que se registran directo desde el portal, sin un agente/partner
  // intermediario, son clientes "de la casa" — se muestran bajo "Agente
  // ToPaquete" en vez de "Desconocido".
  const agenteLabelCliente = (agenteId: string | null | undefined) =>
    agenteId ? agentes[agenteId] || 'Desconocido' : 'Agente ToPaquete';

  const abrirMigrarModal = () => {
    setMigrarDesde('');
    setMigrarHacia('');
    setMigrarConfirmado(false);
    setIsMigrarModalOpen(true);
  };

  const puedeMigrar =
    !!migrarDesde && !!migrarHacia && migrarDesde !== migrarHacia &&
    migrarConfirmado && clientesAMigrar.length > 0 && !isMigrating;

  const handleMigrarClientes = async () => {
    if (!puedeMigrar) return;
    setIsMigrating(true);
    try {
      let count = 0;
      for (const cliente of clientesAMigrar) {
        await updateCliente(cliente.id, { agenteId: migrarHacia });
        count++;
      }
      const destinoNombre = nombreAgente(migrarHacia);
      const origenNombre = migrarDesde === SIN_AGENTE ? 'clientes sin agente asignado' : nombreAgente(migrarDesde);
      await registrarAuditoria({
        accion: 'cambio_datos_cliente',
        entidad: 'cliente',
        entidadId: `${count} clientes`,
        descripcion: `Migración masiva de ${count} cliente(s) de "${origenNombre}" a "${destinoNombre}"`,
        valorAnterior: origenNombre,
        valorNuevo: destinoNombre,
      });
      setIsMigrarModalOpen(false);
      setToast(`${count} clientes migrados a ${destinoNombre}`);
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error('Error migrando clientes:', error);
      alert('Error en la migración.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleImportClients = async () => {
    if (!window.confirm('¿Estás seguro de que deseas importar los clientes de prueba? Esto añadirá ' + parsedClients.length + ' clientes.')) return;
    setIsImporting(true);
    try {
      let count = 0;
      for (const client of parsedClients) {
        await createCliente({
          nombre: client.nombre,
          documentoIdentidad: client.documentoIdentidad,
          telefonoEspana: client.telefonoEspana,
          email: client.email,
          direccion: client.direccion,
          agenteId: auth.currentUser?.uid || null,
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
        agenteId: role === 'admin' && clienteForm.agenteId ? clienteForm.agenteId : (selectedCliente?.agenteId || auth.currentUser?.uid || null),
      };

      if (selectedCliente) {
        await updateCliente(selectedCliente.id, dataToSave);
        await registrarAuditoria({
          accion: 'cambio_datos_cliente',
          entidad: 'cliente',
          entidadId: selectedCliente.nombre,
          descripcion: `Datos del cliente modificados`,
          valorAnterior: `${selectedCliente.nombre} · ${selectedCliente.documentoIdentidad} · ${selectedCliente.telefonoEspana} · ${selectedCliente.email}`,
          valorNuevo: `${clienteForm.nombre} · ${clienteForm.documentoIdentidad} · ${clienteForm.telefonoEspana} · ${clienteForm.email}`,
        });
      } else {
        await createCliente(dataToSave);
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
      await createDestinatario({
        ...destinatarioForm,
        clienteId: selectedCliente.id,
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
        await deleteDestinatario(id);
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
      provincia: cliente.provincia || '',
      direccion: cliente.direccion,
      agenteId: cliente.agenteId || '',
      referido_por: cliente.referido_por || ''
    });
    setIsClienteModalOpen(true);
  };

  const openPaquetesModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsPaquetesModalOpen(true);
    
    subscribePaquetes({ clienteId: cliente.id }, (pData) => {
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
      const events = await listEventos(tracking);
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
      provincia: '',
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
      'Provincia': c.provincia || '',
      'Código Postal': c.codigoPostal,
      Agente: agenteLabelCliente(c.agenteId),
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
    for (const fila of filas) {
      await createCliente({
        nombre: fila.nombre,
        documentoIdentidad: fila.documentoIdentidad,
        email: fila.email,
        telefonoEspana: fila.telefonoEspana || '',
        direccion: fila.direccion || '',
        localidad: fila.localidad || '',
        provincia: fila.provincia || '',
        codigoPostal: fila.codigoPostal || '',
        agenteId: auth.currentUser?.uid || null,
      });
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
          <p className="text-tp-blue/60 mt-1">
            Administra clientes y sus destinatarios en Cuba ·{' '}
            <span className="font-bold text-tp-blue">{clientes.length} clientes registrados</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role === 'admin' && (
            <button
              onClick={abrirMigrarModal}
              className="bg-tp-blue-light text-tp-blue hover:bg-tp-blue hover:text-white px-4 py-2 rounded-xl font-bold transition-colors"
            >
              Migrar clientes
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
                      {agenteLabelCliente(cliente.agenteId)}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico *</label>
                    <input type="email" required value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
                    <input type="text" value={clienteForm.codigoPostal} onChange={e => setClienteForm({...clienteForm, codigoPostal: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Provincia (España)</label>
                    <input type="text" placeholder="Madrid, Barcelona, Valencia..." value={clienteForm.provincia} onChange={e => setClienteForm({...clienteForm, provincia: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
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
                    {/* TODO (fase posterior): este campo guarda un código de influencer en
                        texto (ej. "MARIA20"), pero la columna 'clientes.referido_por' en
                        Supabase es uuid (FK a profiles.id). Hay que resolver el código al
                        id del perfil del influencer antes de guardar, o cambiar el tipo de
                        columna, para que este formulario no falle al enviar un valor. */}
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
          { key: 'provincia', label: 'Provincia (España)', ejemplo: 'Madrid, Barcelona, Valencia...' },
          { key: 'codigoPostal', label: 'Código Postal', ejemplo: '28001' },
        ]}
        validarFila={(fila) => {
          if (fila.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fila.email)) return 'Email no válido';
          return null;
        }}
        detectarDuplicado={detectarClienteDuplicado}
        onImportar={importarClientes}
      />

      {/* Migración masiva de clientes entre agentes/partners */}
      {isMigrarModalOpen && (
        <div className="fixed inset-0 bg-tp-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
              <h2 className="text-lg font-bold text-tp-blue flex items-center gap-2">
                <Users className="w-5 h-5 text-tp-red" /> Migrar clientes
              </h2>
              <button onClick={() => setIsMigrarModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-tp-blue/50" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Migrar de</label>
                <select
                  value={migrarDesde}
                  onChange={(e) => setMigrarDesde(e.target.value)}
                  className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                >
                  <option value="">Selecciona el origen…</option>
                  <option value={SIN_AGENTE}>
                    Todos los clientes sin agente asignado ({conteoPorAgente[SIN_AGENTE] || 0})
                  </option>
                  {agentesPartners.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({conteoPorAgente[a.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Migrar a</label>
                <select
                  value={migrarHacia}
                  onChange={(e) => setMigrarHacia(e.target.value)}
                  className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                >
                  <option value="">Selecciona el destino…</option>
                  {agentesPartners
                    .filter((a) => a.id !== migrarDesde)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}{a.email ? ` · ${a.email}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {migrarDesde && migrarHacia && (
                <div className="bg-tp-blue-light/30 rounded-2xl p-4 text-sm text-tp-blue font-medium">
                  Se migrarán <strong>{clientesAMigrar.length}</strong> cliente(s) de{' '}
                  <strong>{migrarDesde === SIN_AGENTE ? 'sin agente asignado' : nombreAgente(migrarDesde)}</strong> a{' '}
                  <strong>{nombreAgente(migrarHacia)}</strong>.
                </div>
              )}

              {migrarDesde && migrarHacia && clientesAMigrar.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" /> No hay clientes en el origen seleccionado.
                </div>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrarConfirmado}
                  onChange={(e) => setMigrarConfirmado(e.target.checked)}
                  className="w-4 h-4 accent-tp-red mt-0.5 shrink-0"
                />
                <span className="text-sm text-tp-blue/70 font-medium leading-relaxed">
                  Confirmo que quiero realizar esta migración.
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMigrarModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-tp-gray-soft text-tp-blue/60 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMigrarClientes}
                  disabled={!puedeMigrar}
                  className="flex-1 py-3 rounded-2xl bg-tp-blue text-white font-bold hover:bg-[#004a78] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isMigrating ? 'Migrando…' : 'Confirmar migración'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-tp-blue text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
          <span className="flex items-center gap-2 justify-center"><CheckCircle2 className="w-4 h-4" /> {toast}</span>
        </div>
      )}
    </div>
  );
}
