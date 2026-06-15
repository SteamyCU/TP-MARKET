import React, { useState, useEffect } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { TarifaExpressContenido, TipoPrecioExpress, upsertTarifaExpressContenido } from '../services/tarifas';

interface TarifaExpressContenidoFormModalProps {
  open: boolean;
  tarifa: TarifaExpressContenido | null;
  onClose: () => void;
  onSaved: () => void;
}

const FORM_INICIAL = {
  tipo_precio: 'kg' as TipoPrecioExpress,
  precio: '',
  activo: true,
};

export function TarifaExpressContenidoFormModal({ open, tarifa, onClose, onSaved }: TarifaExpressContenidoFormModalProps) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tarifa) {
      setForm({
        tipo_precio: tarifa.tipo_precio,
        precio: String(tarifa.precio),
        activo: tarifa.activo,
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setError(null);
  }, [open, tarifa]);

  if (!open || !tarifa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const precio = parseFloat(form.precio);
    if (isNaN(precio) || precio < 0) {
      setError('Indica un precio válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertTarifaExpressContenido({
        id: tarifa.id,
        tipo_precio: form.tipo_precio,
        precio,
        activo: form.activo,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error guardando precio Express:', err);
      setError('Error al guardar el precio. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2"><Zap className="w-5 h-5" /> Editar Precio Express</h3>
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
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Contenido</label>
            <input type="text" value={tarifa.contenido} disabled className={cn(inputClass, "bg-gray-100 text-tp-blue/60")} />
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Tipo de precio</label>
            <select
              value={form.tipo_precio}
              onChange={e => setForm({ ...form, tipo_precio: e.target.value as TipoPrecioExpress })}
              className={cn(inputClass, "bg-white")}
            >
              <option value="kg">Por kg (€/kg)</option>
              <option value="unidad">Por unidad (€/unidad)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">
              Precio (€{form.tipo_precio === 'kg' ? '/kg' : '/unidad'})
            </label>
            <input type="number" step="0.01" min="0" required value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-tp-blue/70 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 accent-tp-red" />
            Activo
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
