import React, { useState, useEffect } from 'react';
import { X, Receipt, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CATEGORIAS_GASTO } from '../constants/estados';
import { registrarGasto } from '../services/gastos';
import { subscribeLotes } from '../services/lotes';

interface GastoFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const FORM_INICIAL = {
  concepto: '',
  categoria: 'Transporte',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  loteId: '',
  ruta: '',
  notas: '',
};

/** Modal para registrar un gasto operativo, opcionalmente asociado a un lote. */
export function GastoFormModal({ open, onClose, onCreated }: GastoFormModalProps) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [lotes, setLotes] = useState<{ id: string; codigo: string; ruta?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const unsub = subscribeLotes({ estados: ['Abierto', 'Cerrado', 'En Tránsito'] }, (data) => {
      setLotes(data.map(l => ({ id: l.id, codigo: l.codigo, ruta: l.ruta || undefined })));
    });
    return () => unsub();
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setForm(FORM_INICIAL);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const monto = parseFloat(form.monto) || 0;
    if (monto <= 0) {
      setError('Indica un importe mayor que 0.');
      return;
    }
    setIsSubmitting(true);
    try {
      const lote = lotes.find(l => l.id === form.loteId);
      await registrarGasto({
        concepto: form.concepto.trim(),
        categoria: form.categoria,
        monto,
        fecha: form.fecha,
        loteId: lote?.id || null,
        loteCodigo: lote?.codigo || null,
        ruta: form.ruta.trim() || lote?.ruta || '',
        notas: form.notas.trim(),
      });
      setForm(FORM_INICIAL);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Error registrando gasto:', err);
      setError('Error al registrar el gasto. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2"><Receipt className="w-5 h-5" /> Nuevo Gasto</h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
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
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Concepto *</label>
            <input type="text" required value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Flete contenedor marzo, tasas aduana..." className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className={cn(inputClass, "bg-white")}>
                {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Importe (€) *</label>
              <input type="number" step="0.01" min="0" required value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Lote Asociado (Opcional)</label>
              <select value={form.loteId} onChange={e => setForm({ ...form, loteId: e.target.value })} className={cn(inputClass, "bg-white")}>
                <option value="">Sin lote (gasto general)</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}{l.ruta ? ` · ${l.ruta}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Ruta (Opcional)</label>
              <input type="text" value={form.ruta} onChange={e => setForm({ ...form, ruta: e.target.value })} placeholder="Madrid → La Habana" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Notas</label>
            <textarea rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className={cn(inputClass, "resize-none")}></textarea>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
