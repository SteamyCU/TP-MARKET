import React, { useState, useEffect } from 'react';
import { Tag, Plus, ToggleLeft, ToggleRight, AlertCircle, X } from 'lucide-react';
import {
  getCupones,
  crearCuponGeneral,
  toggleActivoCupon,
  type Cupon,
  type NuevoCuponGeneral,
} from '../services/cupones';
import { cn } from '../lib/utils';

type Tab = 'todos' | 'general' | 'influencer';
type Estado = 'activo' | 'inactivo' | 'vencido' | 'agotado';

function getEstado(c: Cupon): Estado {
  if (!c.activo) return 'inactivo';
  const ahora = new Date();
  if (c.fecha_fin && new Date(c.fecha_fin) < ahora) return 'vencido';
  if (c.usos_maximos != null && c.usos_actuales >= c.usos_maximos) return 'agotado';
  return 'activo';
}

function EstadoBadge({ estado }: { estado: Estado }) {
  const styles: Record<Estado, string> = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-500',
    vencido: 'bg-amber-100 text-amber-700',
    agotado: 'bg-red-100 text-tp-red',
  };
  const labels: Record<Estado, string> = {
    activo: 'Activo', inactivo: 'Inactivo', vencido: 'Vencido', agotado: 'Agotado',
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', styles[estado])}>
      {labels[estado]}
    </span>
  );
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ModalCrearCupon({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [form, setForm] = useState<NuevoCuponGeneral>({
    codigo: '',
    descuento_tipo: 'porcentaje',
    descuento_valor: 10,
    descripcion: '',
    fecha_inicio: null,
    fecha_fin: null,
    usos_maximos: null,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await crearCuponGeneral(form);
      onCreado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cupón');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-tp-gray-soft">
          <h2 className="text-lg font-bold text-tp-blue flex items-center gap-2">
            <Plus className="w-5 h-5 text-tp-red" />
            Nuevo cupón general
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-tp-blue/50" />
          </button>
        </div>
        <form onSubmit={guardar} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-tp-red font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Código</label>
            <input
              type="text"
              required
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
              placeholder="VERANO25"
              maxLength={20}
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl font-mono font-black text-tp-blue tracking-widest focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Tipo de descuento</label>
              <select
                value={form.descuento_tipo}
                onChange={(e) => setForm({ ...form, descuento_tipo: e.target.value as 'porcentaje' | 'fijo' })}
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-bold focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Fijo (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">
                Valor {form.descuento_tipo === 'porcentaje' ? '(%)' : '(€)'}
              </label>
              <input
                type="number"
                required
                min={0}
                step={form.descuento_tipo === 'porcentaje' ? 1 : 0.01}
                max={form.descuento_tipo === 'porcentaje' ? 100 : undefined}
                value={form.descuento_valor}
                onChange={(e) => setForm({ ...form, descuento_valor: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue font-bold focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
            <input
              type="text"
              value={form.descripcion || ''}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Campaña verano 2025"
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Válido desde</label>
              <input
                type="date"
                value={form.fecha_inicio ? form.fecha_inicio.split('T')[0] : ''}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Válido hasta</label>
              <input
                type="date"
                value={form.fecha_fin ? form.fecha_fin.split('T')[0] : ''}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null })}
                className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5">Usos máximos (vacío = ilimitado)</label>
            <input
              type="number"
              min={1}
              value={form.usos_maximos ?? ''}
              onChange={(e) => setForm({ ...form, usos_maximos: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="Sin límite"
              className="w-full px-4 py-3 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-tp-gray-soft text-tp-blue/60 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-3 rounded-xl bg-tp-blue text-white font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50"
            >
              {guardando ? 'Creando…' : 'Crear cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Cupones() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('todos');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      setCupones(await getCupones());
    } catch (err) {
      console.error('Error cargando cupones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = cupones.filter((c) => {
    if (tab === 'general') return c.tipo === 'general';
    if (tab === 'influencer') return c.tipo === 'influencer';
    return true;
  });

  const handleToggle = async (cupon: Cupon) => {
    setTogglingId(cupon.id);
    try {
      await toggleActivoCupon(cupon.id, !cupon.activo);
      setCupones((prev) => prev.map((c) => c.id === cupon.id ? { ...c, activo: !c.activo } : c));
    } catch (err) {
      console.error('Error cambiando estado del cupón:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'general', label: 'Generales' },
    { key: 'influencer', label: 'De Influencers' },
  ];

  const stats = [
    { label: 'Total', value: cupones.length, color: 'text-tp-blue' },
    { label: 'Activos', value: cupones.filter((c) => getEstado(c) === 'activo').length, color: 'text-green-600' },
    { label: 'Generales', value: cupones.filter((c) => c.tipo === 'general').length, color: 'text-purple-600' },
    { label: 'Influencers', value: cupones.filter((c) => c.tipo === 'influencer').length, color: 'text-tp-red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-tp-blue flex items-center gap-2">
            <Tag className="w-6 h-6 text-tp-red" />
            Cupones y Códigos
          </h1>
          <p className="text-sm text-tp-blue/40 mt-0.5">Gestiona descuentos y códigos de referido de influencers</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-tp-blue text-white rounded-2xl font-bold hover:bg-[#004a78] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo cupón
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-tp-gray-soft p-5 shadow-sm">
            <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
            <div className="text-xs font-bold text-tp-blue/40 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="p-6 border-b border-tp-gray-soft flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-colors',
                  tab === t.key ? 'bg-tp-blue text-white' : 'text-tp-blue/60 hover:bg-tp-blue-light/50',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-tp-blue/40 font-bold">
            {filtrados.length} {filtrados.length === 1 ? 'cupón' : 'cupones'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Dueño / Descripción</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4">Usos</th>
                <th className="px-6 py-4">Vigencia</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {filtrados.map((c) => {
                const estado = getEstado(c);
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-tp-blue tracking-widest">{c.codigo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                        c.tipo === 'general' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
                      )}>
                        {c.tipo === 'general' ? 'General' : 'Influencer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.tipo === 'influencer' ? (
                        <div>
                          <div className="font-bold text-tp-blue">{c.influencer_nombre || '—'}</div>
                          <div className="text-xs text-tp-blue/40">{c.influencer_email || ''}</div>
                        </div>
                      ) : (
                        <span className="text-tp-blue/60 italic">{c.descripcion || '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-tp-blue">
                      {c.descuento_valor}{c.descuento_tipo === 'porcentaje' ? '%' : '€'}
                    </td>
                    <td className="px-6 py-4 text-tp-blue/60">
                      {c.usos_actuales}{c.usos_maximos != null ? ` / ${c.usos_maximos}` : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-tp-blue/60">
                      {c.fecha_fin
                        ? <>Hasta {formatFecha(c.fecha_fin)}</>
                        : <span className="text-tp-blue/30">Sin vencimiento</span>}
                    </td>
                    <td className="px-6 py-4">
                      <EstadoBadge estado={estado} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={togglingId === c.id || estado === 'vencido' || estado === 'agotado'}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                        className={cn(
                          'p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                          c.activo ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50',
                        )}
                      >
                        {c.activo
                          ? <ToggleRight className="w-6 h-6" />
                          : <ToggleLeft className="w-6 h-6" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    No hay cupones en esta categoría.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Cargando cupones…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <ModalCrearCupon onClose={() => setMostrarModal(false)} onCreado={cargar} />
      )}
    </div>
  );
}
