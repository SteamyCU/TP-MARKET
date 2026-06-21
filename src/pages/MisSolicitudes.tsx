import React, { useState, useEffect } from 'react';
import { Plus, X, Send, AlertCircle, CheckCircle2, PackagePlus, Info } from 'lucide-react';
import { subscribeDestinatarios } from '../services/destinatarios';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { ChipEstado } from '../components/ChipEstado';
import { DestinatarioFormModal } from '../components/DestinatarioFormModal';
import { crearSolicitud, actualizarEstadoSolicitud, obtenerOCrearClienteDoc, subscribeSolicitudes } from '../services/solicitudes';
import { TIPOS_ENVIO, ESTADOS_SOLICITUD_ABIERTOS } from '../constants/estados';
import type { Destinatario, Solicitud } from '../types/models';

const FORM_INICIAL = {
  destinatarioId: '',
  contenido: '',
  tipoEnvio: 'Miscelánea',
  modalidad: 'regular' as 'regular' | 'express',
  pesoEstimado: '',
  observaciones: '',
};

export function MisSolicitudes() {
  const { profile, user } = useAuth();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [solicitudes, setSolicitudes] = useState<(Solicitud & { createdAt?: any })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDestinatarioModalOpen, setIsDestinatarioModalOpen] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    obtenerOCrearClienteDoc()
      .then(setClienteId)
      .catch((err) => console.error('Error obteniendo cliente:', err));
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const unsub = subscribeDestinatarios({ clienteId }, (data) => {
      setDestinatarios(data as unknown as Destinatario[]);
    });
    return () => unsub();
  }, [clienteId]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeSolicitudes({ clienteUid: user.uid }, (data) => {
      setSolicitudes(data as unknown as (Solicitud & { createdAt?: any })[]);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const notificar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clienteId) {
      setError('No se pudo cargar tu ficha de cliente. Recarga la página e inténtalo de nuevo.');
      return;
    }
    const destinatario = destinatarios.find(d => d.id === form.destinatarioId);
    if (!destinatario) {
      setError('Selecciona el destinatario en Cuba.');
      return;
    }
    if (!form.contenido.trim()) {
      setError('Describe el contenido que quieres enviar.');
      return;
    }
    setIsSubmitting(true);
    try {
      await crearSolicitud({
        clienteId,
        clienteNombre: profile?.name || user?.displayName || user?.email || '',
        clienteEmail: user?.email || '',
        clienteTelefono: profile?.telefono || '',
        destinatarioId: destinatario.id,
        destinatarioNombre: destinatario.nombre,
        destinatarioProvincia: destinatario.provincia || '',
        contenido: form.contenido.trim(),
        tipoEnvio: form.tipoEnvio,
        modalidad: form.modalidad,
        pesoEstimado: form.pesoEstimado ? parseFloat(form.pesoEstimado) : null,
        observaciones: form.observaciones.trim(),
      });
      setForm(FORM_INICIAL);
      setIsModalOpen(false);
      notificar('¡Solicitud enviada! Nuestro equipo la revisará en breve.');
    } catch (err) {
      console.error('Error creating solicitud:', err);
      setError('Error al enviar la solicitud. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelar = async (solicitud: Solicitud) => {
    if (!window.confirm('¿Cancelar esta solicitud de envío?')) return;
    try {
      await actualizarEstadoSolicitud(solicitud.id, 'Cancelada');
      notificar('Solicitud cancelada.');
    } catch (err) {
      console.error('Error cancelling solicitud:', err);
      notificar('No se pudo cancelar la solicitud.');
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Mis Solicitudes de Envío</h1>
          <p className="text-tp-blue/60 mt-1">Solicita un envío y nuestro equipo lo gestionará contigo</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-tp-red hover:bg-[#D91F33] text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nueva Solicitud
        </button>
      </div>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{mensaje}</p>
        </div>
      )}

      {/* Lista de solicitudes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-tp-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-tp-gray-soft text-center">
          <PackagePlus className="w-16 h-16 mx-auto text-tp-blue/20 mb-4" />
          <h2 className="text-lg font-bold text-tp-blue mb-2">Aún no tienes solicitudes</h2>
          <p className="text-tp-blue/60 text-sm max-w-md mx-auto">
            Crea tu primera solicitud de envío: indica qué quieres enviar y a quién, y nuestro equipo se encargará del resto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solicitudes.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-tp-gray-soft space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-tp-blue">{s.contenido}</p>
                  <p className="text-xs text-tp-blue/50 mt-0.5">
                    {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · {s.tipoEnvio}
                    {' · '}{s.modalidad === 'express' ? 'Express' : 'Regular'}
                    {s.pesoEstimado ? ` · ~${s.pesoEstimado} kg` : ''}
                  </p>
                </div>
                <ChipEstado estado={s.estado} />
              </div>
              <p className="text-sm text-tp-blue/70">
                Para: <span className="font-bold">{s.destinatarioNombre}</span>
                {s.destinatarioProvincia ? ` (${s.destinatarioProvincia})` : ''}
              </p>
              {s.estado === 'Faltan datos' && s.notaParaCliente && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><span className="font-bold">Necesitamos más información:</span> {s.notaParaCliente}</span>
                </div>
              )}
              {s.estado === 'Convertida en paquete' && s.tracking && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                  Tu envío está en marcha. Tracking: <span className="font-mono font-bold">{s.tracking}</span>
                </div>
              )}
              {ESTADOS_SOLICITUD_ABIERTOS.includes(s.estado) && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCancelar(s)}
                    className="text-xs font-bold text-tp-blue/40 hover:text-tp-red transition-colors"
                  >
                    Cancelar solicitud
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva solicitud */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Nueva Solicitud de Envío</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-tp-red text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5 flex justify-between items-center">
                  Destinatario en Cuba *
                  <button
                    type="button"
                    onClick={() => setIsDestinatarioModalOpen(true)}
                    disabled={!clienteId}
                    className="text-xs text-tp-red font-bold hover:underline disabled:opacity-50"
                  >
                    + Crear nuevo
                  </button>
                </label>
                <select
                  required
                  value={form.destinatarioId}
                  onChange={e => setForm({ ...form, destinatarioId: e.target.value })}
                  className={cn(inputClass, "bg-white")}
                >
                  <option value="">
                    {destinatarios.length === 0 ? 'No tienes destinatarios — crea uno nuevo' : 'Seleccionar destinatario...'}
                  </option>
                  {destinatarios.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre} - {d.provincia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">¿Qué quieres enviar? *</label>
                <textarea
                  required
                  rows={2}
                  value={form.contenido}
                  onChange={e => setForm({ ...form, contenido: e.target.value })}
                  placeholder="Ropa, medicinas, alimentos..."
                  className={cn(inputClass, "resize-none")}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Tipo de Envío</label>
                  <select
                    value={form.tipoEnvio}
                    onChange={e => setForm({ ...form, tipoEnvio: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  >
                    {TIPOS_ENVIO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Modalidad de Envío</label>
                  <select
                    value={form.modalidad}
                    onChange={e => setForm({ ...form, modalidad: e.target.value as 'regular' | 'express' })}
                    className={cn(inputClass, "bg-white")}
                  >
                    <option value="regular">Regular</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Peso Estimado (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.pesoEstimado}
                  onChange={e => setForm({ ...form, pesoEstimado: e.target.value })}
                  placeholder="Aproximado, lo confirmaremos en oficina"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Observaciones</label>
                <textarea
                  rows={2}
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Cualquier detalle que debamos saber..."
                  className={cn(inputClass, "resize-none")}
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal destinatario reutilizado */}
      <DestinatarioFormModal
        open={isDestinatarioModalOpen}
        onClose={() => setIsDestinatarioModalOpen(false)}
        onCreated={(id) => setForm(f => ({ ...f, destinatarioId: id }))}
        clienteId={clienteId || ''}
        destinatariosExistentes={destinatarios}
      />
    </div>
  );
}
