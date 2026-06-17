import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Luggage, MapPin, Calendar, Package, Zap, Plus, X, Pause, Play, Ban,
  AlertCircle, ShieldAlert, Filter, Check, ThumbsDown, Phone,
  MessageCircle, Mail, Clock, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { PROVINCIAS_CUBA } from '../services/tarifas';
import {
  getOfertasActivas, getMisOfertas, crearOferta, actualizarEstadoOferta,
  getKilosRestantes, crearReserva, aceptarReserva, rechazarReserva, cancelarReserva,
  getMisReservas, getSolicitudesRecibidas, isMarketplacePublicoActivo,
  getReservasConfirmadasDeOfertas,
  type OfertaViajero, type EstadoOfertaViajero, type ReservaViajero, type EstadoReservaViajero,
} from '../services/viajeros';
import { cn } from '../lib/utils';

const TERMINOS_VIAJERO = `Acepto que: (1) llevaré el equipaje bajo mi entera responsabilidad como pasajero; (2) revisaré el contenido de cualquier paquete antes de aceptarlo, pudiendo rechazarlo si no coincide con lo declarado o contiene algo ilegal; (3) ToPaquete actúa como plataforma de conexión y no asume responsabilidad por pérdida, daño, retraso o problemas aduanales; (4) acepto los Términos y Condiciones del Programa de Viajeros.`;

const TERMINOS_RESERVA = `Declaro que el contenido del paquete es legal, verídico y no contiene artículos prohibidos. Entiendo que el viajero podrá inspeccionar el contenido antes de aceptarlo. ToPaquete actúa únicamente como plataforma de conexión y no se hace responsable por pérdida, daño, retraso o problemas derivados de este envío.`;

const ESTADO_RESERVA_BADGE: Record<EstadoReservaViajero, { label: string; clase: string }> = {
  pendiente:  { label: 'Pendiente',  clase: 'bg-amber-100 text-amber-700' },
  aceptada:   { label: 'Aceptada',   clase: 'bg-green-100 text-green-700' },
  rechazada:  { label: 'Rechazada',  clase: 'bg-red-100 text-tp-red' },
  cancelada:  { label: 'Cancelada',  clase: 'bg-gray-100 text-gray-500' },
  completada: { label: 'Completada', clase: 'bg-tp-blue-light text-tp-blue' },
  confirmada: { label: 'Confirmada', clase: 'bg-green-100 text-green-700' },
};

