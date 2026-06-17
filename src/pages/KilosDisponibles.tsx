import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Luggage, MapPin, Calendar, Package, Zap, Plus, X, Pause, Play, Ban,
  AlertCircle, ShieldAlert, ChevronDown, Filter,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { PROVINCIAS_CUBA } from '../services/tarifas';
import {
  getOfertasActivas, getMisOfertas, crearOferta, actualizarEstadoOferta,
  getKilosRestantes, type OfertaViajero, type EstadoOfertaViajero,
} from '../services/viajeros';
import { cn } from '../lib/utils';

const TERMINOS_VIAJERO = `Acepto que: (1) llevaré el equipaje correspondiente bajo mi entera responsabilidad como pasajero; (2) revisaré el contenido de cualquier paquete antes de aceptarlo, pudiendo rechazarlo si no coincide con lo declarado o contiene algo ilegal; (3) ToPaquete actúa únicamente como plataforma de conexión entre viajeros y clientes, y no participa en el transporte físico ni asume responsabilidad por pérdida, daño, retraso o problemas aduanales relacionados con este envío; (4) acepto los Términos y Condiciones del Programa de Viajeros.`;

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
  const [verTerminos, setVerTerminos] = useState(false);
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
              <button
                type="button"
                onClick={() => setVerTerminos((v) => !v)}
                className="flex items-center justify-between w-full text-left text-xs font-black text-tp-blue uppercase tracking-wider"
              >
                Términos del Programa de Viajeros
                <ChevronDown className={cn('w-4 h-4 transition-transform', verTerminos && 'rotate-180')} />
              </button>
              {verTerminos && (
                <p className="text-xs text-tp-blue/70 leading-relaxed mt-3">{TERMINOS_VIAJERO}</p>
              )}
              <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acepta}
                  onChange={(e) => setAcepta(e.target.checked)}
                  className="w-4 h-4 accent-tp-red mt-0.5 shrink-0"
                />
                <span className="text-xs text-tp-blue/70 font-medium leading-relaxed">
                  He leído y acepto que llevo el equipaje bajo mi responsabilidad, revisaré cada paquete antes
                  de aceptarlo, y que ToPaquete solo conecta viajeros y clientes sin asumir responsabilidad por
                  el transporte. <span className="font-bold">Acepto los términos del Programa de Viajeros.</span>
                </span>
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
// Página principal
// ---------------------------------------------------------------------------
export function KilosDisponibles() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'tablero' | 'mis'>('tablero');

  const [ofertas, setOfertas] = useState<OfertaViajero[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [misOfertas, setMisOfertas] = useState<OfertaViajero[]>([]);
  const [loadingMis, setLoadingMis] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
      setMisOfertas(await getMisOfertas(user.uid));
    } catch (err) {
      console.error('Error cargando mis viajes:', err);
    } finally {
      setLoadingMis(false);
    }
  }, [user]);

  useEffect(() => { cargarTablero(); }, [cargarTablero]);
  useEffect(() => { if (tab === 'mis') cargarMisOfertas(); }, [tab, cargarMisOfertas]);

  const handleReservar = (_oferta: OfertaViajero) => {
    setToast('El sistema de reservas estará disponible muy pronto. Te avisaremos cuando puedas reservar kilos directamente.');
    setTimeout(() => setToast(null), 5000);
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

  const limpiarFiltros = () => { setFiltroProvincia(''); setFiltroDesde(''); setFiltroHasta(''); };
  const hayFiltros = filtroProvincia || filtroDesde || filtroHasta;

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
        {([['tablero', 'Tablero de viajes'], ['mis', 'Mis viajes']] as const).map(([key, label]) => (
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
      ) : (
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
        )
      )}

      {modalOpen && (
        <PublicarViajeModal
          onClose={() => setModalOpen(false)}
          onPublicado={() => { cargarTablero(); cargarMisOfertas(); setTab('mis'); }}
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
