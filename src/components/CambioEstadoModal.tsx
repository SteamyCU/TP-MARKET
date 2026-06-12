import React, { useState, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChipEstado } from './ChipEstado';
import { ESTADOS_PAQUETE, GRUPOS_ESTADO } from '../constants/estados';
import { cambiarEstado, advertenciasCambioEstado, type PaqueteParaCambio, type TipoCambioEstado } from '../services/estados';

interface CambioEstadoModalProps {
  open: boolean;
  onClose: () => void;
  /** Uno o varios paquetes: con uno es cambio individual, con varios es masivo */
  paquetes: PaqueteParaCambio[];
  /** Origen del cambio para el historial (por defecto se infiere de la cantidad) */
  tipoCambio?: TipoCambioEstado;
  onDone?: (nuevoEstado: string, actualizados: number) => void;
}

export function CambioEstadoModal({ open, onClose, paquetes, tipoCambio, onDone }: CambioEstadoModalProps) {
  const esMasivo = paquetes.length > 1;
  const paqueteUnico = paquetes.length === 1 ? paquetes[0] : null;

  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [nota, setNota] = useState('');
  const [detallesIncidencia, setDetallesIncidencia] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estadoSeleccionado = nuevoEstado || paqueteUnico?.estado || '';
  const advertencias = useMemo(
    () => (estadoSeleccionado ? advertenciasCambioEstado(paquetes, estadoSeleccionado) : []),
    [paquetes, estadoSeleccionado]
  );

  if (!open || paquetes.length === 0) return null;

  const grupos = (['origen', 'transito', 'destino', 'final', 'alerta'] as const)
    .map(g => ({ grupo: g, estados: ESTADOS_PAQUETE.filter(e => e.grupo === g) }))
    .filter(g => g.estados.length > 0);

  const reset = () => {
    setNuevoEstado('');
    setMotivo('');
    setNota('');
    setDetallesIncidencia('');
    setConfirmado(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!estadoSeleccionado) {
      setError('Selecciona el nuevo estado.');
      return;
    }
    if (esMasivo && !confirmado) {
      setError(`Marca la casilla de confirmación para aplicar el cambio a ${paquetes.length} paquetes.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const actualizados = await cambiarEstado(paquetes, estadoSeleccionado, {
        motivo: motivo.trim() || undefined,
        nota: nota.trim() || undefined,
        detallesIncidencia: detallesIncidencia.trim() || undefined,
        tipoCambio: tipoCambio || (esMasivo ? 'masivo' : 'individual'),
      });
      onDone?.(estadoSeleccionado, actualizados);
      reset();
      onClose();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Error al actualizar el estado. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2">
            {esMasivo && <Layers className="w-4 h-4" />}
            {esMasivo ? `Cambio Masivo de Estado` : `Actualizar Estado: ${paqueteUnico?.tracking}`}
          </h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {esMasivo ? (
            <div className="p-3 bg-tp-blue-light/40 border border-tp-blue/10 rounded-xl text-sm text-tp-blue">
              Se cambiará el estado de <span className="font-black">{paquetes.length} paquetes</span> seleccionados.
            </div>
          ) : paqueteUnico && (
            <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 border border-tp-gray-soft rounded-xl">
              <ChipEstado estado={paqueteUnico.estado || '—'} />
              <ArrowRight className="w-4 h-4 text-tp-blue/40" />
              {nuevoEstado ? <ChipEstado estado={nuevoEstado} /> : <span className="text-xs text-tp-blue/40 italic">selecciona estado</span>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nuevo Estado *</label>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
              required
              className={cn(inputClass, "bg-white")}
            >
              <option value="">Seleccionar estado...</option>
              {grupos.map(({ grupo, estados }) => (
                <optgroup key={grupo} label={GRUPOS_ESTADO[grupo]}>
                  {estados.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {nuevoEstado === 'Incidencia' && (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Detalles de la Incidencia</label>
              <textarea
                rows={2}
                value={detallesIncidencia}
                onChange={e => setDetallesIncidencia(e.target.value)}
                placeholder="Describa el problema..."
                className={cn(inputClass, "resize-none")}
              ></textarea>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Motivo (Opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: salida confirmada, error de registro..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nota Interna (Opcional)</label>
            <textarea
              rows={2}
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Comentario para el historial del paquete..."
              className={cn(inputClass, "resize-none")}
            ></textarea>
          </div>

          {advertencias.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              {advertencias.map((a, i) => (
                <p key={i} className="text-xs text-amber-800 font-medium flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {a}
                </p>
              ))}
            </div>
          )}

          {esMasivo && (
            <label className="flex items-start gap-2 cursor-pointer select-none p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={e => setConfirmado(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-tp-red"
              />
              <span className="text-sm font-bold text-tp-blue">
                Confirmo que quiero cambiar el estado de {paquetes.length} paquetes{nuevoEstado ? ` a "${nuevoEstado}"` : ''}.
              </span>
            </label>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-tp-red text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={isSubmitting || !nuevoEstado || (esMasivo && !confirmado)}
              className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Actualizando...' : esMasivo ? `Aplicar a ${paquetes.length} paquetes` : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
