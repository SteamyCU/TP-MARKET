import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw, Mail, Phone, Star, User, Users, CheckCircle2, XCircle,
  ChevronDown, Inbox, FileText, ExternalLink, Globe, RotateCcw, Undo2, X, Download,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  getSolicitudesAfiliado, aprobarSolicitudAfiliado, rechazarSolicitudAfiliado,
  volverAPendienteSolicitudAfiliado, getUrlDocumentoIdentidad,
  SolicitudAfiliado, StatusSolicitudAfiliado,
} from '../services/afiliados';

const ROLE_META: Record<string, { label: string; color: string; icon: typeof Users }> = {
  agente: { label: 'Agente', color: 'bg-tp-blue/10 text-tp-blue', icon: User },
  influencer: { label: 'Influencer', color: 'bg-tp-red/10 text-tp-red', icon: Star },
};

const STATUS_META: Record<StatusSolicitudAfiliado, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

const FILTROS: { id: 'todos' | StatusSolicitudAfiliado; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'aprobado', label: 'Aprobadas' },
  { id: 'rechazado', label: 'Rechazadas' },
];

const SUBTABS: { id: 'todos' | 'agente' | 'influencer'; label: string }[] = [
  { id: 'todos', label: 'Todos los tipos' },
  { id: 'agente', label: 'Agentes' },
  { id: 'influencer', label: 'Influencers' },
];

