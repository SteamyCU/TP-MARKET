import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Users, TrendingUp, MapPin, CheckCircle2, UserPlus, UserMinus,
  Phone, Mail, MessageSquare, StickyNote, Megaphone,
} from 'lucide-react';
import { subscribeClientes } from '../services/clientes';
import { subscribePaquetes } from '../services/paquetes';
import { subscribePagos } from '../services/pagos';
import { cn } from '../lib/utils';
import { DataTable, type ColumnaDef } from '../components/DataTable';
import {
  calcularMetricasClientes, destinosFrecuentes, ETIQUETAS_MANUALES, ETIQUETA_COLOR,
  DIAS_INACTIVIDAD, type MetricasCliente,
} from '../lib/marketing';
import { actualizarEtiquetasCliente, registrarContactoCliente } from '../services/marketing';
import { exportarExcel } from '../lib/excel';

const SEGMENTOS = ['Todos', 'Nuevo', 'Recurrente', 'VIP', 'Alto valor', 'Inactivo', 'Requiere seguimiento', 'Sin envíos'] as const;
const TIPOS_CONTACTO = ['Llamada', 'WhatsApp', 'Email', 'Nota'] as const;

const ICONO_CONTACTO: Record<string, React.ComponentType<{ className?: string }>> = {
  'Llamada': Phone,
  'WhatsApp': MessageSquare,
  'Email': Mail,
  'Nota': StickyNote,
};

