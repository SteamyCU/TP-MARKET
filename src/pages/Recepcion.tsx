import React, { useState, useEffect } from 'react';
import { Camera, FileText, Scale, Printer, Search, Plus, AlertCircle, Wallet, CheckCircle2, X, Upload, Trash2, UserPlus, Package } from 'lucide-react';
import { ChipEstado } from '../components/ChipEstado';
import { useAuth } from '../AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, where } from 'firebase/firestore';

interface Cliente {
  id: string;
  nombre: string;
  documentoIdentidad: string;
  telefonoEspana: string;
  email: string;
}

interface Destinatario {
  id: string;
  clienteId: string;
  nombre: string;
  provincia: string;
  municipio: string;
  telefonoCuba: string;
  direccion?: string;
  carnetPasaporte?: string;
}

const PROVINCIAS_CUBA = [
  "Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas", 
  "Villa Clara", "Cienfuegos", "Sancti Spíritus", "Ciego de Ávila", 
  "Camagüey", "Las Tunas", "Holguín", "Granma", "Santiago de Cuba", 
  "Guantánamo", "Isla de la Juventud"
];

export function Recepcion() {
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  
  const generateTracking = () => {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TP-ES-${date}-${random}`;
  };

  const [tracking, setTracking] = useState(generateTracking());
  const [paquetesHoy, setPaquetesHoy] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cliente: '',
    telefono: '',
    peso: '',
    origen: 'Madrid, España',
    destino: '',
    contenido: '',
    medidasAlto: '',
    medidasAncho: '',
    medidasLargo: '',
    estado: 'Recepción',
    detallesIncidencia: '',
    monto: '',
    metodoPago: 'Efectivo',
    estadoPago: 'Pagado',
    precioAplicado: '',
    fechaRegistro: new Date().toISOString().slice(0, 16)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (role === 'cliente') {
    return <Navigate to="/" />;
  }

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedDestinatarioId, setSelectedDestinatarioId] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [isNewClienteModalOpen, setIsNewClienteModalOpen] = useState(false);
  const [newClienteForm, setNewClienteForm] = useState({
    nombre: '',
    documentoIdentidad: '',
    telefonoEspana: '',
    email: '',
    codigoPostal: '',
    localidad: '',
    direccion: ''
  });
  const [isNewDestinatarioModalOpen, setIsNewDestinatarioModalOpen] = useState(false);
  const [newDestinatarioForm, setNewDestinatarioForm] = useState({
    nombre: '',
    carnetPasaporte: '',
    telefonoCuba: '',
    email: '',
    direccion: '',
    provincia: '',
    municipio: '',
    codigoPostal: ''
  });

  useEffect(() => {
    // Fetch packages received today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'paquetes'),
      where('createdAt', '>=', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pkgs = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate() || new Date();
        return {
          id: doc.id,
          tracking: data.tracking,
          cliente: data.clienteNombre,
          peso: data.peso ? `${data.peso} kg` : '---',
          destino: data.destino,
          estado: data.estado,
          hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });
      setPaquetesHoy(pkgs.sort((a, b) => b.id.localeCompare(a.id)));
    });

    return () => unsubscribe();
  }, []);

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
    if (role === 'admin') {
      const q = query(collection(db, 'users'), where('role', '==', 'partner'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const partnersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPartners(partnersData);
      });
      return () => unsubscribe();
    } else if (role === 'partner' && profile?.tipoColaborador === 'punto_pack') {
      setSelectedPartnerId(auth.currentUser?.uid || '');
      if (profile?.precioPorKilo) {
        setFormData(prev => ({ ...prev, precioAplicado: profile.precioPorKilo.toString() }));
      }
    }
  }, [role, profile]);

  useEffect(() => {
    if (selectedPartnerId && role === 'admin') {
      const partner = partners.find(p => p.id === selectedPartnerId);
      if (partner?.precioPorKilo) {
        setFormData(prev => ({ ...prev, precioAplicado: partner.precioPorKilo.toString() }));
      }
    }
  }, [selectedPartnerId, partners, role]);

  useEffect(() => {
    if (selectedClienteId) {
      const q = query(collection(db, 'destinatarios'), where('clienteId', '==', selectedClienteId));
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
  }, [selectedClienteId]);

  const handleSaveNewCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'clientes'), {
        ...newClienteForm,
        agenteId: auth.currentUser?.uid || 'unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSelectedClienteId(docRef.id);
      setIsNewClienteModalOpen(false);
      setNewClienteForm({
        nombre: '',
        documentoIdentidad: '',
        telefonoEspana: '',
        email: '',
        codigoPostal: '',
        localidad: '',
        direccion: ''
      });
    } catch (error) {
      console.error("Error saving cliente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNewDestinatario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId) return;
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'destinatarios'), {
        ...newDestinatarioForm,
        clienteId: selectedClienteId,
        createdAt: serverTimestamp()
      });
      setSelectedDestinatarioId(docRef.id);
      setIsNewDestinatarioModalOpen(false);
      setNewDestinatarioForm({
        nombre: '',
        carnetPasaporte: '',
        telefonoCuba: '',
        email: '',
        direccion: '',
        provincia: '',
        municipio: '',
        codigoPostal: ''
      });
    } catch (error) {
      console.error("Error saving destinatario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedClienteId) newErrors.cliente = 'Debe seleccionar un cliente';
    if (!selectedDestinatarioId) newErrors.destinatario = 'Debe seleccionar un destinatario';
    if (!formData.peso || parseFloat(formData.peso) <= 0) newErrors.peso = 'El peso debe ser mayor a 0';
    if (!formData.origen.trim()) newErrors.origen = 'El origen es obligatorio';
    if (!formData.contenido.trim()) newErrors.contenido = 'El contenido es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedCliente = clientes.find(c => c.id === selectedClienteId);
      const selectedDestinatario = destinatarios.find(d => d.id === selectedDestinatarioId);

      const paqueteData: any = {
        tracking,
        clienteId: selectedClienteId,
        clienteNombre: selectedCliente?.nombre || '',
        clienteTelefono: selectedCliente?.telefonoEspana || '',
        destinatarioId: selectedDestinatarioId,
        destinatarioNombre: selectedDestinatario?.nombre || '',
        destinatarioDireccion: selectedDestinatario?.direccion || '',
        destinatarioTelefono: selectedDestinatario?.telefonoCuba || '',
        destinatarioDocumento: selectedDestinatario?.carnetPasaporte || '',
        peso: parseFloat(formData.peso),
        origen: formData.origen,
        destino: selectedDestinatario?.provincia || '',
        contenido: formData.contenido,
        medidas: {
          alto: formData.medidasAlto ? parseFloat(formData.medidasAlto) : null,
          ancho: formData.medidasAncho ? parseFloat(formData.medidasAncho) : null,
          largo: formData.medidasLargo ? parseFloat(formData.medidasLargo) : null,
        },
        estado: formData.estado,
        detallesIncidencia: formData.estado === 'Incidencia' ? formData.detallesIncidencia : null,
        createdAt: new Date(formData.fechaRegistro),
        updatedAt: new Date(formData.fechaRegistro),
        operadorId: auth.currentUser?.uid || 'unknown',
        referidoPor: auth.currentUser?.uid || null,
        partnerId: selectedPartnerId || null,
        precioAplicado: formData.precioAplicado ? parseFloat(formData.precioAplicado) : null,
        esB2B: !!selectedPartnerId
      };

      await addDoc(collection(db, 'paquetes'), paqueteData);

      // También registrar el pago si hay monto
      if (formData.monto && parseFloat(formData.monto) > 0) {
        await addDoc(collection(db, 'pagos'), {
          paqueteId: tracking, // Usamos el tracking como referencia o el ID del doc recién creado
          monto: parseFloat(formData.monto),
          metodo: formData.metodoPago,
          estado: formData.estadoPago,
          fecha: new Date(formData.fechaRegistro),
          agenteId: auth.currentUser?.uid || 'unknown'
        });
      }

      // Registrar evento inicial
      await addDoc(collection(db, 'eventos'), {
        paqueteId: tracking,
        estado: 'Recepción',
        notas: 'Paquete recibido en oficina',
        timestamp: new Date(formData.fechaRegistro),
        operadorId: auth.currentUser?.uid || 'unknown'
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard');
      }, 2000);
      setFormData({
        cliente: '',
        telefono: '',
        peso: '',
        origen: 'Madrid, España',
        destino: '',
        contenido: '',
        medidasAlto: '',
        medidasAncho: '',
        medidasLargo: '',
        estado: 'Recepción',
        detallesIncidencia: '',
        monto: '',
        metodoPago: 'Efectivo',
        estadoPago: 'Pagado',
        precioAplicado: ''
      });
      setSelectedClienteId('');
      setSelectedDestinatarioId('');
    } catch (error) {
      console.error("Error saving package:", error);
      setErrors({ submit: 'Error al guardar el paquete. Por favor, verifica tu conexión y permisos.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    // Simular subida
    setTimeout(() => {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
    }, 1500);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const saveDocuments = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      // Aquí se asociarían los documentos al paquete
      console.log('Documentos asociados al paquete:', tracking, uploadedFiles);
      setUploadedFiles([]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Alertas y Mensajes de Éxito */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            ¡Paquete registrado con éxito! Tracking: {tracking}
          </p>
        </div>
      )}
      
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-tp-red" />
        <p className="text-sm font-medium text-tp-red">
          3 paquetes requieren validación urgente: TP-ES-24070, TP-ES-24065, TP-ES-24062
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulario Recepción */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-tp-gray-soft p-6">
          <h2 className="text-xl font-bold text-tp-blue mb-6">Nuevo Paquete</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Tracking Generado</label>
                <input 
                  type="text" 
                  value={tracking}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue font-mono font-bold focus:outline-none"
                />
              </div>
              {role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Asociar a Partner B2B / Punto Pack</label>
                  <select 
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none"
                  >
                    <option value="">Ninguno (Envío Directo)</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.businessName} ({p.tipoColaborador === 'punto_pack' ? 'Punto Pack' : 'B2B'})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-tp-blue/70 mb-1.5 flex justify-between items-center">
                  Cliente Remitente
                  <button 
                    type="button"
                    onClick={() => setIsNewClienteModalOpen(true)}
                    className="text-xs text-tp-red font-bold hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" /> Nuevo
                  </button>
                </label>
                <select 
                  value={selectedClienteId}
                  onChange={(e) => {
                    setSelectedClienteId(e.target.value);
                    setSelectedDestinatarioId('');
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 bg-white border rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none",
                    errors.cliente ? "border-red-500" : "border-tp-gray-soft"
                  )}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.documentoIdentidad})</option>
                  ))}
                </select>
                {errors.cliente && <p className="text-xs text-red-500 mt-1">{errors.cliente}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-tp-blue/70 mb-1.5 flex justify-between items-center">
                  Destinatario (Cuba)
                  {selectedClienteId && (
                    <button 
                      type="button"
                      onClick={() => setIsNewDestinatarioModalOpen(true)}
                      className="text-xs text-tp-red font-bold hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Nuevo
                    </button>
                  )}
                </label>
                <select 
                  value={selectedDestinatarioId}
                  onChange={(e) => setSelectedDestinatarioId(e.target.value)}
                  disabled={!selectedClienteId || destinatarios.length === 0}
                  className={cn(
                    "w-full px-4 py-2.5 bg-white border rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none disabled:bg-gray-100 disabled:text-tp-blue/40",
                    errors.destinatario ? "border-red-500" : "border-tp-gray-soft"
                  )}
                >
                  <option value="">
                    {!selectedClienteId ? 'Selecciona un cliente primero' : 
                     destinatarios.length === 0 ? 'No hay destinatarios registrados' : 
                     'Seleccionar destinatario...'}
                  </option>
                  {destinatarios.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre} - {d.provincia}</option>
                  ))}
                </select>
                {errors.destinatario && <p className="text-xs text-red-500 mt-1">{errors.destinatario}</p>}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-tp-gray-soft">
              <h3 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Detalles del Paquete
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Fecha de Registro</label>
                  <input 
                    type="datetime-local" 
                    name="fechaRegistro"
                    value={formData.fechaRegistro}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Origen</label>
                  <input 
                    type="text" 
                    name="origen"
                    value={formData.origen}
                    onChange={handleChange}
                    className={cn(
                      "w-full px-4 py-2.5 bg-white border rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20",
                      errors.origen ? "border-red-500" : "border-tp-gray-soft"
                    )}
                  />
                  {errors.origen && <p className="text-xs text-red-500 mt-1">{errors.origen}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Destino Final</label>
                  <input 
                    type="text" 
                    value={selectedDestinatarioId ? destinatarios.find(d => d.id === selectedDestinatarioId)?.provincia || '' : ''}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-100 border border-tp-gray-soft rounded-xl text-tp-blue/60 font-medium focus:outline-none"
                    placeholder="Se autocompleta con el destinatario"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Peso (kg)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="peso"
                      step="0.1"
                      value={formData.peso}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={cn(
                        "w-full px-4 py-2.5 bg-white border rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20",
                        errors.peso ? "border-red-500" : "border-tp-gray-soft"
                      )}
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-tp-blue-light text-tp-blue rounded-lg hover:bg-tp-gray-soft transition-colors">
                      <Scale className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.peso && <p className="text-xs text-red-500 mt-1">{errors.peso}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Medidas (cm) - Alto x Ancho x Largo</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      name="medidasAlto"
                      value={formData.medidasAlto}
                      onChange={handleChange}
                      placeholder="Alto"
                      className="w-1/3 px-3 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                    />
                    <input 
                      type="number" 
                      name="medidasAncho"
                      value={formData.medidasAncho}
                      onChange={handleChange}
                      placeholder="Ancho"
                      className="w-1/3 px-3 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                    />
                    <input 
                      type="number" 
                      name="medidasLargo"
                      value={formData.medidasLargo}
                      onChange={handleChange}
                      placeholder="Largo"
                      className="w-1/3 px-3 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Contenido Declarado</label>
                <textarea 
                  name="contenido"
                  rows={3}
                  value={formData.contenido}
                  onChange={handleChange}
                  placeholder="Ropa, medicinas, miscelánea..."
                  className={cn(
                    "w-full px-4 py-2.5 bg-white border rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none",
                    errors.contenido ? "border-red-500" : "border-tp-gray-soft"
                  )}
                ></textarea>
                {errors.contenido && <p className="text-xs text-red-500 mt-1">{errors.contenido}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Estado</label>
                  <select 
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none"
                  >
                    <option value="Recepción">Recepción</option>
                    <option value="Validación">Validación</option>
                    <option value="Incidencia">Incidencia</option>
                  </select>
                </div>
                {formData.estado === 'Incidencia' && (
                  <div>
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Detalles de la Incidencia</label>
                    <textarea 
                      name="detallesIncidencia"
                      rows={2}
                      value={formData.detallesIncidencia}
                      onChange={handleChange}
                      placeholder="Describa el problema..."
                      className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-gray-soft">
              <h3 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Detalles de Cobro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Monto Total (€)</label>
                  <input 
                    type="number" 
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                  />
                </div>
                {selectedPartnerId && (
                  <div>
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Precio Aplicado (€/Kg)</label>
                    <input 
                      type="number" 
                      name="precioAplicado"
                      step="0.01"
                      value={formData.precioAplicado}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Método de Pago</label>
                  <select 
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Estado de Pago</label>
                  <select 
                    name="estadoPago"
                    value={formData.estadoPago}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none"
                  >
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-tp-red hover:bg-[#D91F33] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {isSubmitting ? 'Registrando...' : 'Registrar Paquete'}
              </button>
            </div>
          </form>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-2">Acciones Rápidas</h3>
          
          <button className="w-full bg-white border border-tp-gray-soft hover:border-tp-blue/30 p-4 rounded-xl flex items-center gap-4 transition-all group">
            <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue group-hover:bg-tp-blue group-hover:text-white transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-tp-blue">Foto paquete</div>
              <div className="text-xs text-tp-blue/60">Capturar evidencia visual</div>
            </div>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-white border border-tp-gray-soft hover:border-tp-blue/30 p-4 rounded-xl flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue group-hover:bg-tp-blue group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-tp-blue">Validar documentos</div>
              <div className="text-xs text-tp-blue/60">Subir DNI/Pasaporte</div>
            </div>
          </button>

          <button className="w-full bg-white border border-tp-gray-soft hover:border-tp-blue/30 p-4 rounded-xl flex items-center gap-4 transition-all group">
            <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue group-hover:bg-tp-blue group-hover:text-white transition-colors">
              <Printer className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-tp-blue">Imprimir etiqueta</div>
              <div className="text-xs text-tp-blue/60">Generar código de barras</div>
            </div>
          </button>
        </div>
      </div>

      {/* Modal de Validación de Documentos */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <div>
                <h3 className="text-xl font-bold">Validación de Documentos</h3>
                <p className="text-white/70 text-xs mt-1">Asociando a: <span className="font-mono font-bold">{tracking}</span></p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dropzone */}
              <div className="relative border-2 border-dashed border-tp-gray-soft rounded-2xl p-8 text-center hover:border-tp-blue/30 transition-colors group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-tp-blue font-bold">Haz clic o arrastra archivos</p>
                  <p className="text-tp-blue/50 text-sm mt-1">DNI, Pasaporte o documentos de identidad (PDF, JPG, PNG)</p>
                </div>
              </div>

              {/* Lista de Archivos */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-tp-blue uppercase tracking-wider">Archivos Seleccionados</h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-tp-gray-soft">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-tp-gray-soft flex items-center justify-center text-tp-blue">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-tp-blue truncate max-w-[180px]">{file.name}</p>
                            <p className="text-[10px] text-tp-blue/50">{file.size} • {file.type.split('/')[1].toUpperCase()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFile(index)}
                          className="p-2 text-tp-blue/40 hover:text-tp-red transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center justify-center gap-3 p-4 bg-tp-blue-light/50 rounded-xl">
                  <div className="w-4 h-4 border-2 border-tp-blue border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-tp-blue">Subiendo documentos...</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-tp-gray-soft flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border border-tp-gray-soft text-tp-blue font-bold rounded-xl hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveDocuments}
                disabled={uploadedFiles.length === 0 || isUploading || isSubmitting}
                className="flex-1 px-6 py-3 bg-tp-red text-white font-bold rounded-xl hover:bg-[#D91F33] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {isSubmitting ? 'Guardando...' : 'Asociar Documentos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente Rápido */}
      {isNewClienteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Nuevo Cliente</h3>
              <button onClick={() => setIsNewClienteModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNewCliente} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre *</label>
                  <input type="text" required value={newClienteForm.nombre} onChange={e => setNewClienteForm({...newClienteForm, nombre: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">DNI / NIE / Pasaporte *</label>
                  <input type="text" required value={newClienteForm.documentoIdentidad} onChange={e => setNewClienteForm({...newClienteForm, documentoIdentidad: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono España</label>
                  <input type="tel" value={newClienteForm.telefonoEspana} onChange={e => setNewClienteForm({...newClienteForm, telefonoEspana: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico *</label>
                  <input type="email" required value={newClienteForm.email} onChange={e => setNewClienteForm({...newClienteForm, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Dirección *</label>
                <textarea required rows={2} value={newClienteForm.direccion} onChange={e => setNewClienteForm({...newClienteForm, direccion: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewClienteModalOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Destinatario Rápido */}
      {isNewDestinatarioModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Nuevo Destinatario</h3>
              <button onClick={() => setIsNewDestinatarioModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNewDestinatario} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre *</label>
                <input type="text" required value={newDestinatarioForm.nombre} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, nombre: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Carnet o Pasaporte *</label>
                  <input type="text" required value={newDestinatarioForm.carnetPasaporte} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, carnetPasaporte: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono en Cuba *</label>
                  <input type="tel" required value={newDestinatarioForm.telefonoCuba} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, telefonoCuba: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico</label>
                  <input type="email" value={newDestinatarioForm.email} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Calle, número, piso, etc. *</label>
                <textarea required rows={2} value={newDestinatarioForm.direccion} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, direccion: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Provincia *</label>
                  <select required value={newDestinatarioForm.provincia} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, provincia: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    {PROVINCIAS_CUBA.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Municipio *</label>
                  <input type="text" required value={newDestinatarioForm.municipio} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, municipio: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
                  <input type="text" value={newDestinatarioForm.codigoPostal} onChange={e => setNewDestinatarioForm({...newDestinatarioForm, codigoPostal: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewDestinatarioModalOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla Paquetes del Día */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
        <div className="p-5 border-b border-tp-gray-soft flex justify-between items-center">
          <h2 className="text-lg font-bold text-tp-blue">Paquetes Recibidos Hoy ({paquetesHoy.length})</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-tp-blue bg-tp-blue-light rounded-lg hover:bg-tp-gray-soft transition-colors">Exportar</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-5 py-3">Tracking</th>
                <th className="px-5 py-3">Hora</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Peso</th>
                <th className="px-5 py-3">Destino</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {paquetesHoy.map((paquete, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-tp-blue">{paquete.tracking}</td>
                  <td className="px-5 py-4 text-tp-blue/60">{paquete.hora}</td>
                  <td className="px-5 py-4 font-medium text-tp-blue/80">{paquete.cliente}</td>
                  <td className="px-5 py-4 font-mono text-tp-blue/70">{paquete.peso}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{paquete.destino}</td>
                  <td className="px-5 py-4"><ChipEstado estado={paquete.estado} /></td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-tp-blue hover:text-tp-red font-medium transition-colors">
                      {paquete.estado === 'Peso?' ? 'Revisar' : 'Validar'}
                    </button>
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
