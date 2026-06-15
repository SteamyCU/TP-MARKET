import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw, Mail, Phone, MapPin, Building2, CheckCircle2, Circle,
  ChevronDown, Inbox, Calendar,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  getContactosPartners, marcarContactoAtendido,
  ContactoPartner, TipoSolicitud,
} from '../services/contactosPartners';

const TIPO_META: Record<TipoSolicitud, { label: string; color: string }> = {
  partner: { label: 'Partner', color: 'bg-tp-blue/10 text-tp-blue border-tp-blue/20' },
  franquicia: { label: 'Franquicia', color: 'bg-tp-red/10 text-tp-red border-tp-red/20' },
  punto_de_entrega: { label: 'Punto de Entrega', color: 'bg-green-100 text-green-700 border-green-200' },
};

const FILTROS: { id: 'todos' | TipoSolicitud; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  { id: 'partner', label: 'Partner' },
  { id: 'franquicia', label: 'Franquicia' },
  { id: 'punto_de_entrega', label: 'Punto de Entrega' },
];

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function etiquetaDato(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const labels: Record<string, string> = {
    local_disponible: 'Local disponible',
    experiencia: 'Experiencia en negocios',
    bascula: 'Báscula',
  };
  const valores: Record<string, string> = {
    si: 'Sí', no: 'No', en_busqueda: 'En búsqueda',
    true: 'Sí', false: 'No',
  };
  const label = labels[key] || key;
  const val = valores[String(value)] ?? String(value);
  return `${label}: ${val}`;
}

export function SolicitudesB2B() {
  const [contactos, setContactos] = useState<ContactoPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | TipoSolicitud>('todos');
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      setContactos(await getContactosPartners());
    } catch (err) {
      console.error('Error cargando solicitudes B2B:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const visibles = useMemo(() => contactos.filter(c =>
    (filtro === 'todos' || c.tipo_solicitud === filtro) &&
    (!soloPendientes || !c.atendido)
  ), [contactos, filtro, soloPendientes]);

  const pendientes = useMemo(() => contactos.filter(c => !c.atendido).length, [contactos]);

  const toggleAtendido = async (contacto: ContactoPartner) => {
    setActualizando(contacto.id);
    try {
      await marcarContactoAtendido(contacto.id, !contacto.atendido);
      setContactos(prev => prev.map(c => c.id === contacto.id ? { ...c, atendido: !c.atendido } : c));
    } catch (err) {
      console.error('Error actualizando solicitud:', err);
      alert('No se pudo actualizar la solicitud.');
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-tp-blue">Solicitudes de la Web</h2>
          <p className="text-tp-blue/60 text-sm mt-1">
            Contactos recibidos desde los formularios de Partner, Franquicia y Punto de Entrega.
            {pendientes > 0 && <span className="text-tp-red font-bold"> · {pendientes} sin atender</span>}
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
        <label className="ml-auto flex items-center gap-2 text-sm font-bold text-tp-blue/70 cursor-pointer">
          <input type="checkbox" checked={soloPendientes} onChange={e => setSoloPendientes(e.target.checked)} className="w-4 h-4 accent-tp-red" />
          Solo sin atender
        </label>
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
          <p className="text-tp-blue/40 italic font-bold text-lg">No hay solicitudes con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibles.map(contacto => {
            const meta = TIPO_META[contacto.tipo_solicitud];
            const abierto = expandido === contacto.id;
            const extras = Object.entries(contacto.datos || {})
              .map(([k, v]) => etiquetaDato(k, v))
              .filter((x): x is string => x !== null);
            return (
              <div key={contacto.id} className={cn(
                "bg-white rounded-3xl border shadow-sm transition-all overflow-hidden",
                contacto.atendido ? "border-tp-gray-soft opacity-75" : "border-tp-blue/20"
              )}>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-black text-tp-blue text-lg">{contacto.nombre}</h3>
                      <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wide", meta.color)}>
                        {meta.label}
                      </span>
                      {contacto.atendido && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-green-100 text-green-700 tracking-wide flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Atendido
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tp-blue/60 font-medium">
                      {contacto.empresa && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {contacto.empresa}</span>}
                      {contacto.ciudad && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {contacto.ciudad}</span>}
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatFecha(contacto.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleAtendido(contacto)}
                      disabled={actualizando === contacto.id}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all disabled:opacity-50",
                        contacto.atendido
                          ? "bg-gray-100 text-tp-blue/60 hover:bg-gray-200"
                          : "bg-green-500 text-white hover:bg-green-600"
                      )}
                    >
                      {contacto.atendido ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      {contacto.atendido ? 'Reabrir' : 'Atendido'}
                    </button>
                    <button
                      onClick={() => setExpandido(abierto ? null : contacto.id)}
                      className="p-2 text-tp-blue/40 hover:text-tp-blue hover:bg-tp-blue-light/30 rounded-full transition-colors"
                    >
                      <ChevronDown className={cn("w-5 h-5 transition-transform", abierto && "rotate-180")} />
                    </button>
                  </div>
                </div>

                {abierto && (
                  <div className="px-5 pb-5 pt-1 border-t border-tp-gray-soft space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                      <a href={`mailto:${contacto.email}`} className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors">
                        <Mail className="w-4 h-4 shrink-0" /> {contacto.email}
                      </a>
                      <a href={`tel:${contacto.telefono}`} className="flex items-center gap-2 text-sm text-tp-blue font-bold hover:text-tp-red transition-colors">
                        <Phone className="w-4 h-4 shrink-0" /> {contacto.telefono}
                      </a>
                      {contacto.tipo_negocio && (
                        <p className="text-sm text-tp-blue/70"><span className="font-bold">Tipo de negocio:</span> {contacto.tipo_negocio}</p>
                      )}
                      {contacto.volumen_estimado && (
                        <p className="text-sm text-tp-blue/70"><span className="font-bold">Volumen estimado:</span> {contacto.volumen_estimado}</p>
                      )}
                      {extras.map((e, i) => (
                        <p key={i} className="text-sm text-tp-blue/70">{e}</p>
                      ))}
                    </div>
                    {contacto.mensaje && (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-tp-gray-soft">
                        <p className="text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1">Mensaje</p>
                        <p className="text-sm text-tp-blue/80 leading-relaxed whitespace-pre-wrap">{contacto.mensaje}</p>
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
  );
}
