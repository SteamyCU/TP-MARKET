import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { crearLote, generarCodigoLote } from '../../services/lotes';

interface LoteFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (loteId: string) => void;
}

export function LoteFormModal({ open, onClose, onCreated }: LoteFormModalProps) {
  const { profile } = useAuth();
  const [form, setForm] = useState(() => ({
    codigo: generarCodigoLote(),
    ruta: 'Madrid → La Habana',
    contenedor: '',
    oficinaOrigen: 'Madrid, España',
    oficinaDestino: '',
    responsable: profile?.name || '',
    fechaEstimadaSalida: '',
    fechaEstimadaLlegada: '',
    costesEstimados: '',
    notas: '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const loteId = await crearLote({
        codigo: form.codigo.trim(),
        ruta: form.ruta.trim(),
        contenedor: form.contenedor.trim(),
        oficinaOrigen: form.oficinaOrigen.trim(),
        oficinaDestino: form.oficinaDestino.trim(),
        responsable: form.responsable.trim(),
        fechaEstimadaSalida: form.fechaEstimadaSalida,
        fechaEstimadaLlegada: form.fechaEstimadaLlegada,
        costesEstimados: form.costesEstimados ? parseFloat(form.costesEstimados) : null,
        notas: form.notas.trim(),
      });
      setForm(f => ({ ...f, codigo: generarCodigoLote() }));
      onCreated(loteId);
      onClose();
    } catch (err) {
      console.error('Error creating lote:', err);
      setError('Error al crear el lote. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold">Nuevo Lote de Salida</h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-tp-red text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código del Lote *</label>
              <input type="text" required value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} className={`${inputClass} font-mono font-bold`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Ruta *</label>
              <input type="text" required value={form.ruta} onChange={e => setForm({ ...form, ruta: e.target.value })} placeholder="Madrid → La Habana" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Contenedor / Guía</label>
              <input type="text" value={form.contenedor} onChange={e => setForm({ ...form, contenedor: e.target.value })} placeholder="CNT-001 / AWB..." className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Oficina Origen</label>
              <input type="text" value={form.oficinaOrigen} onChange={e => setForm({ ...form, oficinaOrigen: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Oficina Destino</label>
              <input type="text" value={form.oficinaDestino} onChange={e => setForm({ ...form, oficinaDestino: e.target.value })} placeholder="La Habana..." className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Responsable</label>
              <input type="text" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Salida Estimada</label>
              <input type="date" value={form.fechaEstimadaSalida} onChange={e => setForm({ ...form, fechaEstimadaSalida: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Llegada Estimada</label>
              <input type="date" value={form.fechaEstimadaLlegada} onChange={e => setForm({ ...form, fechaEstimadaLlegada: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Costes Estimados (€)</label>
              <input type="number" step="0.01" min="0" value={form.costesEstimados} onChange={e => setForm({ ...form, costesEstimados: e.target.value })} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Notas</label>
              <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones del lote..." className={inputClass} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50">
              {isSubmitting ? 'Creando...' : 'Crear Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
