import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { METODOS_PAGO } from '../constants/estados';
import { registrarCobro, type PaqueteConDeuda } from '../services/pagos';
import { subscribePaquetes } from '../services/paquetes';

interface NuevoCobroModalProps {
  open: boolean;
  onClose: () => void;
  onDone?: (tracking: string, monto: number) => void;
}

/** Modal para registrar un cobro sobre cualquier paquete con importe pendiente. */
export function NuevoCobroModal({ open, onClose, onDone }: NuevoCobroModalProps) {
  const [paquetesConDeuda, setPaquetesConDeuda] = useState<PaqueteConDeuda[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<PaqueteConDeuda | null>(null);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Efectivo');
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const unsub = subscribePaquetes({ conDeuda: true }, (data) => {
      setPaquetesConDeuda(data as unknown as PaqueteConDeuda[]);
    });
    return () => unsub();
  }, [open]);

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return paquetesConDeuda.slice(0, 8);
    return paquetesConDeuda.filter(p =>
      (p.tracking || '').toLowerCase().includes(term) ||
      (p.clienteNombre || '').toLowerCase().includes(term)
    ).slice(0, 8);
  }, [paquetesConDeuda, busqueda]);

  if (!open) return null;

  const pendiente = seleccionado?.importePendiente || 0;
  const montoNum = parseFloat(monto) || 0;

  const reset = () => {
    setSeleccionado(null);
    setBusqueda('');
    setMonto('');
    setMetodo('Efectivo');
    setNota('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!seleccionado) {
      setError('Selecciona el paquete que se está cobrando.');
      return;
    }
    if (montoNum <= 0) {
      setError('Indica un importe mayor que 0.');
      return;
    }
    if (montoNum > pendiente + 0.001) {
      setError(`El importe supera el pendiente de cobro (${pendiente.toFixed(2)} €).`);
      return;
    }
    setIsSubmitting(true);
    try {
      await registrarCobro({ paquete: seleccionado, monto: montoNum, metodo, nota: nota.trim() || undefined });
      onDone?.(seleccionado.tracking, montoNum);
      reset();
      onClose();
    } catch (err) {
      console.error('Error registrando cobro:', err);
      setError('Error al registrar el cobro. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2"><Wallet className="w-5 h-5" /> Nuevo Cobro</h3>
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

          {seleccionado ? (
            <div className="p-4 bg-tp-blue-light/30 border border-tp-blue/10 rounded-xl">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-mono font-black text-tp-blue">{seleccionado.tracking}</p>
                  <p className="text-sm text-tp-blue/70">{seleccionado.clienteNombre || 'Sin cliente'}</p>
                </div>
                <button type="button" onClick={() => setSeleccionado(null)} className="text-xs font-bold text-tp-red hover:underline shrink-0">
                  Cambiar
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-tp-gray-soft">
                  <p className="text-tp-blue/40 font-bold uppercase text-[9px]">Precio</p>
                  <p className="font-black text-tp-blue">{(seleccionado.precioFinal || 0).toFixed(2)} €</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-tp-gray-soft">
                  <p className="text-tp-blue/40 font-bold uppercase text-[9px]">Pagado</p>
                  <p className="font-black text-green-700">{(seleccionado.importePagado || 0).toFixed(2)} €</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-tp-gray-soft">
                  <p className="text-tp-blue/40 font-bold uppercase text-[9px]">Pendiente</p>
                  <p className="font-black text-tp-red">{pendiente.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Paquete con deuda *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por tracking o cliente..."
                  className={cn(inputClass, "pl-9")}
                />
              </div>
              <div className="mt-2 border border-tp-gray-soft rounded-xl divide-y divide-tp-gray-soft max-h-56 overflow-y-auto">
                {filtrados.length === 0 && (
                  <p className="p-4 text-center text-sm text-tp-blue/40 italic">
                    {paquetesConDeuda.length === 0 ? 'No hay paquetes con pago pendiente. ¡Todo cobrado!' : 'Sin resultados.'}
                  </p>
                )}
                {filtrados.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSeleccionado(p); setMonto(String(p.importePendiente || '')); }}
                    className="w-full text-left p-3 hover:bg-tp-blue-light/30 transition-colors flex justify-between items-center gap-2"
                  >
                    <div>
                      <p className="font-mono font-bold text-tp-blue text-sm">{p.tracking}</p>
                      <p className="text-xs text-tp-blue/50">{p.clienteNombre || '—'}</p>
                    </div>
                    <span className="font-black text-tp-red text-sm shrink-0">{(p.importePendiente || 0).toFixed(2)} €</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Importe a Cobrar (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className={inputClass}
              />
              {seleccionado && montoNum > 0 && montoNum < pendiente && (
                <p className="text-[10px] text-amber-700 font-bold mt-1">Cobro parcial: quedarán {(pendiente - montoNum).toFixed(2)} € pendientes.</p>
              )}
              {seleccionado && Math.abs(montoNum - pendiente) < 0.001 && montoNum > 0 && (
                <p className="text-[10px] text-green-700 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Liquida la deuda del paquete.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Método de Pago</label>
              <select value={metodo} onChange={e => setMetodo(e.target.value)} className={cn(inputClass, "bg-white")}>
                {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nota (Opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Referencia del comprobante, observaciones..."
              className={inputClass}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={isSubmitting || !seleccionado}
              className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
