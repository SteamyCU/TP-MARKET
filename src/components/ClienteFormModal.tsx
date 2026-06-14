import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { auth } from '../supabase';
import { createCliente } from '../services/clientes';
import type { Cliente } from '../types/models';

interface ClienteFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (clienteId: string) => void;
  /** Lista actual de clientes para detectar duplicados antes de guardar */
  clientesExistentes: Cliente[];
}

const FORM_INICIAL = {
  nombre: '',
  documentoIdentidad: '',
  telefonoEspana: '',
  telefonoSecundario: '',
  email: '',
  codigoPostal: '',
  localidad: '',
  provincia: '',
  direccion: '',
  observaciones: '',
};

export function ClienteFormModal({ open, onClose, onCreated, clientesExistentes }: ClienteFormModalProps) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const normalizar = (v: string) => v.trim().toLowerCase();
  const duplicado = clientesExistentes.find(c =>
    (form.documentoIdentidad && normalizar(c.documentoIdentidad || '') === normalizar(form.documentoIdentidad)) ||
    (form.email && normalizar(c.email || '') === normalizar(form.email)) ||
    (form.telefonoEspana && (c.telefonoEspana || '').replace(/\s/g, '') === form.telefonoEspana.replace(/\s/g, ''))
  );

  const handleClose = () => {
    setForm(FORM_INICIAL);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (duplicado) {
      setError(`Ya existe un cliente con esos datos: ${duplicado.nombre} (${duplicado.documentoIdentidad}). Selecciónalo en el buscador en lugar de crear uno nuevo.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const nuevo = await createCliente({
        ...form,
        agenteId: auth.currentUser?.uid || null,
      });
      setForm(FORM_INICIAL);
      onCreated(nuevo.id);
      onClose();
    } catch (err) {
      console.error('Error saving cliente:', err);
      setError('Error al guardar el cliente. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold">Nuevo Cliente / Remitente</h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {duplicado && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Posible duplicado: <strong>{duplicado.nombre}</strong> ({duplicado.documentoIdentidad || duplicado.email}). Si es la misma persona, ciérralo y selecciónalo en el buscador.</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-tp-red text-sm font-medium">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre y Apellidos *</label>
              <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">DNI / NIE / Pasaporte *</label>
              <input type="text" required value={form.documentoIdentidad} onChange={e => setForm({ ...form, documentoIdentidad: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono Principal</label>
              <input type="tel" value={form.telefonoEspana} onChange={e => setForm({ ...form, telefonoEspana: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono Secundario</label>
              <input type="tel" value={form.telefonoSecundario} onChange={e => setForm({ ...form, telefonoSecundario: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Dirección *</label>
            <textarea required rows={2} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className={`${inputClass} resize-none`}></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Población / Localidad</label>
              <input type="text" value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Provincia (España)</label>
              <input type="text" placeholder="Madrid, Barcelona, Valencia..." value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
              <input type="text" value={form.codigoPostal} onChange={e => setForm({ ...form, codigoPostal: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Observaciones Internas</label>
            <textarea rows={2} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className={`${inputClass} resize-none`} placeholder="Notas visibles solo para el equipo..."></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
