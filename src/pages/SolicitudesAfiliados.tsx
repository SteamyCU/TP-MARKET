import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw, Mail, Phone, MapPin, Star, Users, CheckCircle2, XCircle,
  ChevronDown, Inbox, Calendar, FileText, ExternalLink, Globe,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  getSolicitudesAfiliado, aprobarSolicitudAfiliado, rechazarSolicitudAfiliado,
  getUrlDocumentoIdentidad, SolicitudAfiliado, StatusSolicitudAfiliado,
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
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SolicitudesAfiliados() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAfiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | StatusSolicitudAfiliado>('pendiente');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});

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
    () => solicitudes.filter(s => filtro === 'todos' || s.status === filtro),
    [solicitudes, filtro]
  );

  const pendientes = useMemo(() => solicitudes.filter(s => s.status === 'pendiente').length, [solicitudes]);

  const aprobar = async (solicitud: SolicitudAfiliado) => {
    if (!confirm(`¿Aprobar a ${solicitud.nombre || solicitud.email} como ${ROLE_META[solicitud.role_solicitado]?.label || solicitud.role_solicitado}? Esto le dará acceso de ${solicitud.role_solicitado} en la plataforma.`)) return;
    setProcesando(solicitud.id);
    try {
      await aprobarSolicitudAfiliado(solicitud);
      setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? { ...s, status: 'aprobado' } : s));
    } catch (err) {
      console.error('Error aprobando solicitud:', err);
      alert('No se pudo aprobar la solicitud. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setProcesando(null);
    }
  };

  const rechazar = async (solicitud: SolicitudAfiliado) => {
    if (!confirm(`¿Rechazar la solicitud de ${solicitud.nombre || solicitud.email}?`)) return;
    setProcesando(solicitud.id);
    try {
      await rechazarSolicitudAfiliado(solicitud.id);
      setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? { ...s, status: 'rechazado' } : s));
    } catch (err) {
      console.error('Error rechazando solicitud:', err);
      alert('No se pudo rechazar la solicitud.');
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
        <div>
          <h2 className="text-xl font-black text-tp-blue">Altas de Agentes e Influencers</h2>
          <p className="text-tp-blue/60 text-sm mt-1">
            Solicitudes enviadas desde el formulario "Únete a la Red".
            {pendientes > 0 && <span className="text-tp-red font-bold"> · {pendientes} sin revisar</span>}
          </p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 text-sm bg-tp-blue-light text-tp-blue px-4 py-2.5 rounded-full font-black hover:bg-tp-blue hover:text-white transition-all shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Actualizar
        </button>
      </div>

      {/* Filtros */}
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

      {/* Lista */}
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
        <div className="space-y-4">
          {visibles.map(solicitud => {
            const meta = ROLE_META[solicitud.role_solicitado] || { label: solicitud.role_solicitado, color: 'bg-gray-100 text-tp-blue/60 border-tp-gray-soft', icon: Users };
            const statusMeta = STATUS_META[solicitud.status];
            const abierto = expandido === solicitud.id;
            const tieneDocumento = Boolean(solicitud.datos?.documentoIdentidad);
            const extras = Object.entries(solicitud.datos || {})
              .filter(([k, v]) => k !== 'documentoIdentidad' && v !== null && v !== undefined && v !== '')
              .map(([k, v]) => ({ label: DATO_LABELS[k] || k, value: String(v), key: k }));
            return (
              <div key={solicitud.id} className={cn(
                "bg-white rounded-3xl border shadow-sm transition-all overflow-hidden",
                solicitud.status === 'pendiente' ? "border-tp-blue/20" : "border-tp-gray-soft opacity-90"
              )}>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-black text-tp-blue text-lg">{solicitud.nombre || 'Sin nombre'}</h3>
                      <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wide flex items-center gap-1", meta.color)}>
                        <meta.icon className="w-3 h-3" /> {meta.label}
                      </span>
                      <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wide", statusMeta.color)}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tp-blue/60 font-medium">
                      {(solicitud.datos?.ciudad || solicitud.datos?.pais) && (
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {[solicitud.datos?.ciudad, solicitud.datos?.pais].filter(Boolean).join(', ')}</span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatFecha(solicitud.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {solicitud.status === 'pendiente' ? (
                      <>
                        <button
                          onClick={() => aprobar(solicitud)}
                          disabled={procesando === solicitud.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Aprobar
                        </button>
                        <button
                          onClick={() => rechazar(solicitud)}
                          disabled={procesando === solicitud.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-gray-100 text-tp-blue/60 hover:bg-red-50 hover:text-tp-red"
                        >
                          <XCircle className="w-4 h-4" /> Rechazar
                        </button>
                      </>
                    ) : solicitud.status === 'rechazado' ? (
                      <button
                        onClick={() => aprobar(solicitud)}
                        disabled={procesando === solicitud.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all disabled:opacity-50 bg-gray-100 text-tp-blue/60 hover:bg-green-500 hover:text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aprobar igualmente
                      </button>
                    ) : null}
                    <button
                      onClick={() => setExpandido(abierto ? null : solicitud.id)}
                      className="p-2 text-tp-blue/40 hover:text-tp-blue hover:bg-tp-blue-light/30 rounded-full transition-colors"
                    >
                      <ChevronDown className={cn("w-5 h-5 transition-transform", abierto && "rotate-180")} />
                    </button>
                  </div>
                </div>

                {abierto && (
                  <div className="px-5 pb-5 pt-1 border-t border-tp-gray-soft space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                      {solicitud.email && (
                        <a href={`mailto:${solicitud.email}`} className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors">
                          <Mail className="w-4 h-4 shrink-0" /> {solicitud.email}
                        </a>
                      )}
                      {solicitud.telefono && (
                        <a href={`tel:${solicitud.telefono}`} className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors">
                          <Phone className="w-4 h-4 shrink-0" /> {solicitud.telefono}
                        </a>
                      )}
                      {extras.map((e) => (
                        e.key === 'linkPerfil'
                          ? <a key={e.key} href={e.value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors break-all"><Globe className="w-4 h-4 shrink-0" /> {e.value}</a>
                          : <p key={e.key} className="text-sm text-tp-blue/70"><span className="font-bold">{e.label}:</span> {e.value}</p>
                      ))}
                    </div>
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
      )}
    </div>
  );
}