// Etiquetas legibles para los campos guardados en `datos`.
const DATO_LABELS: Record<string, string> = {
  pais: 'País',
  ciudad: 'Ciudad',
  zonaCobertura: 'Zona de cobertura',
  experiencia: 'Experiencia en logística',
  redSocialPrincipal: 'Red social principal',
  usuarioRedSocial: 'Usuario en la red',
  linkPerfil: 'Enlace al perfil',
  seguidores: 'Seguidores',
  comunidadRelacionada: 'Comunidad Cuba/España',
  referidor: 'Referido por',
  motivo_rechazo: 'Motivo de rechazo',
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SolicitudesAfiliados() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAfiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | StatusSolicitudAfiliado>('pendiente');
  const [subtab, setSubtab] = useState<'todos' | 'agente' | 'influencer'>('todos');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [modalAprobar, setModalAprobar] = useState<SolicitudAfiliado | null>(null);
  const [modalRechazar, setModalRechazar] = useState<SolicitudAfiliado | null>(null);
  const [motivo, setMotivo] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      setSolicitudes(await getSolicitudesAfiliado());
    } catch (err) {
      console.error('Error cargando solicitudes de afiliados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const visibles = useMemo(
    () => solicitudes.filter(s =>
      (filtro === 'todos' || s.status === filtro) &&
      (subtab === 'todos' || s.role_solicitado === subtab)
    ),
    [solicitudes, filtro, subtab]
  );

  const pendientes = useMemo(() => solicitudes.filter(s => s.status === 'pendiente').length, [solicitudes]);

  const confirmarAprobar = async () => {
    if (!modalAprobar) return;
    setProcesando(modalAprobar.id);
    try {
      await aprobarSolicitudAfiliado(modalAprobar);
      setSolicitudes(prev => prev.map(s => s.id === modalAprobar.id ? { ...s, status: 'aprobado' } : s));
      setModalAprobar(null);
    } catch (err) {
      console.error('Error aprobando solicitud:', err);
      alert('No se pudo aprobar la solicitud. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setProcesando(null);
    }
  };

  const confirmarRechazar = async () => {
    if (!modalRechazar) return;
    setProcesando(modalRechazar.id);
    try {
      await rechazarSolicitudAfiliado(modalRechazar, motivo.trim() || undefined);
      const datos = motivo.trim() ? { ...modalRechazar.datos, motivo_rechazo: motivo.trim() } : modalRechazar.datos;
      setSolicitudes(prev => prev.map(s => s.id === modalRechazar.id ? { ...s, status: 'rechazado', datos } : s));
      setModalRechazar(null);
      setMotivo('');
    } catch (err) {
      console.error('Error rechazando solicitud:', err);
      alert('No se pudo rechazar la solicitud.');
    } finally {
      setProcesando(null);
    }
  };

  const volverAPendiente = async (solicitud: SolicitudAfiliado) => {
    const accion = solicitud.status === 'aprobado' ? 'revocar el acceso de' : 'volver a revisar';
    if (!confirm(`¿Quieres ${accion} esta solicitud? Pasará de nuevo a "Pendiente".`)) return;
    setProcesando(solicitud.id);
    try {
      await volverAPendienteSolicitudAfiliado(solicitud.id);
      setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? { ...s, status: 'pendiente' } : s));
    } catch (err) {
      console.error('Error actualizando solicitud:', err);
      alert('No se pudo actualizar la solicitud.');
    } finally {
      setProcesando(null);
    }
  };

  const verDocumento = async (solicitud: SolicitudAfiliado) => {
    const path = solicitud.datos?.documentoIdentidad as string | undefined;
    if (!path) return;
    if (docUrls[solicitud.id]) {
      window.open(docUrls[solicitud.id], '_blank');
      return;
    }
    const url = await getUrlDocumentoIdentidad(path);
    if (url) {
      setDocUrls(prev => ({ ...prev, [solicitud.id]: url }));
      window.open(url, '_blank');
    } else {
      alert('No se pudo abrir el documento de identidad.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-black text-tp-blue">Solicitudes de Afiliados</h1>
          {pendientes > 0 && (
            <span className="bg-tp-red text-white text-xs font-black px-2.5 py-1 rounded-full shrink-0">
              {pendientes} pendiente{pendientes === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 text-sm border border-tp-gray-soft text-tp-blue/60 px-3 py-1.5 rounded-full font-bold hover:border-tp-blue/30 hover:text-tp-blue transition-all shrink-0"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Actualizar
        </button>
      </div>
      <p className="text-tp-blue/50 text-sm -mt-3">Altas de Agente e Influencer enviadas desde "Únete a la Red".</p>

      {/* Filtros por estado */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-bold transition-all border",
              filtro === f.id
                ? "bg-tp-blue text-white border-tp-blue"
                : "bg-white text-tp-blue/60 border-tp-gray-soft hover:border-tp-blue/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Subtabs por tipo */}
      <div className="flex flex-wrap items-center gap-2">
        {SUBTABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubtab(t.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all border",
              subtab === t.id
                ? "bg-tp-blue-light text-tp-blue border-tp-blue/30"
                : "bg-white text-tp-blue/40 border-tp-gray-soft hover:border-tp-blue/20"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-tp-gray-soft text-center">
          <RefreshCw className="w-10 h-10 text-tp-blue/20 mx-auto mb-4 animate-spin" />
          <p className="text-tp-blue/40 italic font-bold">Cargando solicitudes...</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border-2 border-tp-gray-soft border-dashed text-center">
          <Inbox className="w-16 h-16 text-tp-blue/10 mx-auto mb-6" />
          <p className="text-tp-blue/40 italic font-bold text-lg">No hay solicitudes con este filtro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-24" />
              <col className="w-40" />
              <col className="w-28" />
              <col className="w-36" />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-44" />
              <col className="w-10" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3 text-left">Fecha</th>
                <th className="py-3 px-3 text-left">Nombre</th>
                <th className="py-3 px-3 text-left">Tipo</th>
                <th className="py-3 px-3 text-left">Red Social / Canal</th>
                <th className="py-3 px-3 text-center">Seguidores</th>
                <th className="py-3 px-3 text-center">País</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-right">Acciones</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(solicitud => {
                const meta = ROLE_META[solicitud.role_solicitado] || { label: solicitud.role_solicitado, color: 'bg-slate-100 text-tp-blue/60', icon: Users };
                const statusMeta = STATUS_META[solicitud.status];
                const abierto = expandido === solicitud.id;
                const tieneDocumento = Boolean(solicitud.datos?.documentoIdentidad);
                const motivoRechazo = solicitud.datos?.motivo_rechazo as string | undefined;
                const extras = Object.entries(solicitud.datos || {})
                  .filter(([k, v]) => k !== 'documentoIdentidad' && k !== 'motivo_rechazo' && v !== null && v !== undefined && v !== '')
                  .map(([k, v]) => ({ label: DATO_LABELS[k] || k, value: String(v), key: k }));
                const canal = (solicitud.datos?.redSocialPrincipal || solicitud.datos?.usuarioRedSocial) as string | undefined;
                const seguidores = solicitud.datos?.seguidores as string | undefined;
                const pais = solicitud.datos?.pais as string | undefined;
                const inicial = (solicitud.nombre || solicitud.email || '?').charAt(0).toUpperCase();

                return (
                  <React.Fragment key={solicitud.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-xs text-slate-400 font-bold align-middle">{formatFecha(solicitud.created_at)}</td>
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-tp-blue-light text-tp-blue font-black text-xs flex items-center justify-center shrink-0">
                            {inicial}
                          </div>
                          <span className="font-bold text-tp-blue truncate">{solicitud.nombre || 'Sin nombre'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full", meta.color)}>
                          <meta.icon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-middle text-sm text-slate-500 font-medium truncate">{canal || '—'}</td>
                      <td className="py-3 px-3 align-middle text-sm text-slate-500 font-medium text-center">{seguidores || '—'}</td>
                      <td className="py-3 px-3 align-middle text-sm text-slate-500 font-medium text-center truncate">{pais || '—'}</td>
                      <td className="py-3 px-3 align-middle text-center">
                        <span className={cn("inline-block text-xs font-bold px-2 py-0.5 rounded-full", statusMeta.color)}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {solicitud.status === 'pendiente' ? (
                            <>
                              <button
                                onClick={() => setModalAprobar(solicitud)}
                                disabled={procesando === solicitud.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                              </button>
                              <button
                                onClick={() => { setModalRechazar(solicitud); setMotivo(''); }}
                                disabled={procesando === solicitud.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 border border-tp-red text-tp-red bg-white hover:bg-tp-red hover:text-white"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rechazar
                              </button>
                            </>
                          ) : solicitud.status === 'aprobado' ? (
                            <button
                              onClick={() => volverAPendiente(solicitud)}
                              disabled={procesando === solicitud.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700"
                            >
                              <Undo2 className="w-3.5 h-3.5" /> Revocar
                            </button>
                          ) : (
                            <button
                              onClick={() => volverAPendiente(solicitud)}
                              disabled={procesando === solicitud.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 bg-slate-100 text-slate-500 hover:bg-tp-blue hover:text-white"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Revisar
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-middle text-right">
                        <button
                          onClick={() => setExpandido(abierto ? null : solicitud.id)}
                          className="p-1 text-slate-400 hover:text-tp-blue hover:bg-tp-blue-light/30 rounded-full transition-colors"
                        >
                          <ChevronDown className={cn("w-4 h-4 transition-transform", abierto && "rotate-180")} />
                        </button>
                      </td>
                    </tr>

                    {abierto && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {solicitud.email && (
                              <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Email</p>
                                <a href={`mailto:${solicitud.email}`} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-tp-red transition-colors break-all">
                                  <Mail className="w-3.5 h-3.5 shrink-0" /> {solicitud.email}
                                </a>
                              </div>
                            )}
                            {solicitud.telefono && (
                              <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">WhatsApp</p>
                                <a href={`https://wa.me/${solicitud.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-tp-red transition-colors">
                                  <Phone className="w-3.5 h-3.5 shrink-0" /> {solicitud.telefono}
                                </a>
                              </div>
                            )}
                            {extras.map((e) => (
                              <div key={e.key}>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{e.label}</p>
                                {e.key === 'linkPerfil' ? (
                                  <a href={e.value} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-tp-red transition-colors break-all">
                                    <Globe className="w-3.5 h-3.5 shrink-0" /> {e.value}
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium text-slate-700 break-words">{e.value}</p>
                                )}
                              </div>
                            ))}
                            {motivoRechazo && (
                              <div className="sm:col-span-3">
                                <p className="text-xs text-tp-red/70 uppercase font-bold tracking-wider mb-1">Motivo de rechazo</p>
                                <p className="text-sm font-medium text-tp-red">{motivoRechazo}</p>
                              </div>
                            )}
                          </div>
                          {tieneDocumento && (
                            <button
                              onClick={() => verDocumento(solicitud)}
                              className="mt-4 flex items-center gap-2 text-sm font-bold text-tp-blue bg-white border border-slate-200 hover:border-tp-blue/30 px-4 py-2 rounded-xl transition-colors"
                            >
                              <Download className="w-4 h-4" /> Ver documento <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Aprobar */}
      {modalAprobar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalAprobar(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-tp-blue text-lg">Aprobar solicitud</h3>
              <button onClick={() => setModalAprobar(null)} className="p-1 text-tp-blue/40 hover:text-tp-blue"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-tp-blue/70">
              <span className="font-bold">{modalAprobar.nombre || modalAprobar.email}</span> obtendrá el rol de{' '}
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full", (ROLE_META[modalAprobar.role_solicitado] || { color: 'bg-slate-100 text-tp-blue/60' }).color)}>
                {ROLE_META[modalAprobar.role_solicitado]?.label || modalAprobar.role_solicitado}
              </span>{' '}
              y acceso inmediato a la plataforma.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalAprobar(null)} className="px-4 py-2.5 rounded-full text-sm font-black text-tp-blue/60 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button
                onClick={confirmarAprobar}
                disabled={procesando === modalAprobar.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar aprobación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {modalRechazar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalRechazar(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-tp-blue text-lg">Rechazar solicitud</h3>
              <button onClick={() => setModalRechazar(null)} className="p-1 text-tp-blue/40 hover:text-tp-blue"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-tp-blue/70">
              Vas a rechazar la solicitud de <span className="font-bold">{modalRechazar.nombre || modalRechazar.email}</span>.
              Puedes indicar opcionalmente el motivo.
            </p>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo del rechazo (opcional)"
              className="w-full border border-tp-gray-soft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalRechazar(null)} className="px-4 py-2.5 rounded-full text-sm font-black text-tp-blue/60 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button
                onClick={confirmarRechazar}
                disabled={procesando === modalRechazar.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black bg-tp-red text-white hover:bg-[#D91F33] disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
