import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { TarifaEnvio, Modalidad, upsertTarifaEnvio } from '../services/tarifas';

interface TarifaEnvioFormModalProps {
  open: boolean;
  tarifa: TarifaEnvio | null;
  onClose: () => void;
  onSaved: () => void;
}

const FORM_INICIAL = {
  modalidad: 'regular' as Modalidad,
  peso_min: '',
  peso_max: '',
  precio_kg: '',
  activo: true,
};

export function TarifaEnvioFormModal({ open, tarifa, onClose, onSaved }: TarifaEnvioFormModalProps) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tarifa) {
      setForm({
        modalidad: tarifa.modalidad,
        peso_min: String(tarifa.peso_min),
        peso_max: tarifa.peso_max === null ? '' : String(tarifa.peso_max),
        precio_kg: String(tarifa.precio_kg),
        activo: tarifa.activo,
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setError(null);
  }, [open, tarifa]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pesoMin = parseFloat(form.peso_min);
    const precioKg = parseFloat(form.precio_kg);
    const pesoMax = form.peso_max.trim() === '' ? null : parseFloat(form.peso_max);

    if (isNaN(pesoMin) || pesoMin < 0) {
      setError('Indica un peso mínimo válido.');
      return;
    }
    if (isNaN(precioKg) || precioKg < 0) {
      setError('Indica un precio por kg válido.');
      return;
    }
    if (pesoMax !== null && (isNaN(pesoMax) || pesoMax < pesoMin)) {
      setError('El peso máximo debe ser mayor o igual al peso mínimo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertTarifaEnvio({
        ...(tarifa ? { id: tarifa.id } : {}),
        modalidad: form.modalidad,
        peso_min: pesoMin,
        peso_max: pesoMax,
        precio_kg: precioKg,
        activo: form.activo,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error guardando tarifa de envío:', err);
      setError('Error al guardar la tarifa. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2"><Tag className="w-5 h-5" /> {tarifa ? 'Editar Tramo' : 'Nuevo Tramo'}</h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
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
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Modalidad</label>
            <select
              value={form.modalidad}
              onChange={e => setForm({ ...form, modalidad: e.target.value as Modalidad })}
              className={cn(inputClass, "bg-white")}
            >
              <option value="regular">Regular (Marítimo)</option>
              <option value="express">Express (Aéreo)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Peso mínimo (kg)</label>
              <input type="number" step="0.01" min="0" required value={form.peso_min} onChange={e => setForm({ ...form, peso_min: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Peso máximo (kg)</label>
              <input type="number" step="0.01" min="0" placeholder="Sin límite" value={form.peso_max} onChange={e => setForm({ ...form, peso_max: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Precio por kg (€)</label>
            <input type="number" step="0.01" min="0" required value={form.precio_kg} onChange={e => setForm({ ...form, precio_kg: e.target.value })} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-tp-blue/70 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 accent-tp-red" />
            Tramo activo
          </label>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