function whatsappLink(telefono: string): string {
  const digits = telefono.replace(/[^\d+]/g, '').replace(/^\+/, '');
  return `https://wa.me/${digits}`;
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

const ESTADO_BADGE: Record<EstadoOfertaViajero, { label: string; clase: string }> = {
  activa:      { label: 'Activa',      clase: 'bg-green-100 text-green-700' },
  pausada:     { label: 'Pausada',     clase: 'bg-amber-100 text-amber-700' },
  completada:  { label: 'Completada',  clase: 'bg-tp-blue-light text-tp-blue' },
  cancelada:   { label: 'Cancelada',   clase: 'bg-gray-100 text-gray-500' },
};

// ---------------------------------------------------------------------------
// Card de oferta (tablero)
// ---------------------------------------------------------------------------
function OfertaCard({ oferta, onReservar }: { oferta: OfertaViajero; onReservar: (o: OfertaViajero) => void }) {
  const restantes = getKilosRestantes(oferta);
  const agotada = restantes <= 0;

  return (
    <div className="bg-white rounded-3xl border border-tp-gray-soft shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-tp-blue/40 text-xs font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" /> Destino
          </div>
          <h3 className="text-2xl font-black text-tp-blue leading-tight">{oferta.provincia_destino}</h3>
        </div>
        <span className="inline-flex items-center gap-1 bg-tp-red text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0">
          <Zap className="w-3 h-3" /> Express
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-tp-blue/70 font-medium mb-4">
        <Calendar className="w-4 h-4 text-tp-blue/40" />
        Sale el {formatFecha(oferta.fecha_salida)}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-tp-blue-light/30 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40 mb-1">Kg disponibles</div>
          <div className={cn('text-2xl font-black', agotada ? 'text-tp-blue/30' : 'text-tp-blue')}>
            {restantes.toFixed(1)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40 mb-1">Precio</div>
          <div className="text-2xl font-black text-tp-red">€{oferta.precio_kg.toFixed(2)}<span className="text-sm text-tp-blue/40 font-bold">/kg</span></div>
        </div>
      </div>

      {oferta.viajero_nombre && (
        <div className="text-xs text-tp-blue/50 font-medium mb-2">
          Viajero: <span className="font-bold text-tp-blue/70">{oferta.viajero_nombre}</span>
        </div>
      )}

      {oferta.notas && (
        <p className="text-sm text-tp-blue/60 bg-gray-50 rounded-2xl p-3 mb-4 leading-relaxed">{oferta.notas}</p>
      )}

      <button
        onClick={() => onReservar(oferta)}
        disabled={agotada}
        className={cn(
          'mt-auto w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2',
          agotada
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-tp-blue text-white hover:bg-[#004a78] active:scale-[0.98]',
        )}
      >
        <Package className="w-4 h-4" />
        {agotada ? 'Sin kilos disponibles' : 'Reservar kilos'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal publicar viaje
// ---------------------------------------------------------------------------
function PublicarViajeModal({ onClose, onPublicado }: { onClose: () => void; onPublicado: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const identidadVerificada = Boolean(profile?.documentoIdentidadUrl);

  const [form, setForm] = useState({
    provincia_destino: '',
    fecha_salida: '',
    kilos_disponibles: '',
    precio_kg: '',
    notas: '',
  });
  const [acepta, setAcepta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date().toISOString().split('T')[0];

  const camposCompletos =
    form.provincia_destino && form.fecha_salida &&
    parseFloat(form.kilos_disponibles) > 0 && parseFloat(form.precio_kg) > 0;
  const puedePublicar = identidadVerificada && acepta && camposCompletos && !publishing;

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !puedePublicar) return;
    setPublishing(true);
    setError(null);
    try {
      await crearOferta(user.uid, {
        provincia_destino: form.provincia_destino,
        fecha_salida: form.fecha_salida,
        kilos_disponibles: parseFloat(form.kilos_disponibles),
        precio_kg: parseFloat(form.precio_kg),
        notas: form.notas,
        acepto_terminos: acepta,
      });
      onPublicado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el viaje.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-tp-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
          <h2 className="text-lg font-bold text-tp-blue flex items-center gap-2">
            <Plane className="w-5 h-5 text-tp-red" /> Publicar mi viaje
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-tp-blue/50" />
          </button>
        </div>

        {!identidadVerificada ? (
          // Gate: identidad no verificada
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-black text-tp-blue text-lg">Verifica tu identidad primero</h3>
            <p className="text-sm text-tp-blue/60 leading-relaxed max-w-sm mx-auto">
              Para publicar un viaje necesitas verificar tu identidad. Sube tu documento desde Mi Perfil.
            </p>
            <button
              onClick={() => { onClose(); navigate('/dashboard/perfil'); }}
              className="px-6 py-3 bg-tp-blue text-white rounded-2xl font-bold hover:bg-[#004a78] transition-colors"
            >
              Ir a Mi Perfil
            </button>
          </div>
        ) : (
          <form onSubmit={publicar} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-tp-red font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Provincia destino</label>
              <select
                required
                value={form.provincia_destino}
                onChange={(e) => setForm({ ...form, provincia_destino: e.target.value })}
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              >
                <option value="">Selecciona una provincia…</option>
                {PROVINCIAS_CUBA.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Fecha de salida</label>
                <input
                  type="date"
                  required
                  min={hoy}
                  value={form.fecha_salida}
                  onChange={(e) => setForm({ ...form, fecha_salida: e.target.value })}
                  className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Kilos disponibles</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={form.kilos_disponibles}
                  onChange={(e) => setForm({ ...form, kilos_disponibles: e.target.value })}
                  placeholder="Ej: 10"
                  className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Precio por kilo (€)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.precio_kg}
                onChange={(e) => setForm({ ...form, precio_kg: e.target.value })}
                placeholder="Ej: 8.00"
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Notas (opcional)</label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Restricciones, tipo de equipaje, punto de entrega, etc."
                rows={3}
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
              />
            </div>

            {/* Cláusula de exención de responsabilidad */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-tp-gray-soft">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acepta}
                  onChange={(e) => setAcepta(e.target.checked)}
                  className="w-4 h-4 accent-tp-red mt-0.5 shrink-0"
                />
                <span className="text-xs text-tp-blue/70 font-medium leading-relaxed">{TERMINOS_VIAJERO}</span>
              </label>
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
                disabled={!puedePublicar}
                className="flex-1 py-3 rounded-2xl bg-tp-blue text-white font-bold hover:bg-[#004a78] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {publishing ? 'Publicando…' : 'Publicar viaje'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal reservar kilos
// ---------------------------------------------------------------------------
function ReservarKilosModal({
  oferta, clienteId, onClose, onReservado,
}: {
  oferta: OfertaViajero; clienteId: string; onClose: () => void; onReservado: () => void;
}) {
  const restantes = getKilosRestantes(oferta);
  const [kilos, setKilos] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kilosNum = parseFloat(kilos) || 0;
  const total = kilosNum * oferta.precio_kg;
  const puedeEnviar = acepta && kilosNum > 0 && kilosNum <= restantes && !enviando;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      await crearReserva(oferta.id, clienteId, kilosNum, mensaje, acepta);
      onReservado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
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

        <form onSubmit={enviar} className="p-6 space-y-4">
          <div className="bg-tp-blue-light/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-tp-blue">{oferta.provincia_destino}</div>
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
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Mensaje para el viajero (opcional)</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe brevemente qué vas a enviar…"
              rows={3}
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="w-4 h-4 accent-tp-red mt-0.5 shrink-0"
            />
            <span className="text-xs text-tp-blue/70 font-medium leading-relaxed">{TERMINOS_RESERVA}</span>
          </label>

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
              disabled={!puedeEnviar}
              className="flex-1 py-3 rounded-2xl bg-tp-blue text-white font-bold hover:bg-[#004a78] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal rechazar solicitud (motivo opcional)
// ---------------------------------------------------------------------------
function RechazarReservaModal({
  onClose, onConfirmar,
}: {
  onClose: () => void; onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    setEnviando(true);
    try {
      await onConfirmar(motivo);
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-tp-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
          <h2 className="text-lg font-bold text-tp-blue flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-tp-red" /> Rechazar solicitud
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-tp-blue/50" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica brevemente por qué rechazas la solicitud…"
              rows={3}
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-tp-gray-soft text-tp-blue/60 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={enviando}
              className="flex-1 py-3 rounded-2xl bg-tp-red text-white font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-40"
            >
              {enviando ? 'Rechazando…' : 'Rechazar solicitud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export function KilosDisponibles() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'tablero' | 'mis' | 'mis-reservas'>('tablero');
  const [marketplaceActivo, setMarketplaceActivo] = useState<boolean | null>(null);

  const [ofertas, setOfertas] = useState<OfertaViajero[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [misOfertas, setMisOfertas] = useState<OfertaViajero[]>([]);
  const [loadingMis, setLoadingMis] = useState(false);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<ReservaViajero[]>([]);
  const [reservasConfirmadas, setReservasConfirmadas] = useState<Map<string, ReservaViajero>>(new Map());

  const [misReservas, setMisReservas] = useState<ReservaViajero[]>([]);
  const [loadingMisReservas, setLoadingMisReservas] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [reservaOferta, setReservaOferta] = useState<OfertaViajero | null>(null);
  const [rechazarReservaId, setRechazarReservaId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  const cargarTablero = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOfertasActivas({
        provincia: filtroProvincia || undefined,
        fechaDesde: filtroDesde || undefined,
        fechaHasta: filtroHasta || undefined,
      });
      setOfertas(data);
    } catch (err) {
      console.error('Error cargando ofertas de viajeros:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroProvincia, filtroDesde, filtroHasta]);

  const cargarMisOfertas = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingMis(true);
    try {
      const [ofertasPropias, solicitudes] = await Promise.all([
        getMisOfertas(user.uid),
        getSolicitudesRecibidas(user.uid),
      ]);
      setMisOfertas(ofertasPropias);
      setSolicitudesRecibidas(solicitudes);
      setReservasConfirmadas(
        ofertasPropias.length > 0 ? await getReservasConfirmadasDeOfertas(ofertasPropias.map((o) => o.id)) : new Map(),
      );
    } catch (err) {
      console.error('Error cargando mis viajes:', err);
    } finally {
      setLoadingMis(false);
    }
  }, [user]);

  const cargarMisReservas = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingMisReservas(true);
    try {
      setMisReservas(await getMisReservas(user.uid));
    } catch (err) {
      console.error('Error cargando mis reservas:', err);
    } finally {
      setLoadingMisReservas(false);
    }
  }, [user]);

  useEffect(() => {
    isMarketplacePublicoActivo()
      .then(setMarketplaceActivo)
      .catch(() => setMarketplaceActivo(false));
  }, []);

  useEffect(() => { if (marketplaceActivo === true) cargarTablero(); }, [marketplaceActivo, cargarTablero]);
  useEffect(() => { if (marketplaceActivo === true && tab === 'mis') cargarMisOfertas(); }, [tab, cargarMisOfertas, marketplaceActivo]);
  useEffect(() => { if (marketplaceActivo === true && tab === 'mis-reservas') cargarMisReservas(); }, [tab, cargarMisReservas, marketplaceActivo]);
  useEffect(() => { if (marketplaceActivo === false) cargarMisOfertas(); }, [marketplaceActivo, cargarMisOfertas]);

  const handleReservar = (oferta: OfertaViajero) => {
    setReservaOferta(oferta);
  };

  const handleCambiarEstado = async (id: string, estado: EstadoOfertaViajero) => {
    try {
      await actualizarEstadoOferta(id, estado);
      await cargarMisOfertas();
      if (tab === 'tablero') cargarTablero();
    } catch (err) {
      console.error('Error cambiando estado de la oferta:', err);
    }
  };

  const handleCancelarReserva = async (id: string) => {
    try {
      await cancelarReserva(id);
      await cargarMisReservas();
    } catch (err) {
      console.error('Error cancelando la reserva:', err);
      mostrarToast('No se pudo cancelar la reserva.');
    }
  };

  const handleAceptarReserva = async (id: string) => {
    try {
      await aceptarReserva(id);
      await cargarMisOfertas();
    } catch (err) {
      console.error('Error aceptando la reserva:', err);
      mostrarToast('No se pudo aceptar la solicitud.');
    }
  };

  const handleRechazarReserva = async (motivo: string) => {
    if (!rechazarReservaId) return;
    try {
      await rechazarReserva(rechazarReservaId, motivo);
      await cargarMisOfertas();
    } catch (err) {
      console.error('Error rechazando la reserva:', err);
      mostrarToast('No se pudo rechazar la solicitud.');
    }
  };

  const limpiarFiltros = () => { setFiltroProvincia(''); setFiltroDesde(''); setFiltroHasta(''); };
  const hayFiltros = filtroProvincia || filtroDesde || filtroHasta;

  if (marketplaceActivo === null) {
    return <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando…</div>;
  }

  if (marketplaceActivo === false) {
    // Fase 1: ToPaquete (admin) es el único comprador. Sin tablero público ni botón de reservar.
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-tp-blue flex items-center gap-2">
              <Luggage className="w-6 h-6 text-tp-red" />
              Vender mis Kilos
            </h1>
            <p className="text-sm text-tp-blue/50 mt-0.5">
              Publica tu viaje y ToPaquete reservará los kilos que necesite para enviar paquetes Express.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-tp-red text-white rounded-2xl font-bold hover:bg-[#D91F33] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Publicar mi viaje
          </button>
        </div>

        <div>
          <h2 className="text-sm font-black text-tp-blue uppercase tracking-wider mb-3">Mis Viajes Publicados</h2>
          {loadingMis ? (
            <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando tus viajes…</div>
          ) : misOfertas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
              <Luggage className="w-12 h-12 text-tp-blue/15 mx-auto mb-3" />
              <p className="text-tp-blue/40 font-bold">Aún no has publicado ningún viaje.</p>
              <button onClick={() => setModalOpen(true)} className="mt-3 text-sm font-bold text-tp-red hover:underline">
                Publicar mi primer viaje
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[10px] font-black uppercase tracking-wider text-tp-blue/40">
                    <th className="px-5 py-3">Destino</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Kg totales</th>
                    <th className="px-5 py-3">Kg reservados por ToPaquete</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {misOfertas.map((o) => {
                    const badge = ESTADO_BADGE[o.estado];
                    const reserva = reservasConfirmadas.get(o.id);
                    return (
                      <tr key={o.id} className="border-t border-tp-gray-soft">
                        <td className="px-5 py-4 font-black text-tp-blue whitespace-nowrap">{o.provincia_destino}</td>
                        <td className="px-5 py-4 text-tp-blue/60 font-medium whitespace-nowrap">{formatFecha(o.fecha_salida)}</td>
                        <td className="px-5 py-4 text-tp-blue font-bold whitespace-nowrap">{o.kilos_disponibles.toFixed(1)} kg</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {reserva ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-black px-3 py-1.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ToPaquete reservó {reserva.kilos_solicitados.toFixed(1)} kg
                            </span>
                          ) : (
                            <span className="text-tp-blue/40 font-medium">{o.kilos_reservados.toFixed(1)} kg</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full', badge.clase)}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {!reserva && (o.estado === 'activa' || o.estado === 'pausada') && (
                            <div className="flex items-center justify-end gap-2">
                              {o.estado === 'activa' && (
                                <button onClick={() => handleCambiarEstado(o.id, 'pausada')} title="Pausar" className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                                  <Pause className="w-4 h-4" />
                                </button>
                              )}
                              {o.estado === 'pausada' && (
                                <button onClick={() => handleCambiarEstado(o.id, 'activa')} title="Reactivar" className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleCambiarEstado(o.id, 'cancelada')} title="Cancelar" className="p-2 text-tp-red hover:bg-tp-red/5 rounded-xl transition-colors">
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modalOpen && (
          <PublicarViajeModal
            onClose={() => setModalOpen(false)}
            onPublicado={() => cargarMisOfertas()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-tp-blue flex items-center gap-2">
            <Luggage className="w-6 h-6 text-tp-red" />
            Kilos Disponibles
          </h1>
          <p className="text-sm text-tp-blue/50 mt-0.5">
            Viajeros que llevan equipaje a Cuba. Reserva kilos para enviar tus paquetes Express.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-tp-red text-white rounded-2xl font-bold hover:bg-[#D91F33] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Publicar mi viaje
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-tp-gray-soft">
        {([
          ['tablero', 'Tablero de viajes'],
          ['mis', 'Mis viajes'],
          ['mis-reservas', 'Mis reservas'],
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

      {tab === 'tablero' ? (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-tp-gray-soft p-4 flex flex-wrap items-end gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-tp-blue/40 text-xs font-black uppercase tracking-wider">
              <Filter className="w-4 h-4" /> Filtrar
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Provincia</label>
              <select
                value={filtroProvincia}
                onChange={(e) => setFiltroProvincia(e.target.value)}
                className="px-3 py-2 border border-tp-gray-soft rounded-xl text-sm text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              >
                <option value="">Todas</option>
                {PROVINCIAS_CUBA.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Desde</label>
              <input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className="px-3 py-2 border border-tp-gray-soft rounded-xl text-sm text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Hasta</label>
              <input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className="px-3 py-2 border border-tp-gray-soft rounded-xl text-sm text-tp-blue font-medium focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
            </div>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="px-3 py-2 text-sm font-bold text-tp-blue/50 hover:text-tp-red transition-colors">
                Limpiar
              </button>
            )}
          </div>

          {/* Grid de ofertas */}
          {loading ? (
            <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando viajes disponibles…</div>
          ) : ofertas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
              <Plane className="w-12 h-12 text-tp-blue/15 mx-auto mb-3" />
              <p className="text-tp-blue/40 font-bold">No hay viajes disponibles en este momento.</p>
              {hayFiltros && (
                <button onClick={limpiarFiltros} className="mt-3 text-sm font-bold text-tp-red hover:underline">
                  Quitar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {ofertas.map((o) => <OfertaCard key={o.id} oferta={o} onReservar={handleReservar} />)}
            </div>
          )}
        </>
      ) : tab === 'mis' ? (
        /* Mis viajes */
        loadingMis ? (
          <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando tus viajes…</div>
        ) : misOfertas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
            <Luggage className="w-12 h-12 text-tp-blue/15 mx-auto mb-3" />
            <p className="text-tp-blue/40 font-bold">Aún no has publicado ningún viaje.</p>
            <button onClick={() => setModalOpen(true)} className="mt-3 text-sm font-bold text-tp-red hover:underline">
              Publicar mi primer viaje
            </button>
          </div>
        ) : (
          <div className="space-y-6">
          <div className="space-y-3">
            {misOfertas.map((o) => {
              const badge = ESTADO_BADGE[o.estado];
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-tp-gray-soft p-5 shadow-sm flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-tp-blue text-lg">{o.provincia_destino}</h3>
                      <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full', badge.clase)}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-sm text-tp-blue/50 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatFecha(o.fecha_salida)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Reservados / Total</div>
                    <div className="font-black text-tp-blue">{o.kilos_reservados.toFixed(1)} / {o.kilos_disponibles.toFixed(1)} kg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Precio</div>
                    <div className="font-black text-tp-red">€{o.precio_kg.toFixed(2)}/kg</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {o.estado === 'activa' && (
                      <button
                        onClick={() => handleCambiarEstado(o.id, 'pausada')}
                        title="Pausar"
                        className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {o.estado === 'pausada' && (
                      <button
                        onClick={() => handleCambiarEstado(o.id, 'activa')}
                        title="Reactivar"
                        className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {(o.estado === 'activa' || o.estado === 'pausada') && (
                      <button
                        onClick={() => handleCambiarEstado(o.id, 'cancelada')}
                        title="Cancelar"
                        className="p-2.5 text-tp-red hover:bg-tp-red/5 rounded-xl transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Solicitudes recibidas sobre mis viajes */}
          <div>
            <h2 className="text-sm font-black text-tp-blue uppercase tracking-wider mb-3">Solicitudes recibidas</h2>
            {solicitudesRecibidas.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
                <p className="text-tp-blue/40 font-bold text-sm">Aún no has recibido solicitudes de reserva.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitudesRecibidas.map((r) => {
                  const badge = ESTADO_RESERVA_BADGE[r.estado];
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-tp-gray-soft p-5 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-tp-blue">{r.cliente_nombre || 'Cliente'}</h3>
                            <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full', badge.clase)}>
                              {badge.label}
                            </span>
                          </div>
                          {r.oferta && (
                            <div className="text-xs text-tp-blue/50 font-medium mt-0.5">
                              {r.oferta.provincia_destino} · {formatFecha(r.oferta.fecha_salida)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-wider text-tp-blue/40">Kg solicitados</div>
                          <div className="font-black text-tp-blue">{r.kilos_solicitados.toFixed(1)} kg</div>
                        </div>
                      </div>

                      {r.mensaje_cliente && (
                        <p className="text-sm text-tp-blue/60 bg-gray-50 rounded-xl p-3 leading-relaxed">{r.mensaje_cliente}</p>
                      )}

                      {r.estado === 'pendiente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAceptarReserva(r.id)}
                            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Aceptar
                          </button>
                          <button
                            onClick={() => setRechazarReservaId(r.id)}
                            className="flex-1 py-2.5 rounded-xl bg-tp-red text-white font-bold text-sm hover:bg-[#D91F33] transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ThumbsDown className="w-4 h-4" /> Rechazar
                          </button>
                        </div>
                      )}

                      {r.estado === 'aceptada' && r.contacto && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-wrap items-center gap-4">
                          <div className="text-xs font-black text-green-700 uppercase tracking-wider w-full">Contacto del cliente</div>
                          {r.contacto.telefono && (
                            <div className="flex items-center gap-1.5 text-sm font-bold text-tp-blue">
                              <Phone className="w-4 h-4 text-green-600" /> {r.contacto.telefono}
                            </div>
                          )}
                          {r.contacto.email && (
                            <div className="flex items-center gap-1.5 text-sm font-bold text-tp-blue">
                              <Mail className="w-4 h-4 text-green-600" /> {r.contacto.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        )
      ) : (
        /* Mis reservas (vista cliente) */
        loadingMisReservas ? (
          <div className="text-center py-16 text-tp-blue/30 italic font-bold">Cargando tus reservas…</div>
        ) : misReservas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-tp-gray-soft">
            <Package className="w-12 h-12 text-tp-blue/15 mx-auto mb-3" />
            <p className="text-tp-blue/40 font-bold">Aún no has reservado kilos en ningún viaje.</p>
            <button onClick={() => setTab('tablero')} className="mt-3 text-sm font-bold text-tp-red hover:underline">
              Ver tablero de viajes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {misReservas.map((r) => {
              const badge = ESTADO_RESERVA_BADGE[r.estado];
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-tp-gray-soft p-5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-tp-blue text-lg">{r.oferta?.provincia_destino || '—'}</h3>
                        <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full', badge.clase)}>
                          {badge.label}
                        </span>
                      </div>
                      {r.oferta && (
                        <div className="text-sm text-tp-blue/50 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formatFecha(r.oferta.fecha_salida)}
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
                    {r.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCancelarReserva(r.id)}
                        className="px-4 py-2.5 rounded-xl border border-tp-gray-soft text-tp-blue/60 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    )}
                  </div>

                  {r.estado === 'rechazada' && r.motivo_rechazo && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-tp-red font-medium">
                      <strong>Motivo:</strong> {r.motivo_rechazo}
                    </div>
                  )}

                  {r.estado === 'aceptada' && r.contacto && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-3">
                      <div className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> ¡Reserva aceptada! Datos de contacto de {r.contacto.nombre}
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {r.contacto.telefono && (
                          <div className="flex items-center gap-2 text-2xl font-black text-tp-blue">
                            <Phone className="w-5 h-5 text-green-600" /> {r.contacto.telefono}
                          </div>
                        )}
                        {r.contacto.email && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-tp-blue/70">
                            <Mail className="w-4 h-4" /> {r.contacto.email}
                          </div>
                        )}
                      </div>
                      {r.contacto.telefono && (
                        <a
                          href={whatsappLink(r.contacto.telefono)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                        </a>
                      )}
                    </div>
                  )}

                  {r.estado === 'pendiente' && (
                    <div className="flex items-center gap-1.5 text-xs text-tp-blue/40 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Esperando respuesta del viajero.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {modalOpen && (
        <PublicarViajeModal
          onClose={() => setModalOpen(false)}
          onPublicado={() => { cargarTablero(); cargarMisOfertas(); setTab('mis'); }}
        />
      )}

      {reservaOferta && user?.uid && (
        <ReservarKilosModal
          oferta={reservaOferta}
          clienteId={user.uid}
          onClose={() => setReservaOferta(null)}
          onReservado={() => { cargarTablero(); cargarMisReservas(); setTab('mis-reservas'); mostrarToast('Tu solicitud de reserva fue enviada al viajero.'); }}
        />
      )}

      {rechazarReservaId && (
        <RechazarReservaModal
          onClose={() => setRechazarReservaId(null)}
          onConfirmar={handleRechazarReserva}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-tp-blue text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}
