import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera, FileText, Scale, Printer, Plus, AlertCircle, Wallet, CheckCircle2, X,
  Upload, Trash2, UserPlus, Package, Users, Search, MapPin, Calculator, Truck, ClipboardList
} from 'lucide-react';
import { ChipEstado } from '../components/ChipEstado';
import { ClienteFormModal } from '../components/ClienteFormModal';
import { DestinatarioFormModal } from '../components/DestinatarioFormModal';
import { EtiquetaPaquete } from '../components/EtiquetaPaquete';
import { ReciboPaquete, type DatosRecibo } from '../components/documentos/ReciboPaquete';
import { useAuth } from '../AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { auth } from '../supabase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { calcularVolumenCm3, calcularPesoVolumetrico, calcularPesoTasable, calcularPrecioSugerido, CONFIG_NEGOCIO_DEFAULT, type ConfigNegocio } from '../lib/calculos';
import { generarTracking, cargarConfigNegocio, crearPaquete } from '../services/paquetes';
import { marcarSolicitudConvertida } from '../services/solicitudes';
import { exportarExcel } from '../lib/excel';
import { ESTADOS_INICIALES, ESTADOS_PAGO, METODOS_PAGO, TIPOS_ENVIO, PROVINCIAS_CUBA, type EstadoPago } from '../constants/estados';
import type { Cliente, Destinatario } from '../types/models';

type AccionRegistro = 'normal' | 'otro' | 'etiqueta';

const FORM_INICIAL = {
  origen: 'Madrid, España',
  tipoEnvio: 'Miscelánea',
  contenido: '',
  descripcion: '',
  peso: '',
  medidasAncho: '',
  medidasLargo: '',
  medidasAlto: '',
  valorDeclarado: '',
  estado: 'Recepción',
  detallesIncidencia: '',
  precioFinal: '',
  estadoPago: 'Pagado' as EstadoPago,
  importePagado: '',
  metodoPago: 'Efectivo',
  precioAplicado: '',
  entregaModo: 'destinatario' as 'destinatario' | 'manual',
  entregaDireccion: '',
  entregaProvincia: '',
  entregaMunicipio: '',
  direccionConfirmada: true,
};

