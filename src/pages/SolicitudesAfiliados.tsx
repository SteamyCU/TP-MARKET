import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw, Mail, Phone, Star, Users, CheckCircle2, XCircle,
  ChevronDown, Inbox, FileText, ExternalLink, Globe, RotateCcw, Undo2, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  getSolicitudesAfiliado, aprobarSolicitudAfiliado, rechazarSolicitudAfiliado,
  volverAPendienteSolicitudAfiliado, getUrlDocumentoIdentidad,
  SolicitudAfiliado, StatusSolicitudAfiliado,
} from '../services/afiliados';

const ROLE_META: Record<string, { label: string; color: string; icon: typeof Users }> = {
  agente: { label: 'Agente', color: 'bg-tp-blue/10 text-tp-blue border-tp-blue/20', icon: Users },
  influencer: { label: 'Influencer', color: 'bg-tp-red/10 text-tp-red border-tp-red/20', icon: Star },
};

const STATUS_META: Record<StatusSolicitudAfiliado, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rechazado: { label: 'Rechazado', color: 'bg-gray-100 text-tp-blue/50' },
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-tp-blue">Solicitudes de Afiliados</h1>
            <p className="text-tp-blue/60 text-sm mt-1">Altas de Agente e Influencer enviadas desde "Únete a la Red".</p>
          </div>
          {pendientes > 0 && (
            <span className="bg-tp-red text-white text-xs font-black px-3 py-1 rounded-full shrink-0">
              {pendientes} pendiente{pendientes === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 text-sm bg-tp-blue-light text-tp-blue px-4 py-2.5 rounded-full font-black hover:bg-tp-blue hover:text-white transition-all shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Actualizar
        </button>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold transition-all border",
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
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
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
        <div className="bg-white rounded-3xl border border-tp-gray-soft shadow-sm overflow-hidden">
          {/* Cabecera de tabla (solo desktop) */}
          <div className="hidden md:grid grid-cols-[100px_1.4fr_100px_1.2fr_90px_1fr_110px_auto] gap-3 px-5 py-3 bg-gray-50/60 border-b border-tp-gray-soft text-[10px] font-black uppercase text-tp-blue/40 tracking-wide">
            <span>Fecha</span>
            <span>Nombre</span>
            <span>Tipo</span>
            <span>Red Social / Canal</span>
            <span>Seguidores</span>
            <span>País</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>

          <div className="divide-y divide-tp-gray-soft">
            {visibles.map(solicitud => {
              const meta = ROLE_META[solicitud.role_solicitado] || { label: solicitud.role_solicitado, color: 'bg-gray-100 text-tp-blue/60 border-tp-gray-soft', icon: Users };
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

              return (
                <div key={solicitud.id}>
                  <div
                    className={cn(
                      "px-5 py-4 grid grid-cols-1 md:grid-cols-[100px_1.4fr_100px_1.2fr_90px_1fr_110px_auto] gap-3 items-center transition-colors",
                      solicitud.status === 'pendiente' && "bg-tp-blue-light/10"
                    )}
                  >
                    <span className="text-xs text-tp-blue/50 font-bold md:text-sm">{formatFecha(solicitud.created_at)}</span>
                    <span className="font-black text-tp-blue truncate">{solicitud.nombre || 'Sin nombre'}</span>
                    <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wide flex items-center gap-1 w-fit", meta.color)}>
                      <meta.icon className="w-3 h-3" /> {meta.label}
                    </span>
                    <span className="text-sm text-tp-blue/70 font-medium truncate">{canal || '—'}</span>
                    <span className="text-sm text-tp-blue/70 font-medium">{seguidores || '—'}</span>
                    <span className="text-sm text-tp-blue/70 font-medium truncate">{pais || '—'}</span>
                    <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wide w-fit", statusMeta.color)}>
                      {statusMeta.label}
                    </span>

                    <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap">
                      {solicitud.status === 'pendiente' ? (
                        <>
                          <button
                            onClick={() => setModalAprobar(solicitud)}
                            disabled={procesando === solicitud.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                          </button>
                          <button
                            onClick={() => { setModalRechazar(solicitud); setMotivo(''); }}
                            disabled={procesando === solicitud.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-red-50 text-tp-red hover:bg-tp-red hover:text-white"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </>
                      ) : solicitud.status === 'aprobado' ? (
                        <button
                          onClick={() => volverAPendiente(solicitud)}
                          disabled={procesando === solicitud.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-gray-100 text-tp-blue/60 hover:bg-amber-100 hover:text-amber-700"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Revocar
                        </button>
                      ) : (
                        <button
                          onClick={() => volverAPendiente(solicitud)}
                          disabled={procesando === solicitud.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-gray-100 text-tp-blue/60 hover:bg-tp-blue hover:text-white"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Revisar de nuevo
                        </button>
                      )}
                      <button
                        onClick={() => setExpandido(abierto ? null : solicitud.id)}
                        className="p-1.5 text-tp-blue/40 hover:text-tp-blue hover:bg-tp-blue-light/30 rounded-full transition-colors"
                      >
                        <ChevronDown className={cn("w-5 h-5 transition-transform", abierto && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {abierto && (
                    <div className="px-5 pb-5 pt-1 border-t border-tp-gray-soft space-y-3 bg-gray-50/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                        {solicitud.email && (
                          <a href={`mailto:${solicitud.email}`} className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors">
                            <Mail className="w-4 h-4 shrink-0" /> {solicitud.email}
                          </a>
                        )}
                        {solicitud.telefono && (
                          <a href={`https://wa.me/${solicitud.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors">
                            <Phone className="w-4 h-4 shrink-0" /> {solicitud.telefono} (WhatsApp)
                          </a>
                        )}
                        {extras.map((e) => (
                          e.key === 'linkPerfil'
                            ? <a key={e.key} href={e.value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors break-all"><Globe className="w-4 h-4 shrink-0" /> {e.value}</a>
                            : <p key={e.key} className="text-sm text-tp-blue/70"><span className="font-bold">{e.label}:</span> {e.value}</p>
                        ))}
                      </div>
                      {motivoRechazo && (
                        <div className="text-sm text-tp-red bg-red-50 rounded-xl px-4 py-2.5">
                          <span className="font-bold">Motivo de rechazo:</span> {motivoRechazo}
                        </div>
                      )}
                      {tieneDocumento && (
                        <button
                          onClick={() => verDocumento(solicitud)}
                          className="flex items-center gap-2 text-sm font-black text-tp-blue bg-tp-blue-light/40 hover:bg-tp-blue-light px-4 py-2.5 rounded-xl transition-colors"
                        >
                          <FileText className="w-4 h-4" /> Ver documento de identidad <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wide", (ROLE_META[modalAprobar.role_solicitado] || { color: 'bg-gray-100 text-tp-blue/60 border-tp-gray-soft' }).color)}>
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
