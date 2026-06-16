import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Plus, RefreshCw, Search, X, Package, User, Clock,
  CheckCircle2, MessageSquare, Send, Trash2, ChevronRight, Flag,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import {
  TIPOS_INCIDENCIA, PRIORIDADES_INCIDENCIA, ESTADOS_INCIDENCIA,
} from '../constants/estados';
import {
  subscribeIncidencias, crearIncidencia, cambiarEstadoIncidencia,
  asignarIncidencia, agregarComentarioIncidencia, actualizarPrioridadIncidencia,
  eliminarIncidencia, Incidencia, EstadoIncidencia, PrioridadIncidencia,
} from '../services/incidencias';
import { getPaqueteByTracking } from '../services/paquetes';
import { listProfiles, FlatProfile } from '../services/profiles';

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_INCIDENCIA.map(t => [t.value, t.label]));
const PRIORIDAD_META: Record<string, { label: string; color: string }> = Object.fromEntries(PRIORIDADES_INCIDENCIA.map(p => [p.value, p]));
const ESTADO_META: Record<string, { label: string; color: string }> = Object.fromEntries(ESTADOS_INCIDENCIA.map(e => [e.value, e]));

const PRIORIDAD_ORDEN: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 };

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export function Incidencias() {
  const { user } = useAuth();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<FlatProfile[]>([]);

  const [filtroEstado, setFiltroEstado] = useState<'todas' | EstadoIncidencia>('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<'todas' | PrioridadIncidencia>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const [modalNueva, setModalNueva] = useState(false);
  const [detalle, setDetalle] = useState<Incidencia | null>(null);

  useEffect(() => {
    const unsub = subscribeIncidencias((data) => {
      setIncidencias(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    listProfiles({ roles: ['admin', 'agente', 'logistica'] }).then(setStaff);
  }, []);

  // Mantiene el panel de detalle sincronizado con los datos en vivo.
  useEffect(() => {
    if (!detalle) return;
    const actualizado = incidencias.find(i => i.id === detalle.id);
    if (actualizado && actualizado !== detalle) setDetalle(actualizado);
  }, [incidencias, detalle]);

  const staffNombre = useCallback((id: string | null): string => {
    if (!id) return '';
    const p = staff.find(s => s.id === id);
    return (p?.name as string) || p?.email || 'Responsable';
  }, [staff]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return incidencias
      .filter(i =>
        (filtroEstado === 'todas' || i.estado === filtroEstado) &&
        (filtroPrioridad === 'todas' || i.prioridad === filtroPrioridad) &&
        (filtroTipo === 'todos' || i.tipo === filtroTipo) &&
        (!q || [i.codigo, i.titulo, i.paqueteTracking, i.clienteNombre, i.descripcion]
          .some(v => v?.toLowerCase().includes(q)))
      )
      .sort((a, b) => {
        // Abiertas primero, luego por prioridad, luego por fecha.
        const aAbierta = a.estado === 'abierta' || a.estado === 'en_proceso';
        const bAbierta = b.estado === 'abierta' || b.estado === 'en_proceso';
        if (aAbierta !== bAbierta) return aAbierta ? -1 : 1;
        const dp = (PRIORIDAD_ORDEN[a.prioridad] ?? 9) - (PRIORIDAD_ORDEN[b.prioridad] ?? 9);
        if (dp !== 0) return dp;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [incidencias, filtroEstado, filtroPrioridad, filtroTipo, busqueda]);

  const stats = useMemo(() => ({
    abiertas: incidencias.filter(i => i.estado === 'abierta').length,
    enProceso: incidencias.filter(i => i.estado === 'en_proceso').length,
    resueltas: incidencias.filter(i => i.estado === 'resuelta' || i.estado === 'cerrada').length,
    criticas: incidencias.filter(i => i.prioridad === 'critica' && (i.estado === 'abierta' || i.estado === 'en_proceso')).length,
  }), [incidencias]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-black text-tp-blue flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-tp-red" /> Incidencias
          </h1>
          {stats.abiertas + stats.enProceso > 0 && (
            <span className="bg-tp-red text-white text-xs font-black px-2.5 py-1 rounded-full">
              {stats.abiertas + stats.enProceso} abiertas
            </span>
          )}
        </div>
        <button
          onClick={() => setModalNueva(true)}
          className="flex items-center gap-2 bg-tp-red hover:bg-[#D91F33] text-white px-4 py-2 rounded-full text-sm font-black transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Nueva incidencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Abiertas', value: stats.abiertas, color: 'text-tp-red', icon: AlertTriangle },
          { label: 'En proceso', value: stats.enProceso, color: 'text-amber-600', icon: Clock },
          { label: 'Resueltas', value: stats.resueltas, color: 'text-green-600', icon: CheckCircle2 },
          { label: 'Críticas activas', value: stats.criticas, color: 'text-tp-red', icon: Flag },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: 'todas', label: 'Todas' }, ...ESTADOS_INCIDENCIA.map(e => ({ id: e.value, label: e.label }))].map(f => (
          <button
            key={f.id}
            onClick={() => setFiltroEstado(f.id as 'todas' | EstadoIncidencia)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-bold transition-all border",
              filtroEstado === f.id ? "bg-tp-blue text-white border-tp-blue" : "bg-white text-tp-blue/60 border-tp-gray-soft hover:border-tp-blue/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filtroPrioridad}
          onChange={e => setFiltroPrioridad(e.target.value as 'todas' | PrioridadIncidencia)}
          className="text-sm border border-tp-gray-soft rounded-full px-3 py-1.5 font-bold text-tp-blue/70 focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
        >
          <option value="todas">Toda prioridad</option>
          {PRIORIDADES_INCIDENCIA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="text-sm border border-tp-gray-soft rounded-full px-3 py-1.5 font-bold text-tp-blue/70 focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
        >
          <option value="todos">Todo tipo</option>
          {TIPOS_INCIDENCIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar código, paquete, cliente..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-tp-gray-soft rounded-full focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-tp-gray-soft text-center">
          <RefreshCw className="w-10 h-10 text-tp-blue/20 mx-auto mb-4 animate-spin" />
          <p className="text-tp-blue/40 italic font-bold">Cargando incidencias...</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border-2 border-tp-gray-soft border-dashed text-center">
          <AlertTriangle className="w-16 h-16 text-tp-blue/10 mx-auto mb-6" />
          <p className="text-tp-blue/40 italic font-bold text-lg">No hay incidencias con este filtro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {visibles.map(inc => {
            const prio = PRIORIDAD_META[inc.prioridad] || { label: inc.prioridad, color: 'bg-slate-100 text-slate-600' };
            const est = ESTADO_META[inc.estado] || { label: inc.estado, color: 'bg-slate-100 text-slate-600' };
            return (
              <button
                key={inc.id}
                onClick={() => setDetalle(inc)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <div className={cn(
                  "w-1.5 h-10 rounded-full shrink-0",
                  inc.prioridad === 'critica' ? 'bg-tp-red' : inc.prioridad === 'alta' ? 'bg-amber-500' : inc.prioridad === 'media' ? 'bg-blue-400' : 'bg-slate-300'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-400">{inc.codigo}</span>
                    <span className="font-bold text-tp-blue truncate">{inc.titulo}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 font-medium flex-wrap">
                    <span>{TIPO_LABEL[inc.tipo] || inc.tipo}</span>
                    {inc.paqueteTracking && <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {inc.paqueteTracking}</span>}
                    {inc.clienteNombre && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {inc.clienteNombre}</span>}
                    {inc.asignadoA && <span className="text-tp-blue/50">→ {staffNombre(inc.asignadoA)}</span>}
                    <span>{formatFechaCorta(inc.createdAt)}</span>
                  </div>
                </div>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", prio.color)}>{prio.label}</span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", est.color)}>{est.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {modalNueva && (
        <NuevaIncidenciaModal
          staff={staff}
          staffNombre={staffNombre}
          onClose={() => setModalNueva(false)}
          onCreada={() => setModalNueva(false)}
        />
      )}

      {detalle && (
        <DetalleIncidencia
          incidencia={detalle}
          staff={staff}
          staffNombre={staffNombre}
          userEmail={user?.email || ''}
          onClose={() => setDetalle(null)}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Modal: Nueva incidencia
// ===========================================================================
function NuevaIncidenciaModal({ staff, staffNombre, onClose, onCreada }: {
  staff: FlatProfile[];
  staffNombre: (id: string | null) => string;
  onClose: () => void;
  onCreada: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS_INCIDENCIA[0].value);
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>('media');
  const [descripcion, setDescripcion] = useState('');
  const [tracking, setTracking] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [paqueteId, setPaqueteId] = useState<string | null>(null);
  const [asignadoA, setAsignadoA] = useState('');
  const [marcarPaquete, setMarcarPaquete] = useState(false);
  const [buscandoPaquete, setBuscandoPaquete] = useState(false);
  const [paqueteMsg, setPaqueteMsg] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const buscarPaquete = async () => {
    const t = tracking.trim();
    if (!t) return;
    setBuscandoPaquete(true);
    setPaqueteMsg(null);
    try {
      const p = await getPaqueteByTracking(t);
      if (p) {
        setPaqueteId(p.id);
        if (p.clienteNombre) setClienteNombre(p.clienteNombre);
        setPaqueteMsg(`✓ ${p.clienteNombre || 'Paquete'} · ${p.estado}`);
      } else {
        setPaqueteId(null);
        setPaqueteMsg('No se encontró un paquete con ese tracking.');
      }
    } finally {
      setBuscandoPaquete(false);
    }
  };

  const guardar = async () => {
    if (!titulo.trim()) return;
    setGuardando(true);
    try {
      await crearIncidencia({
        titulo: titulo.trim(),
        tipo,
        prioridad,
        descripcion: descripcion.trim() || undefined,
        paqueteId,
        paqueteTracking: tracking.trim() || null,
        clienteNombre: clienteNombre.trim() || null,
        asignadoA: asignadoA || null,
        marcarPaquete: marcarPaquete && Boolean(paqueteId),
      });
      onCreada();
    } catch (err) {
      console.error('Error creando incidencia:', err);
      alert('No se pudo crear la incidencia. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-tp-blue text-lg">Nueva incidencia</h3>
          <button onClick={onClose} className="p-1 text-tp-blue/40 hover:text-tp-blue"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Título *</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Resumen breve del problema"
            className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20">
              {TIPOS_INCIDENCIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Prioridad</label>
            <select value={prioridad} onChange={e => setPrioridad(e.target.value as PrioridadIncidencia)} className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20">
              {PRIORIDADES_INCIDENCIA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Paquete relacionado (opcional)</label>
          <div className="flex gap-2">
            <input
              value={tracking}
              onChange={e => { setTracking(e.target.value); setPaqueteId(null); setPaqueteMsg(null); }}
              onKeyDown={e => e.key === 'Enter' && buscarPaquete()}
              placeholder="Tracking del paquete"
              className="flex-1 border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
            />
            <button
              onClick={buscarPaquete}
              disabled={buscandoPaquete || !tracking.trim()}
              className="px-3 py-2 rounded-xl text-sm font-bold bg-tp-blue-light text-tp-blue hover:bg-tp-blue hover:text-white transition-colors disabled:opacity-50"
            >
              {buscandoPaquete ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>
          {paqueteMsg && <p className={cn("text-xs mt-1.5 font-medium", paqueteId ? "text-green-600" : "text-tp-red")}>{paqueteMsg}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Cliente (opcional)</label>
          <input
            value={clienteNombre}
            onChange={e => setClienteNombre(e.target.value)}
            placeholder="Nombre del cliente afectado"
            className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Asignar a (opcional)</label>
          <select value={asignadoA} onChange={e => setAsignadoA(e.target.value)} className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20">
            <option value="">Sin asignar</option>
            {staff.map(s => <option key={s.id} value={s.id}>{staffNombre(s.id)} ({s.role})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Descripción</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Detalles del problema..."
            className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
          />
        </div>

        {paqueteId && (
          <label className="flex items-center gap-2 text-sm text-tp-blue/70 font-medium cursor-pointer">
            <input type="checkbox" checked={marcarPaquete} onChange={e => setMarcarPaquete(e.target.checked)} className="rounded" />
            Marcar también el paquete como "Incidencia"
          </label>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-full text-sm font-black text-tp-blue/60 hover:bg-gray-100 transition-colors">Cancelar</button>
          <button
            onClick={guardar}
            disabled={guardando || !titulo.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black bg-tp-red text-white hover:bg-[#D91F33] disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Crear incidencia
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Panel: Detalle de incidencia
// ===========================================================================
function DetalleIncidencia({ incidencia, staff, staffNombre, onClose }: {
  incidencia: Incidencia;
  staff: FlatProfile[];
  staffNombre: (id: string | null) => string;
  userEmail: string;
  onClose: () => void;
}) {
  const [comentario, setComentario] = useState('');
  const [resolucion, setResolucion] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mostrarResolver, setMostrarResolver] = useState(false);

  const prio = PRIORIDAD_META[incidencia.prioridad] || { label: incidencia.prioridad, color: 'bg-slate-100 text-slate-600' };
  const est = ESTADO_META[incidencia.estado] || { label: incidencia.estado, color: 'bg-slate-100 text-slate-600' };
  const resuelta = incidencia.estado === 'resuelta' || incidencia.estado === 'cerrada';

  const cambiarEstado = async (nuevoEstado: EstadoIncidencia, res?: string) => {
    setProcesando(true);
    try {
      await cambiarEstadoIncidencia(incidencia, nuevoEstado, res);
      setMostrarResolver(false);
      setResolucion('');
    } catch (err) {
      console.error('Error cambiando estado:', err);
      alert('No se pudo cambiar el estado.');
    } finally {
      setProcesando(false);
    }
  };

  const cambiarPrioridad = async (p: PrioridadIncidencia) => {
    try {
      await actualizarPrioridadIncidencia(incidencia.id, p);
    } catch (err) {
      console.error('Error cambiando prioridad:', err);
    }
  };

  const asignar = async (id: string) => {
    try {
      await asignarIncidencia(incidencia, id || null, staffNombre(id || null));
    } catch (err) {
      console.error('Error asignando:', err);
    }
  };

  const enviarComentario = async () => {
    if (!comentario.trim()) return;
    setProcesando(true);
    try {
      await agregarComentarioIncidencia(incidencia, comentario.trim());
      setComentario('');
    } catch (err) {
      console.error('Error comentando:', err);
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar la incidencia ${incidencia.codigo}? Esta acción no se puede deshacer.`)) return;
    setProcesando(true);
    try {
      await eliminarIncidencia(incidencia.id);
      onClose();
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('No se pudo eliminar (solo el admin puede).');
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-400">{incidencia.codigo}</span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", est.color)}>{est.label}</span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", prio.color)}>{prio.label}</span>
            </div>
            <h2 className="font-black text-tp-blue text-lg mt-1">{incidencia.titulo}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{TIPO_LABEL[incidencia.tipo] || incidencia.tipo} · {formatFecha(incidencia.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1 text-tp-blue/40 hover:text-tp-blue shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Datos */}
          <div className="grid grid-cols-2 gap-3">
            {incidencia.paqueteTracking && (
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Paquete</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {incidencia.paqueteTracking}</p>
              </div>
            )}
            {incidencia.clienteNombre && (
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Cliente</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {incidencia.clienteNombre}</p>
              </div>
            )}
          </div>

          {incidencia.descripcion && (
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Descripción</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{incidencia.descripcion}</p>
            </div>
          )}

          {incidencia.resolucion && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-700 uppercase font-bold tracking-wider mb-1">Resolución</p>
              <p className="text-sm text-green-800 whitespace-pre-wrap">{incidencia.resolucion}</p>
            </div>
          )}

          {/* Controles: prioridad y asignación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1.5">Prioridad</p>
              <select
                value={incidencia.prioridad}
                onChange={e => cambiarPrioridad(e.target.value as PrioridadIncidencia)}
                className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              >
                {PRIORIDADES_INCIDENCIA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1.5">Responsable</p>
              <select
                value={incidencia.asignadoA || ''}
                onChange={e => asignar(e.target.value)}
                className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              >
                <option value="">Sin asignar</option>
                {staff.map(s => <option key={s.id} value={s.id}>{staffNombre(s.id)}</option>)}
              </select>
            </div>
          </div>

          {/* Acciones de estado */}
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {incidencia.estado !== 'abierta' && (
                <button onClick={() => cambiarEstado('abierta')} disabled={procesando} className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-tp-red hover:bg-red-100 transition-colors disabled:opacity-50">Reabrir</button>
              )}
              {incidencia.estado !== 'en_proceso' && !resuelta && (
                <button onClick={() => cambiarEstado('en_proceso')} disabled={procesando} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50">En proceso</button>
              )}
              {!resuelta && (
                <button onClick={() => setMostrarResolver(v => !v)} disabled={procesando} className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Resolver</button>
              )}
              {incidencia.estado !== 'cerrada' && (
                <button onClick={() => cambiarEstado('cerrada')} disabled={procesando} className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors disabled:opacity-50">Cerrar</button>
              )}
            </div>
            {mostrarResolver && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={resolucion}
                  onChange={e => setResolucion(e.target.value)}
                  rows={2}
                  placeholder="Describe cómo se resolvió (opcional)"
                  className="w-full border border-tp-gray-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
                />
                <button
                  onClick={() => cambiarEstado('resuelta', resolucion.trim() || undefined)}
                  disabled={procesando}
                  className="px-4 py-2 rounded-full text-sm font-black bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  Marcar como resuelta
                </button>
              </div>
            )}
          </div>

          {/* Historial */}
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Historial</p>
            <div className="space-y-3">
              {[...incidencia.historial].reverse().map((c, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    c.tipo === 'estado' ? 'bg-amber-400' : c.tipo === 'creacion' ? 'bg-tp-red' : c.tipo === 'asignacion' ? 'bg-tp-blue' : 'bg-slate-300'
                  )} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{c.texto}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.autor} · {formatFecha(c.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nuevo comentario */}
            <div className="flex gap-2 mt-3">
              <input
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarComentario()}
                placeholder="Añadir comentario..."
                className="flex-1 border border-tp-gray-soft rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
              />
              <button
                onClick={enviarComentario}
                disabled={procesando || !comentario.trim()}
                className="p-2.5 rounded-full bg-tp-blue text-white hover:bg-tp-blue/90 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button onClick={eliminar} disabled={procesando} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-tp-red transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar incidencia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Incidencias;