export function MarketingClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [segmento, setSegmento] = useState<(typeof SEGMENTOS)[number]>('Todos');
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [nuevoContacto, setNuevoContacto] = useState({ tipo: 'Llamada', nota: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const unsubClientes = subscribeClientes({}, (clientes) => {
      setClientes(clientes);
      setIsLoading(false);
    });
    const unsubPaquetes = subscribePaquetes({ limit: 1000 }, (paquetes) => {
      setPaquetes(paquetes);
    });
    const unsubPagos = subscribePagos({ limit: 1000 }, (data) => {
      setPagos(data);
    });
    return () => { unsubClientes(); unsubPaquetes(); unsubPagos(); };
  }, []);

  const pagosPorTracking = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const p of pagos) {
      if (p.estado === 'Pendiente' || !p.paqueteId) continue;
      mapa[p.paqueteId] = (mapa[p.paqueteId] || 0) + (p.monto || 0);
    }
    return mapa;
  }, [pagos]);

  const metricas = useMemo(
    () => calcularMetricasClientes(clientes, paquetes, pagosPorTracking),
    [clientes, paquetes, pagosPorTracking]
  );

  const segmentadas = useMemo(
    () => (segmento === 'Todos' ? metricas : metricas.filter(m => m.etiquetas.includes(segmento))),
    [metricas, segmento]
  );

  const topDestinos = useMemo(() => destinosFrecuentes(paquetes), [paquetes]);
  const ficha = fichaId ? metricas.find(m => m.id === fichaId) || null : null;

  const conteo = (etiqueta: string) => metricas.filter(m => m.etiquetas.includes(etiqueta)).length;

  const notificar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 4000);
  };

  const toggleEtiquetaManual = async (etiqueta: string) => {
    if (!ficha) return;
    const actuales = ficha.etiquetasManuales;
    const nuevas = actuales.includes(etiqueta)
      ? actuales.filter(e => e !== etiqueta)
      : [...actuales, etiqueta];
    setIsSaving(true);
    try {
      await actualizarEtiquetasCliente(ficha.id, nuevas, ficha.cliente.nombre);
    } catch (err) {
      console.error('Error actualizando etiquetas:', err);
      notificar('No se pudieron actualizar las etiquetas.');
    } finally {
      setIsSaving(false);
    }
  };

  const guardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ficha || !nuevoContacto.nota.trim()) return;
    setIsSaving(true);
    try {
      await registrarContactoCliente(ficha.id, { tipo: nuevoContacto.tipo, nota: nuevoContacto.nota.trim() });
      setNuevoContacto({ tipo: 'Llamada', nota: '' });
    } catch (err) {
      console.error('Error registrando contacto:', err);
      notificar('No se pudo registrar el contacto.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportarCampania = () => {
    exportarExcel(`campania-${segmento.toLowerCase().replace(/\s/g, '-')}`, segmentadas.map(m => ({
      Nombre: m.cliente.nombre || '',
      Email: m.cliente.email || '',
      'Teléfono': m.cliente.telefonoEspana || '',
      Localidad: m.cliente.localidad || '',
      Etiquetas: m.etiquetas.join(', '),
      'Envíos': m.totalEnvios,
      'Ingresos (€)': m.ingresos,
      'Ticket Promedio (€)': m.ticketPromedio,
      'Último Envío': m.ultimoEnvio ? m.ultimoEnvio.toLocaleDateString('es-ES') : '',
      'Destino Frecuente': m.destinoFrecuente,
    })));
  };

  const columnas: ColumnaDef<MetricasCliente>[] = [
    {
      key: 'nombre', label: 'Cliente', sortable: true,
      valor: (m) => m.cliente.nombre || '',
      render: (m) => (
        <div>
          <p className="font-bold text-tp-blue">{m.cliente.nombre || '—'}</p>
          <p className="text-xs text-tp-blue/50">{m.cliente.email || m.cliente.telefonoEspana || ''}</p>
        </div>
      ),
    },
    {
      key: 'etiquetas', label: 'Etiquetas',
      valor: (m) => m.etiquetas.join(', '),
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.etiquetas.length === 0 && <span className="text-xs text-tp-blue/30 italic">—</span>}
          {m.etiquetas.map(e => (
            <span key={e} className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", ETIQUETA_COLOR[e] || 'bg-gray-100 text-gray-600')}>
              {e}
            </span>
          ))}
        </div>
      ),
    },
    { key: 'totalEnvios', label: 'Envíos', sortable: true, valor: (m) => m.totalEnvios },
    {
      key: 'ingresos', label: 'Ingresos', sortable: true, valor: (m) => m.ingresos,
      render: (m) => <span className="font-black text-tp-blue">€{m.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'ticketPromedio', label: 'Ticket Prom.', sortable: true, valor: (m) => m.ticketPromedio,
      render: (m) => <span>{m.totalEnvios > 0 ? `€${m.ticketPromedio.toFixed(2)}` : '—'}</span>,
    },
    {
      key: 'ultimoEnvio', label: 'Último Envío', sortable: true,
      valor: (m) => m.ultimoEnvio?.getTime() || 0,
      render: (m) => m.ultimoEnvio
        ? <span className={cn(m.diasDesdeUltimoEnvio !== null && m.diasDesdeUltimoEnvio > DIAS_INACTIVIDAD && "text-tp-red font-bold")}>
            {m.ultimoEnvio.toLocaleDateString('es-ES')}
          </span>
        : <span className="text-tp-blue/30 italic">Nunca</span>,
    },
    { key: 'destinoFrecuente', label: 'Destino Frecuente', sortable: true, valor: (m) => m.destinoFrecuente || '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Marketing y Análisis de Clientes</h1>
          <p className="text-tp-blue/60 mt-1">Segmentos, etiquetas y listas para campañas</p>
        </div>
        <button
          onClick={exportarCampania}
          disabled={segmentadas.length === 0}
          className="bg-tp-red hover:bg-[#D91F33] text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Megaphone className="w-5 h-5" /> Exportar Lista para Campaña ({segmentadas.length})
        </button>
      </div>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{mensaje}</p>
        </div>
      )}

      {/* KPIs de segmentos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-tp-blue/50"><Users className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Total Clientes</span></div>
          <p className="text-2xl font-black text-tp-blue">{metricas.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-tp-blue/50"><UserPlus className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Nuevos (30d)</span></div>
          <p className="text-2xl font-black text-tp-blue">{conteo('Nuevo')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-green-600"><TrendingUp className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Recurrentes</span></div>
          <p className="text-2xl font-black text-green-700">{conteo('Recurrente')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-600"><Users className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">VIP</span></div>
          <p className="text-2xl font-black text-purple-700">{conteo('VIP')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-tp-red"><UserMinus className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">A Recuperar</span></div>
          <p className="text-2xl font-black text-tp-red">{conteo('Inactivo')}</p>
        </div>
      </div>

      {/* Destinos frecuentes */}
      <div className="bg-white p-5 rounded-2xl border border-tp-gray-soft shadow-sm">
        <h3 className="font-bold text-tp-blue flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-tp-red" /> Destinos Frecuentes</h3>
        <div className="flex flex-wrap gap-3">
          {topDestinos.length === 0 && <p className="text-sm text-tp-blue/40 italic">Sin datos de envíos todavía.</p>}
          {topDestinos.map(d => (
            <div key={d.destino} className="px-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm">
              <span className="font-bold text-tp-blue">{d.destino}</span>
              <span className="ml-2 text-tp-blue/50">{d.envios} envío(s)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla segmentada */}
      <DataTable
        datos={segmentadas}
        columnas={columnas}
        isLoading={isLoading}
        buscarEn={(m) => `${m.cliente.nombre || ''} ${m.cliente.email || ''} ${m.cliente.telefonoEspana || ''} ${m.cliente.documentoIdentidad || ''}`}
        placeholderBusqueda="Buscar por nombre, email, teléfono..."
        filtros={
          <select
            value={segmento}
            onChange={(e) => setSegmento(e.target.value as (typeof SEGMENTOS)[number])}
            className="bg-tp-blue-light text-tp-blue px-4 py-2 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none cursor-pointer"
          >
            {SEGMENTOS.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos los segmentos' : s}</option>)}
          </select>
        }
        accionesFila={(m) => (
          <button
            onClick={() => setFichaId(m.id)}
            className="text-tp-blue hover:text-tp-red font-bold transition-colors text-xs"
          >
            Ficha
          </button>
        )}
        exportarNombre="clientes-marketing"
        exportarFila={(m) => ({
          Nombre: m.cliente.nombre || '',
          Email: m.cliente.email || '',
          'Teléfono': m.cliente.telefonoEspana || '',
          Etiquetas: m.etiquetas.join(', '),
          'Envíos': m.totalEnvios,
          'Ingresos (€)': m.ingresos,
          'Ticket Promedio (€)': m.ticketPromedio,
          'Último Envío': m.ultimoEnvio ? m.ultimoEnvio.toLocaleDateString('es-ES') : '',
          'Destino Frecuente': m.destinoFrecuente,
        })}
        porPagina={20}
        vacio="Ningún cliente en este segmento."
      />

      {/* Ficha comercial del cliente */}
      {ficha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Ficha Comercial: {ficha.cliente.nombre}</h3>
              <button onClick={() => setFichaId(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-tp-gray-soft">
                  <p className="text-[9px] font-bold text-tp-blue/40 uppercase">Envíos</p>
                  <p className="font-black text-tp-blue text-lg">{ficha.totalEnvios}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-tp-gray-soft">
                  <p className="text-[9px] font-bold text-tp-blue/40 uppercase">Ingresos</p>
                  <p className="font-black text-tp-blue text-lg">€{ficha.ingresos.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-tp-gray-soft">
                  <p className="text-[9px] font-bold text-tp-blue/40 uppercase">Ticket Prom.</p>
                  <p className="font-black text-tp-blue text-lg">{ficha.totalEnvios > 0 ? `€${ficha.ticketPromedio.toFixed(2)}` : '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-tp-gray-soft">
                  <p className="text-[9px] font-bold text-tp-blue/40 uppercase">Último Envío</p>
                  <p className="font-black text-tp-blue text-lg">{ficha.ultimoEnvio ? ficha.ultimoEnvio.toLocaleDateString('es-ES') : 'Nunca'}</p>
                </div>
              </div>

              {/* Etiquetas */}
              <div>
                <p className="text-xs font-bold text-tp-blue/50 uppercase mb-2">Etiquetas</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ficha.etiquetasAuto.map(e => (
                    <span key={e} className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", ETIQUETA_COLOR[e] || 'bg-gray-100 text-gray-600')}>
                      {e} <span className="opacity-50">(auto)</span>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ETIQUETAS_MANUALES.map(e => {
                    const activa = ficha.etiquetasManuales.includes(e);
                    return (
                      <button
                        key={e}
                        onClick={() => toggleEtiquetaManual(e)}
                        disabled={isSaving}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all disabled:opacity-50",
                          activa
                            ? cn(ETIQUETA_COLOR[e] || 'bg-tp-blue-light text-tp-blue', "border-transparent")
                            : "border-tp-gray-soft text-tp-blue/40 hover:border-tp-blue/30 bg-white"
                        )}
                      >
                        {activa ? '✓ ' : '+ '}{e}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Historial de contacto */}
              <div>
                <p className="text-xs font-bold text-tp-blue/50 uppercase mb-2">Historial de Contacto</p>
                <form onSubmit={guardarContacto} className="flex gap-2 mb-3">
                  <select
                    value={nuevoContacto.tipo}
                    onChange={e => setNuevoContacto({ ...nuevoContacto, tipo: e.target.value })}
                    className="px-3 py-2 border border-tp-gray-soft rounded-lg text-sm text-tp-blue bg-white focus:ring-2 focus:ring-tp-blue/20 outline-none"
                  >
                    {TIPOS_CONTACTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="text"
                    value={nuevoContacto.nota}
                    onChange={e => setNuevoContacto({ ...nuevoContacto, nota: e.target.value })}
                    placeholder="Nota comercial: qué se habló, próximos pasos..."
                    className="flex-1 px-3 py-2 border border-tp-gray-soft rounded-lg text-sm text-tp-blue focus:ring-2 focus:ring-tp-blue/20 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !nuevoContacto.nota.trim()}
                    className="bg-tp-blue text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#004a78] transition-colors disabled:opacity-50"
                  >
                    Registrar
                  </button>
                </form>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {(!ficha.cliente.contactos || ficha.cliente.contactos.length === 0) && (
                    <p className="text-sm text-tp-blue/40 italic">Sin contactos registrados todavía.</p>
                  )}
                  {[...(ficha.cliente.contactos || [])].reverse().map((c, i) => {
                    const Icono = ICONO_CONTACTO[c.tipo || 'Nota'] || StickyNote;
                    const fecha = c.fecha?.toDate ? c.fecha.toDate() : c.fecha instanceof Date ? c.fecha : c.fecha ? new Date(c.fecha) : null;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-tp-gray-soft">
                        <div className="w-8 h-8 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue shrink-0">
                          <Icono className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-tp-blue/80">{c.nota}</p>
                          <p className="text-[10px] text-tp-blue/40 font-bold mt-0.5">
                            {c.tipo}{fecha ? ` · ${fecha.toLocaleString('es-ES')}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
