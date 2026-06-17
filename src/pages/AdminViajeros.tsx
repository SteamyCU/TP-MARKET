import React, { useState, useEffect, useCallback } from 'react';
import {
  Plane, Package, X, AlertCircle, Phone, Mail, Calendar, MapPin,
  CheckCircle2, Ban, Check,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  getTodasLasOfertasActivas, crearReservaAdmin, marcarReservaCompletada,
  cancelarReservaAdmin, getReservasAdmin, getKilosRestantes,
  type OfertaViajeroConContacto, type ReservaViajero,
} from '../services/viajeros';
import { cn } from '../lib/utils';

function formatFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

const ESTADO_RESERVA_BADGE: Record<string, { label: string; clase: string }> = {
  confirmada: { label: 'Confirmada', clase: 'bg-green-100 text-green-700' },
  completada: { label: 'Completada', clase: 'bg-tp-blue-light text-tp-blue' },
  cancelada:  { label: 'Cancelada',  clase: 'bg-gray-100 text-gray-500' },
};

// ---------------------------------------------------------------------------
// Modal: reservar kilos en nombre de ToPaquete
// ---------------------------------------------------------------------------
function ReservarModal({
  oferta, adminUid, onClose, onReservado,
}: {
  oferta: OfertaViajeroConContacto; adminUid: string; onClose: () => void; onReservado: () => void;
}) {
  const restantes = getKilosRestantes(oferta);
  const [kilos, setKilos] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kilosNum = parseFloat(kilos) || 0;
  const total = kilosNum * oferta.precio_kg;
  const puedeReservar = kilosNum > 0 && kilosNum <= restantes && !enviando;

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeReservar) return;
    setEnviando(true);
    setError(null);
    try {
      await crearReservaAdmin(adminUid, oferta.id, kilosNum, notas);
      onReservado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reservar los kilos.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-tp-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
          <h2 className="text-lg font-bold text-tp-blue flex items-center gap-2">
            <Package className="w-5 h-5 text-tp-red" /> Reservar kilos
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-tp-blue/50" />
          </button>
        </div>

        <form onSubmit={confirmar} className="p-6 space-y-4">
          <div className="bg-tp-blue-light/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-tp-blue">{oferta.viajero_nombre} · {oferta.provincia_destino}</div>
              <div className="text-xs text-tp-blue/50 font-medium">Sale el {formatFecha(oferta.fecha_salida)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Disponible</div>
              <div className="font-black text-tp-blue">{restantes.toFixed(1)} kg</div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-tp-red font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Kilos a reservar</label>
            <input
              type="number"
              required
              min="0.5"
              step="0.5"
              max={restantes}
              value={kilos}
              onChange={(e) => setKilos(e.target.value)}
              placeholder={`Máx. ${restantes.toFixed(1)} kg`}
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
            />
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-bold text-tp-blue/60">Precio total</span>
            <span className="text-2xl font-black text-tp-red">€{total.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Notas internas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Solo visible para el equipo de ToPaquete…"
              rows={3}
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-tp-gray-soft text-tp-blue/60 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeReservar}
              className="flex-1 py-3 rounded-2xl bg-tp-blue text-white font-bold hover:bg-[#004a78] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? 'Reservando…' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export function AdminViajeros() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'ofertas' | 'reservas'>('ofertas');

  const [ofertas, setOfertas] = useState<OfertaViajeroConContacto[]>([]);
  const [loadingOfertas, setLoadingOfertas] = useState(true);
  const [reservaOferta, setReservaOferta] = useState<OfertaViajeroConContacto | null>(null);

  const [reservas, setReservas] = useState<ReservaViajero[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  const cargarOfertas = useCallback(async () => {
    setLoadingOfertas(true);
    try {
      setOfertas(await getTodasLasOfertasActivas());
    } catch (err) {
      console.error('Error cargando ofertas de viajeros:', err);
    } finally {
      setLoadingOfertas(false);
    }
  }, []);

  const cargarReservas = useCallback(async () => {
    setLoadingReservas(true);
    try {
      setReservas(await getReservasAdmin());
    } catch (err) {
      console.error('Error cargando reservas del admin:', err);
    } finally {
      setLoadingReservas(false);
    }
  }, []);

  useEffect(() => { cargarOfertas(); }, [cargarOfertas]);
  useEffect(() => { if (tab === 'reservas') cargarReservas(); }, [tab, cargarReservas]);

  const handleCompletar = async (id: string) => {
    try {
      await marcarReservaCompletada(id);
      await cargarReservas();
    } catch (err) {
      console.error('Error marcando reserva como completada:', err);
      mostrarToast('No se pudo marcar la reserva como completada.');
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      await cancelarReservaAdmin(id);
      await Promise.all([cargarReservas(), cargarOfertas()]);
    } catch (err) {
      console.error('Error cancelando la reserva:', err);
      mostrarToast('No se pudo cancelar la reserva.');
    }
  };

  const reservasActivas = reservas.filter((r) => r.estado === 'confirmada');
  const reservasHistoricas = reservas.filter((r) => r.estado !== 'confirmada');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-tp-blue flex items-center gap-2">
          <Plane className="w-6 h-6 text-tp-red" />
          Ofertas de Viajeros
        </h1>
        <p className="text-sm text-tp-blue/50 mt-0.5">
          Revisa los viajes publicados por clientes y reserva kilos en nombre de ToPaquete.
        </p>
      </div>

      <div className="flex gap-2 border-b border-tp-gray-soft">
        {([
          ['ofertas', 'Ofertas activas'],
          ['reservas', 'Reservas confirmadas'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px',
              tab === key ? 'border-tp-red text-tp-red' : 'border-transparent text-tp-blue/50 hover:text-tp-blue',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'ofertas' ? (
        loadingOfertas ? (
          <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando ofertas…</div>
        ) : ofertas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
            <Plane className="w-12 h-12 text-tp-blue/15 mx-auto mb-3" />
            <p className="text-tp-blue/40 font-bold">No hay ofertas activas en este momento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[10px] font-black uppercase tracking-wider text-tp-blue/40">
                  <th className="px-5 py-3">Viajero</th>
                  <th className="px-5 py-3">Teléfono</th>
                  <th className="px-5 py-3">Destino</th>
                  <th className="px-5 py-3">Fecha salida</th>
                  <th className="px-5 py-3">Kg disponibles</th>
                  <th className="px-5 py-3">Kg reservados</th>
                  <th className="px-5 py-3">Precio/kg</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((o) => {
                  const restantes = getKilosRestantes(o);
                  return (
                    <tr key={o.id} className="border-t border-tp-gray-soft">
                      <td className="px-5 py-4 font-black text-tp-blue whitespace-nowrap">{o.viajero_nombre}</td>
                      <td className="px-5 py-4 text-tp-blue/60 font-medium whitespace-nowrap">
                        {o.viajero_telefono ? (
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {o.viajero_telefono}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {o.viajero_email}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-tp-blue font-bold whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-tp-blue/40" /> {o.provincia_destino}</span>
                      </td>
                      <td className="px-5 py-4 text-tp-blue/60 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatFecha(o.fecha_salida)}</span>
                      </td>
                      <td className="px-5 py-4 font-black text-tp-blue whitespace-nowrap">{restantes.toFixed(1)} kg</td>
                      <td className="px-5 py-4 text-tp-blue/50 font-medium whitespace-nowrap">{o.kilos_reservados.toFixed(1)} kg</td>
                      <td className="px-5 py-4 font-black text-tp-red whitespace-nowrap">€{o.precio_kg.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setReservaOferta(o)}
                          disabled={restantes <= 0}
                          className={cn(
                            'px-4 py-2 rounded-xl font-bold text-xs transition-colors',
                            restantes <= 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-tp-blue text-white hover:bg-[#004a78]',
                          )}
                        >
                          Reservar kilos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        loadingReservas ? (
          <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando reservas…</div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
            <Package className="w-12 h-12 text-tp-blue/15 mx-auto mb-3" />
            <p className="text-tp-blue/40 font-bold">ToPaquete aún no ha reservado kilos de ningún viaje.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...reservasActivas, ...reservasHistoricas].map((r) => {
              const badge = ESTADO_RESERVA_BADGE[r.estado] || { label: r.estado, clase: 'bg-gray-100 text-gray-500' };
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-tp-gray-soft p-5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-tp-blue text-lg">{r.viajero_nombre || 'Viajero'}</h3>
                        <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full', badge.clase)}>
                          {badge.label}
                        </span>
                      </div>
                      {r.oferta && (
                        <div className="text-sm text-tp-blue/50 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {r.oferta.provincia_destino} · {formatFecha(r.oferta.fecha_salida)}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Kg</div>
                      <div className="font-black text-tp-blue">{r.kilos_solicitados.toFixed(1)} kg</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Total</div>
                      <div className="font-black text-tp-red">€{r.precio_total.toFixed(2)}</div>
                    </div>
                    {r.contacto?.telefono && (
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Contacto</div>
                        <div className="font-bold text-tp-blue flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {r.contacto.telefono}</div>
                      </div>
                    )}
                    {r.estado === 'confirmada' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCompletar(r.id)}
                          className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Completada
                        </button>
                        <button
                          onClick={() => handleCancelar(r.id)}
                          className="px-4 py-2.5 rounded-xl bg-tp-red text-white font-bold text-sm hover:bg-[#D91F33] transition-colors flex items-center gap-1.5"
                        >
                          <Ban className="w-4 h-4" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  {r.notas_internas && (
                    <p className="text-sm text-tp-blue/60 bg-gray-50 rounded-xl p-3 leading-relaxed">
                      <strong>Notas internas:</strong> {r.notas_internas}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {reservaOferta && user?.uid && (
        <ReservarModal
          oferta={reservaOferta}
          adminUid={user.uid}
          onClose={() => setReservaOferta(null)}
          onReservado={() => {
            cargarOfertas();
            mostrarToast('Kilos reservados correctamente. Se notificó al viajero por email.');
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-tp-blue text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
          <span className="flex items-center gap-2 justify-center"><CheckCircle2 className="w-4 h-4" /> {toast}</span>
        </div>
      )}
    </div>
  );
}
