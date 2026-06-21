import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createDestinatario } from '../services/destinatarios';
import { PROVINCIAS_CUBA } from '../constants/estados';
import type { Destinatario } from '../types/models';

interface DestinatarioFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (destinatarioId: string) => void;
  clienteId: string;
  /** Destinatarios actuales del cliente para detectar duplicados */
  destinatariosExistentes: Destinatario[];
}

const FORM_INICIAL = {
  nombre: '',
  carnetPasaporte: '',
  telefonoCuba: '',
  telefonoSecundario: '',
  email: '',
  direccion: '',
  provincia: '',
  municipio: '',
  codigoPostal: '',
};

export function DestinatarioFormModal({ open, onClose, onCreated, clienteId, destinatariosExistentes }: DestinatarioFormModalProps) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const normalizar = (v: string) => v.trim().toLowerCase();
  const duplicado = destinatariosExistentes.find(d =>
    (form.carnetPasaporte && normalizar(d.carnetPasaporte || '') === normalizar(form.carnetPasaporte)) ||
    (form.telefonoCuba && (d.telefonoCuba || '').replace(/\s/g, '') === form.telefonoCuba.replace(/\s/g, ''))
  );

  const handleClose = () => {
    setForm(FORM_INICIAL);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clienteId) {
      setError('No se pudo identificar tu cuenta. Cierra esta ventana, recarga la página e inténtalo de nuevo. Si el problema persiste, contacta con soporte.');
      return;
    }
    if (duplicado) {
      setError(`Este cliente ya tiene un destinatario con esos datos: ${duplicado.nombre}. Selecciónalo en la lista en lugar de crear uno nuevo.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const nuevo = await createDestinatario({
        ...form,
        clienteId,
      });
      setForm(FORM_INICIAL);
      onCreated(nuevo.id);
      onClose();
    } catch (err) {
      console.error('Error saving destinatario:', err);
      setError('Error al guardar el destinatario. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white shrink-0">
          <h3 className="font-bold">Nuevo Destinatario (Cuba)</h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form id="form-nuevo-destinatario" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {duplicado && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Posible duplicado: <strong>{duplicado.nombre}</strong> ({duplicado.carnetPasaporte || duplicado.telefonoCuba}).</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-tp-red text-sm font-medium">{error}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre y Apellidos *</label>
            <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Carnet o Pasaporte *</label>
              <input type="text" required value={form.carnetPasaporte} onChange={e => setForm({ ...form, carnetPasaporte: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono en Cuba *</label>
              <input type="tel" required value={form.telefonoCuba} onChange={e => setForm({ ...form, telefonoCuba: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono Secundario</label>
              <input type="tel" value={form.telefonoSecundario} onChange={e => setForm({ ...form, telefonoSecundario: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Calle, número, piso, etc. *</label>
            <textarea required rows={2} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className={`${inputClass} resize-none`}></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Provincia *</label>
              <select required value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Seleccionar...</option>
                {PROVINCIAS_CUBA.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Municipio *</label>
              <input type="text" required value={form.municipio} onChange={e => setForm({ ...form, municipio: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
              <input type="text" value={form.codigoPostal} onChange={e => setForm({ ...form, codigoPostal: e.target.value })} className={inputClass} />
            </div>
          </div>
        </form>
        <div className="p-4 border-t border-tp-gray-soft flex justify-end gap-3 shrink-0 bg-white">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" form="form-nuevo-destinatario" disabled={isSubmitting} className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50">
            {isSubmitting ? 'Guardando...' : 'Guardar Destinatario'}
          </button>
        </div>
      </div>
    </div>
  );
}