export function Recepcion() {
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tracking, setTracking] = useState(generarTracking());
  const [paquetesHoy, setPaquetesHoy] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    ...FORM_INICIAL,
    fechaRegistro: new Date().toISOString().slice(0, 16),
  });
  const [config, setConfig] = useState<ConfigNegocio>(CONFIG_NEGOCIO_DEFAULT);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedDestinatarioId, setSelectedDestinatarioId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isNewClienteModalOpen, setIsNewClienteModalOpen] = useState(false);
  const [isNewDestinatarioModalOpen, setIsNewDestinatarioModalOpen] = useState(false);
  // Solicitud del portal cliente que se está convirtiendo en paquete (Fase 5)
  const [solicitudOrigen, setSolicitudOrigen] = useState<any>(null);

  // Etiqueta y recibo imprimibles del último paquete registrado
  const [etiquetaData, setEtiquetaData] = useState<any>(null);
  const [reciboData, setReciboData] = useState<DatosRecibo | null>(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const reciboRef = useRef<HTMLDivElement>(null);
  const handlePrintEtiqueta = useReactToPrint({ contentRef: etiquetaRef });
  const handlePrintRecibo = useReactToPrint({ contentRef: reciboRef });

  useEffect(() => {
    cargarConfigNegocio().then(setConfig);
  }, []);

  // Precargar datos al llegar desde "Convertir en paquete" del panel de solicitudes
  useEffect(() => {
    const solicitud = (location.state as any)?.solicitud;
    if (solicitud?.id) {
      setSolicitudOrigen(solicitud);
      setSelectedClienteId(solicitud.clienteId || '');
      setSelectedDestinatarioId(solicitud.destinatarioId || '');
      setFormData(prev => ({
        ...prev,
        contenido: solicitud.contenido || '',
        tipoEnvio: solicitud.tipoEnvio || prev.tipoEnvio,
        descripcion: solicitud.observaciones || '',
        peso: solicitud.pesoEstimado ? String(solicitud.pesoEstimado) : prev.peso,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(collection(db, 'paquetes'), where('createdAt', '>=', today));
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
          hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        setPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  // Imprimir etiqueta justo después de registrar (acción "Registrar e Imprimir")
  useEffect(() => {
    if (pendingPrint && etiquetaData) {
      handlePrintEtiqueta();
      setPendingPrint(false);
    }
  }, [pendingPrint, etiquetaData]);

  const clientesFiltradosMemo = useMemo(() => {
    const term = busquedaCliente.trim().toLowerCase();
    if (!term) return clientes.slice(0, 8);
    return clientes.filter(c =>
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.documentoIdentidad || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.telefonoEspana || '').replace(/\s/g, '').includes(term.replace(/\s/g, ''))
    ).slice(0, 8);
  }, [clientes, busquedaCliente]);

  // Guardia de rol: después de todos los hooks para no romper su orden
  if (role === 'cliente') {
    return <Navigate to="/" />;
  }

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);
  const selectedDestinatario = destinatarios.find(d => d.id === selectedDestinatarioId);
  const clientesFiltrados = clientesFiltradosMemo;

  // ── Cálculos en vivo ──────────────────────────────────────────────
  const pesoReal = parseFloat(formData.peso) || null;
  const volumenCm3 = calcularVolumenCm3(
    parseFloat(formData.medidasAncho) || null,
    parseFloat(formData.medidasLargo) || null,
    parseFloat(formData.medidasAlto) || null
  );
  const pesoVolumetrico = calcularPesoVolumetrico(volumenCm3, config.factorVolumetrico);
  const pesoTasable = calcularPesoTasable(pesoReal, pesoVolumetrico);

  const tarifaEspecifica = formData.precioAplicado ? parseFloat(formData.precioAplicado) : (profile?.precioPorKilo || null);
  const origenTarifa = selectedPartnerId ? 'del partner' : profile?.precioPorKilo ? 'de tu oficina' : undefined;
  const sugerido = calcularPrecioSugerido({
    pesoTasable,
    tipoEnvio: formData.tipoEnvio,
    tarifaEspecifica,
    origenTarifa,
    config,
  });

  const precioFinalNum = formData.precioFinal !== ''
    ? parseFloat(formData.precioFinal) || 0
    : sugerido?.precio ?? null;
  const importePagadoNum = formData.estadoPago === 'Pagado'
    ? (precioFinalNum ?? 0)
    : formData.estadoPago === 'Parcial' ? (parseFloat(formData.importePagado) || 0) : 0;
  const importePendiente = precioFinalNum !== null
    ? Math.max(Math.round((precioFinalNum - importePagadoNum) * 100) / 100, 0)
    : 0;

  const puedeEditarPrecio = role === 'admin' || role === 'agente';

  const entregaDireccion = formData.entregaModo === 'destinatario' ? (selectedDestinatario?.direccion || '') : formData.entregaDireccion;
  const entregaProvincia = formData.entregaModo === 'destinatario' ? (selectedDestinatario?.provincia || '') : formData.entregaProvincia;
  const entregaMunicipio = formData.entregaModo === 'destinatario' ? (selectedDestinatario?.municipio || '') : formData.entregaMunicipio;

  // ── Validación ────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedClienteId) newErrors.cliente = 'Debe seleccionar un cliente remitente';
    if (!selectedDestinatarioId) newErrors.destinatario = 'Debe seleccionar un destinatario';
    if (!pesoReal || pesoReal <= 0) newErrors.peso = 'El peso debe ser mayor a 0';
    if (!formData.origen.trim()) newErrors.origen = 'El origen es obligatorio';
    if (!formData.contenido.trim()) newErrors.contenido = 'El contenido es obligatorio';
    if (formData.entregaModo === 'manual') {
      if (!formData.entregaDireccion.trim()) newErrors.entregaDireccion = 'Indica la dirección de entrega';
      if (!formData.entregaProvincia) newErrors.entregaProvincia = 'Selecciona la provincia de entrega';
    } else if (selectedDestinatario && !selectedDestinatario.direccion) {
      newErrors.entregaDireccion = 'El destinatario no tiene dirección registrada. Usa dirección manual o complétala.';
    }
    if (formData.estadoPago !== 'Pendiente' && (!precioFinalNum || precioFinalNum <= 0)) {
      newErrors.precioFinal = 'Indica el precio final (o peso y medidas para calcular el sugerido)';
    }
    if (formData.estadoPago === 'Parcial') {
      if (importePagadoNum <= 0) newErrors.importePagado = 'Indica el importe pagado';
      else if (precioFinalNum !== null && importePagadoNum >= precioFinalNum) {
        newErrors.importePagado = 'En pago parcial el importe debe ser menor que el precio final';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetFormulario = () => {
    setFormData({ ...FORM_INICIAL, fechaRegistro: new Date().toISOString().slice(0, 16) });
    setSelectedClienteId('');
    setSelectedDestinatarioId('');
    setBusquedaCliente('');
    setErrors({});
    setTracking(generarTracking());
  };

  const handleSubmit = async (accion: AccionRegistro) => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await crearPaquete({
        tracking,
        clienteId: selectedClienteId,
        clienteNombre: selectedCliente?.nombre || '',
        clienteTelefono: selectedCliente?.telefonoEspana || '',
        destinatarioId: selectedDestinatarioId,
        destinatarioNombre: selectedDestinatario?.nombre || '',
        destinatarioDireccion: entregaDireccion,
        destinatarioTelefono: selectedDestinatario?.telefonoCuba || '',
        destinatarioDocumento: selectedDestinatario?.carnetPasaporte || '',
        peso: pesoReal!,
        origen: formData.origen,
        destino: entregaProvincia || selectedDestinatario?.provincia || '',
        contenido: formData.contenido,
        medidas: {
          alto: parseFloat(formData.medidasAlto) || null,
          ancho: parseFloat(formData.medidasAncho) || null,
          largo: parseFloat(formData.medidasLargo) || null,
        },
        estado: formData.estado,
        detallesIncidencia: formData.detallesIncidencia || null,
        fechaRegistro: new Date(formData.fechaRegistro),
        partnerId: selectedPartnerId || null,
        precioAplicado: formData.precioAplicado ? parseFloat(formData.precioAplicado) : null,
        tipoEnvio: formData.tipoEnvio,
        descripcion: formData.descripcion,
        volumenCm3,
        pesoVolumetrico,
        pesoTasable,
        valorDeclarado: formData.valorDeclarado ? parseFloat(formData.valorDeclarado) : null,
        precioSugerido: sugerido?.precio ?? null,
        precioFinal: precioFinalNum,
        estadoPago: formData.estadoPago,
        importePagado: importePagadoNum,
        metodoPago: formData.metodoPago,
        entrega: {
          modo: formData.entregaModo,
          direccion: entregaDireccion,
          provincia: entregaProvincia,
          municipio: entregaMunicipio,
          confirmada: formData.direccionConfirmada,
        },
      });

      setReciboData({
        tracking,
        fecha: new Date(formData.fechaRegistro),
        estado: formData.estado,
        clienteNombre: selectedCliente?.nombre || '',
        clienteTelefono: selectedCliente?.telefonoEspana || '',
        destinatarioNombre: selectedDestinatario?.nombre || '',
        destinatarioDocumento: selectedDestinatario?.carnetPasaporte || '',
        destinatarioTelefono: selectedDestinatario?.telefonoCuba || '',
        destinatarioDireccion: entregaDireccion,
        destino: entregaProvincia,
        contenido: formData.contenido,
        tipoEnvio: formData.tipoEnvio,
        peso: pesoReal!,
        pesoTasable,
        precioFinal: precioFinalNum,
        importePagado: importePagadoNum,
        importePendiente,
        metodoPago: formData.metodoPago,
        estadoPago: formData.estadoPago,
      });

      setEtiquetaData({
        tracking,
        remitente: selectedCliente?.nombre || '',
        consignatario: selectedDestinatario?.nombre || '',
        direccion: `${entregaDireccion}${entregaMunicipio ? ', ' + entregaMunicipio : ''}${entregaProvincia ? ', ' + entregaProvincia : ''}`,
        telefono: selectedDestinatario?.telefonoCuba || '',
        idDestinatario: selectedDestinatario?.carnetPasaporte || '',
        peso: pesoReal!,
        piezas: 1,
        guiaMaster: '—',
        trackingInterno: tracking,
      });

      // Si venimos de una solicitud del portal cliente, marcarla como convertida
      if (solicitudOrigen?.id) {
        try {
          await marcarSolicitudConvertida(solicitudOrigen.id, tracking);
        } catch (err) {
          console.error('Error marcando solicitud como convertida:', err);
        }
        setSolicitudOrigen(null);
      }

      setSuccess(`¡Paquete registrado con éxito! Tracking: ${tracking}`);
      if (accion === 'etiqueta') setPendingPrint(true);

      resetFormulario();

      if (accion === 'normal') {
        setTimeout(() => {
          setSuccess(null);
          navigate('/dashboard');
        }, 2000);
      } else {
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Error saving package:', error);
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
    setTimeout(() => {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type,
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
      console.log('Documentos asociados al paquete:', tracking, uploadedFiles);
      setUploadedFiles([]);
    }, 1000);
  };

  const inputClass = (hasError?: boolean) => cn(
    "w-full px-4 py-2.5 bg-white border rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20",
    hasError ? "border-red-500" : "border-tp-gray-soft"
  );

  const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {children}
    </h3>
  );

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-tp-red" />
          <p className="text-sm font-medium text-tp-red">{errors.submit}</p>
        </div>
      )}

      {solicitudOrigen && (
        <div className="bg-tp-blue-light/40 border border-tp-blue/20 rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-tp-blue">
            Creando paquete desde la solicitud de <span className="font-bold">{solicitudOrigen.clienteNombre}</span>. Al registrarlo, la solicitud se marcará como convertida.
          </p>
          <button
            onClick={() => setSolicitudOrigen(null)}
            className="text-xs font-bold text-tp-blue/50 hover:text-tp-red shrink-0"
          >
            Desvincular
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulario Recepción */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-tp-gray-soft p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-tp-blue">Nuevo Paquete</h2>
            <span className="px-4 py-1.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue font-mono font-bold text-sm">{tracking}</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit('normal'); }} className="space-y-6">

            {/* ── 1. PARTICIPANTES ── */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-tp-gray-soft">
              <SectionTitle icon={Users}>1. Participantes</SectionTitle>

              {role === 'admin' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Asociar a Partner B2B / Punto Pack</label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className={cn(inputClass(), "appearance-none")}
                  >
                    <option value="">Ninguno (Envío Directo)</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.businessName} ({p.tipoColaborador === 'punto_pack' ? 'Punto Pack' : 'B2B'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente / Remitente */}
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

                  {selectedCliente ? (
                    <div className="p-3 bg-white border border-tp-blue/20 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-tp-blue text-sm">{selectedCliente.nombre}</p>
                          <p className="text-xs text-tp-blue/60">{selectedCliente.documentoIdentidad} · {selectedCliente.telefonoEspana || 'sin teléfono'}</p>
                          <p className="text-xs text-tp-blue/60 truncate">{selectedCliente.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedClienteId(''); setSelectedDestinatarioId(''); setBusquedaCliente(''); }}
                          className="text-xs text-tp-red font-bold hover:underline shrink-0"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                        <input
                          type="text"
                          value={busquedaCliente}
                          onChange={(e) => { setBusquedaCliente(e.target.value); setMostrarResultados(true); }}
                          onFocus={() => setMostrarResultados(true)}
                          onBlur={() => setTimeout(() => setMostrarResultados(false), 150)}
                          placeholder="Buscar por nombre, documento, teléfono o email..."
                          className={cn(inputClass(!!errors.cliente), "pl-10")}
                        />
                      </div>
                      {mostrarResultados && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-tp-gray-soft rounded-xl shadow-xl max-h-64 overflow-y-auto">
                          {clientesFiltrados.length === 0 ? (
                            <div className="p-3 text-sm text-tp-blue/50">
                              Sin resultados.{' '}
                              <button type="button" onMouseDown={() => setIsNewClienteModalOpen(true)} className="text-tp-red font-bold hover:underline">Crear cliente nuevo</button>
                            </div>
                          ) : clientesFiltrados.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={() => {
                                setSelectedClienteId(c.id);
                                setSelectedDestinatarioId('');
                                setErrors(prev => { const n = { ...prev }; delete n.cliente; return n; });
                              }}
                              className="w-full text-left p-3 hover:bg-tp-blue-light/40 transition-colors border-b border-tp-gray-soft last:border-0"
                            >
                              <p className="font-bold text-tp-blue text-sm">{c.nombre}</p>
                              <p className="text-xs text-tp-blue/60">{c.documentoIdentidad} · {c.telefonoEspana || c.email}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {errors.cliente && <p className="text-xs text-red-500 mt-1">{errors.cliente}</p>}
                </div>

                {/* Destinatario */}
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
                    onChange={(e) => {
                      setSelectedDestinatarioId(e.target.value);
                      setErrors(prev => { const n = { ...prev }; delete n.destinatario; return n; });
                    }}
                    disabled={!selectedClienteId}
                    className={cn(inputClass(!!errors.destinatario), "appearance-none disabled:bg-gray-100 disabled:text-tp-blue/40")}
                  >
                    <option value="">
                      {!selectedClienteId ? 'Selecciona un cliente primero' :
                        destinatarios.length === 0 ? 'No hay destinatarios — crea uno nuevo' :
                          'Seleccionar destinatario...'}
                    </option>
                    {destinatarios.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre} - {d.provincia}</option>
                    ))}
                  </select>
                  {errors.destinatario && <p className="text-xs text-red-500 mt-1">{errors.destinatario}</p>}

                  {selectedDestinatario && (
                    <div className="mt-2 p-3 bg-white border border-tp-blue/20 rounded-xl text-xs text-tp-blue/70 space-y-0.5">
                      <p><span className="font-bold text-tp-blue">{selectedDestinatario.nombre}</span> · {selectedDestinatario.carnetPasaporte || 'sin documento'}</p>
                      <p>{selectedDestinatario.telefonoCuba}</p>
                      <p>{selectedDestinatario.direccion || 'Sin dirección registrada'}{selectedDestinatario.municipio ? `, ${selectedDestinatario.municipio}` : ''}, {selectedDestinatario.provincia}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 2. DETALLES DEL PAQUETE ── */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-tp-gray-soft">
              <SectionTitle icon={Package}>2. Valores y Características</SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Fecha de Registro</label>
                  <input
                    type="datetime-local"
                    name="fechaRegistro"
                    value={formData.fechaRegistro}
                    onChange={handleChange}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Origen</label>
                  <input
                    type="text"
                    name="origen"
                    value={formData.origen}
                    onChange={handleChange}
                    className={inputClass(!!errors.origen)}
                  />
                  {errors.origen && <p className="text-xs text-red-500 mt-1">{errors.origen}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Tipo de Envío</label>
                  <select
                    name="tipoEnvio"
                    value={formData.tipoEnvio}
                    onChange={handleChange}
                    className={cn(inputClass(), "appearance-none")}
                  >
                    {TIPOS_ENVIO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Contenido Declarado *</label>
                  <textarea
                    name="contenido"
                    rows={2}
                    value={formData.contenido}
                    onChange={handleChange}
                    placeholder="Ropa, medicinas, miscelánea..."
                    className={cn(inputClass(!!errors.contenido), "resize-none")}
                  ></textarea>
                  {errors.contenido && <p className="text-xs text-red-500 mt-1">{errors.contenido}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Descripción / Notas Internas</label>
                  <textarea
                    name="descripcion"
                    rows={2}
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Detalles adicionales para el equipo..."
                    className={cn(inputClass(), "resize-none")}
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Peso Real (kg) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="peso"
                      step="0.1"
                      min="0"
                      value={formData.peso}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass(!!errors.peso)}
                    />
                    <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                  </div>
                  {errors.peso && <p className="text-xs text-red-500 mt-1">{errors.peso}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Medidas (cm) — Ancho × Largo × Alto</label>
                  <div className="flex gap-2">
                    <input type="number" name="medidasAncho" min="0" value={formData.medidasAncho} onChange={handleChange} placeholder="Ancho" className="w-1/3 px-3 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20" />
                    <input type="number" name="medidasLargo" min="0" value={formData.medidasLargo} onChange={handleChange} placeholder="Largo" className="w-1/3 px-3 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20" />
                    <input type="number" name="medidasAlto" min="0" value={formData.medidasAlto} onChange={handleChange} placeholder="Alto" className="w-1/3 px-3 py-2.5 bg-white border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Valor Declarado (€)</label>
                  <input
                    type="number"
                    name="valorDeclarado"
                    step="0.01"
                    min="0"
                    value={formData.valorDeclarado}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </div>
              </div>

              {/* Cálculos automáticos */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-tp-blue-light/30 rounded-xl border border-tp-blue/10">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-tp-blue/50 uppercase tracking-wider">Volumen</p>
                  <p className="font-black text-tp-blue">{volumenCm3 ? `${(volumenCm3 / 1000).toFixed(1)} L` : '—'}</p>
                </div>
                <div className="text-center border-x border-tp-blue/10">
                  <p className="text-[10px] font-bold text-tp-blue/50 uppercase tracking-wider">Peso Volumétrico</p>
                  <p className="font-black text-tp-blue">{pesoVolumetrico ? `${pesoVolumetrico.toFixed(2)} kg` : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-tp-blue/50 uppercase tracking-wider">Peso Tasable</p>
                  <p className="font-black text-tp-red">{pesoTasable ? `${pesoTasable.toFixed(2)} kg` : '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Estado Inicial</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className={cn(inputClass(), "appearance-none")}
                  >
                    {ESTADOS_INICIALES.map(e => <option key={e} value={e}>{e}</option>)}
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
                      className={cn(inputClass(), "resize-none")}
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. ENTREGA ── */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-tp-gray-soft">
              <SectionTitle icon={Truck}>3. Entrega en Destino</SectionTitle>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, entregaModo: 'destinatario' }))}
                  className={cn(
                    "p-3 rounded-xl border-2 text-xs font-bold transition-all",
                    formData.entregaModo === 'destinatario'
                      ? "border-tp-blue bg-tp-blue text-white shadow-md"
                      : "border-tp-gray-soft bg-white text-tp-blue/60 hover:border-tp-blue/30"
                  )}
                >
                  DIRECCIÓN DEL DESTINATARIO
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, entregaModo: 'manual' }))}
                  className={cn(
                    "p-3 rounded-xl border-2 text-xs font-bold transition-all",
                    formData.entregaModo === 'manual'
                      ? "border-tp-red bg-tp-red text-white shadow-md"
                      : "border-tp-gray-soft bg-white text-tp-blue/60 hover:border-tp-red/30"
                  )}
                >
                  DIRECCIÓN MANUAL / PUNTO DE RECOGIDA
                </button>
              </div>

              {formData.entregaModo === 'destinatario' ? (
                <div className="p-4 bg-white border border-tp-gray-soft rounded-xl flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-tp-blue/40 mt-0.5 shrink-0" />
                  {selectedDestinatario ? (
                    <p className="text-sm text-tp-blue/80">
                      {selectedDestinatario.direccion || <span className="text-tp-red font-bold">Sin dirección registrada</span>}
                      {selectedDestinatario.municipio ? `, ${selectedDestinatario.municipio}` : ''}{selectedDestinatario.provincia ? `, ${selectedDestinatario.provincia}` : ''}
                    </p>
                  ) : (
                    <p className="text-sm text-tp-blue/40 italic">Selecciona un destinatario para ver su dirección</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Dirección de Entrega *</label>
                    <input
                      type="text"
                      name="entregaDireccion"
                      value={formData.entregaDireccion}
                      onChange={handleChange}
                      placeholder="Calle, número, punto de recogida..."
                      className={inputClass(!!errors.entregaDireccion)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Provincia *</label>
                    <select
                      name="entregaProvincia"
                      value={formData.entregaProvincia}
                      onChange={handleChange}
                      className={cn(inputClass(!!errors.entregaProvincia), "appearance-none")}
                    >
                      <option value="">Seleccionar...</option>
                      {PROVINCIAS_CUBA.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Municipio</label>
                    <input type="text" name="entregaMunicipio" value={formData.entregaMunicipio} onChange={handleChange} className={inputClass()} />
                  </div>
                </div>
              )}
              {errors.entregaDireccion && <p className="text-xs text-red-500 mt-2">{errors.entregaDireccion}</p>}
              {errors.entregaProvincia && <p className="text-xs text-red-500 mt-1">{errors.entregaProvincia}</p>}

              <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.direccionConfirmada}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccionConfirmada: e.target.checked }))}
                  className="w-4 h-4 accent-tp-blue"
                />
                <span className="text-sm font-medium text-tp-blue/70">Dirección confirmada con el cliente</span>
                {!formData.direccionConfirmada && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pendiente de confirmar</span>
                )}
              </label>
            </div>

            {/* ── 4. PRECIO Y COBRO ── */}
            <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-gray-soft">
              <SectionTitle icon={Wallet}>4. Precio y Cobro</SectionTitle>

              {/* Sugerencia de precio */}
              <div className="p-4 bg-white rounded-xl border border-tp-blue/10 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-tp-blue">
                    <Calculator className="w-4 h-4" />
                    <span className="text-sm font-bold">Precio Sugerido</span>
                  </div>
                  <span className="text-2xl font-black text-tp-blue">{sugerido ? `${sugerido.precio.toFixed(2)} €` : '—'}</span>
                </div>
                {sugerido ? (
                  <ul className="mt-2 text-xs text-tp-blue/60 space-y-0.5">
                    {sugerido.explicacion.map((linea, i) => <li key={i}>· {linea}</li>)}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-tp-blue/40 italic">Introduce el peso (y medidas si aplica) para calcular el precio sugerido.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Precio Final (€)</label>
                  <input
                    type="number"
                    name="precioFinal"
                    step="0.01"
                    min="0"
                    value={formData.precioFinal}
                    onChange={handleChange}
                    disabled={!puedeEditarPrecio}
                    placeholder={sugerido ? sugerido.precio.toFixed(2) : '0.00'}
                    className={cn(inputClass(!!errors.precioFinal), !puedeEditarPrecio && "bg-gray-100 text-tp-blue/50")}
                  />
                  {!puedeEditarPrecio && <p className="text-[10px] text-tp-blue/40 mt-1">Solo administración o agentes pueden modificar el precio sugerido.</p>}
                  {errors.precioFinal && <p className="text-xs text-red-500 mt-1">{errors.precioFinal}</p>}
                </div>
                {selectedPartnerId && (
                  <div>
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Precio Aplicado (€/Kg)</label>
                    <input
                      type="number"
                      name="precioAplicado"
                      step="0.01"
                      min="0"
                      value={formData.precioAplicado}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass()}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Método de Pago</label>
                  <select
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleChange}
                    className={cn(inputClass(), "appearance-none")}
                  >
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Estado de Pago</label>
                  <select
                    name="estadoPago"
                    value={formData.estadoPago}
                    onChange={handleChange}
                    className={cn(inputClass(), "appearance-none")}
                  >
                    {ESTADOS_PAGO.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {formData.estadoPago === 'Parcial' && (
                  <div>
                    <label className="block text-sm font-medium text-tp-blue/70 mb-1.5">Importe Pagado (€)</label>
                    <input
                      type="number"
                      name="importePagado"
                      step="0.01"
                      min="0"
                      value={formData.importePagado}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass(!!errors.importePagado)}
                    />
                    {errors.importePagado && <p className="text-xs text-red-500 mt-1">{errors.importePagado}</p>}
                  </div>
                )}
                {formData.estadoPago !== 'Pagado' && precioFinalNum !== null && precioFinalNum > 0 && (
                  <div className="flex items-end">
                    <div className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-tp-red/60 uppercase tracking-wider">Pendiente de Cobro</p>
                      <p className="font-black text-tp-red text-lg">{importePendiente.toFixed(2)} €</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 5. RESUMEN Y ACCIONES ── */}
            <div className="bg-white p-6 rounded-2xl border-2 border-tp-blue/10">
              <SectionTitle icon={ClipboardList}>5. Resumen Final</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Remitente</p>
                  <p className="font-bold text-tp-blue truncate">{selectedCliente?.nombre || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Destinatario</p>
                  <p className="font-bold text-tp-blue truncate">{selectedDestinatario?.nombre || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Destino</p>
                  <p className="font-bold text-tp-blue truncate">{entregaProvincia || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Peso Tasable</p>
                  <p className="font-bold text-tp-blue">{pesoTasable ? `${pesoTasable.toFixed(2)} kg` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Precio Final</p>
                  <p className="font-black text-tp-red">{precioFinalNum !== null && precioFinalNum > 0 ? `${precioFinalNum.toFixed(2)} €` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Pagado</p>
                  <p className="font-bold text-tp-blue">{importePagadoNum.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Pendiente</p>
                  <p className={cn("font-bold", importePendiente > 0 ? "text-tp-red" : "text-tp-blue")}>{importePendiente.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Estado de Pago</p>
                  <ChipEstado estado={formData.estadoPago} />
                </div>
              </div>

              {Object.keys(errors).filter(k => k !== 'submit').length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-tp-red text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Revisa los campos marcados en rojo antes de registrar el paquete.
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={resetFormulario}
                  disabled={isSubmitting}
                  className="px-5 py-3 border border-tp-gray-soft text-tp-blue font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar / Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('otro')}
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-tp-blue text-white font-bold rounded-xl hover:bg-[#004a78] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Registrar y Agregar Otro
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('etiqueta')}
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-tp-blue text-white font-bold rounded-xl hover:bg-[#004a78] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Registrar e Imprimir Etiqueta
                </button>
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
            </div>
          </form>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-2">Acciones Rápidas</h3>

          <button type="button" className="w-full bg-white border border-tp-gray-soft hover:border-tp-blue/30 p-4 rounded-xl flex items-center gap-4 transition-all group">
            <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue group-hover:bg-tp-blue group-hover:text-white transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-tp-blue">Foto paquete</div>
              <div className="text-xs text-tp-blue/60">Capturar evidencia visual</div>
            </div>
          </button>

          <button
            type="button"
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

          <button
            type="button"
            onClick={() => etiquetaData && handlePrintEtiqueta()}
            disabled={!etiquetaData}
            className="w-full bg-white border border-tp-gray-soft hover:border-tp-blue/30 p-4 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue group-hover:bg-tp-blue group-hover:text-white transition-colors">
              <Printer className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-tp-blue">Imprimir etiqueta</div>
              <div className="text-xs text-tp-blue/60">
                {etiquetaData ? `Último: ${etiquetaData.tracking}` : 'Registra un paquete primero'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => reciboData && handlePrintRecibo()}
            disabled={!reciboData}
            className="w-full bg-white border border-tp-gray-soft hover:border-tp-blue/30 p-4 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue group-hover:bg-tp-blue group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-tp-blue">Imprimir recibo</div>
              <div className="text-xs text-tp-blue/60">
                {reciboData ? `Último: ${reciboData.tracking}` : 'Registra un paquete primero'}
              </div>
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
                            <p className="text-[10px] text-tp-blue/50">{file.size} • {file.type.split('/')[1]?.toUpperCase()}</p>
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

      {/* Modales reutilizables de Cliente y Destinatario */}
      <ClienteFormModal
        open={isNewClienteModalOpen}
        onClose={() => setIsNewClienteModalOpen(false)}
        onCreated={(id) => { setSelectedClienteId(id); setSelectedDestinatarioId(''); }}
        clientesExistentes={clientes}
      />
      <DestinatarioFormModal
        open={isNewDestinatarioModalOpen}
        onClose={() => setIsNewDestinatarioModalOpen(false)}
        onCreated={(id) => setSelectedDestinatarioId(id)}
        clienteId={selectedClienteId}
        destinatariosExistentes={destinatarios}
      />

      {/* Tabla Paquetes del Día */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
        <div className="p-5 border-b border-tp-gray-soft flex justify-between items-center">
          <h2 className="text-lg font-bold text-tp-blue">Paquetes Recibidos Hoy ({paquetesHoy.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportarExcel(`paquetes-hoy-${new Date().toISOString().slice(0, 10)}`, paquetesHoy.map(p => ({
                Tracking: p.tracking,
                Hora: p.hora,
                Cliente: p.cliente,
                Peso: p.peso,
                Destino: p.destino,
                Estado: p.estado,
              })))}
              disabled={paquetesHoy.length === 0}
              className="px-3 py-1.5 text-sm font-medium text-tp-blue bg-tp-blue-light rounded-lg hover:bg-tp-gray-soft transition-colors disabled:opacity-50"
            >
              Exportar
            </button>
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
              {paquetesHoy.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-tp-blue/40 italic">Aún no se han registrado paquetes hoy.</td>
                </tr>
              )}
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

      {/* Etiqueta y recibo ocultos para impresión */}
      {etiquetaData && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <EtiquetaPaquete ref={etiquetaRef} paquete={etiquetaData} />
        </div>
      )}
      {reciboData && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ReciboPaquete ref={reciboRef} recibo={reciboData} />
        </div>
      )}
    </div>
  );
}
