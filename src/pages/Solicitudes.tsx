import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, PackagePlus, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChipEstado } from '../components/ChipEstado';
import { DataTable, type ColumnaDef } from '../components/DataTable';
import { actualizarEstadoSolicitud, subscribeSolicitudes } from '../services/solicitudes';
import { ESTADOS_SOLICITUD } from '../constants/estados';
import type { Solicitud } from '../types/models';

type SolicitudDoc = Solicitud & { createdAt?: any };

export function Solicitudes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [seleccionada, setSeleccionada] = useState<SolicitudDoc | null>(null);
  const [notaParaCliente, setNotaParaCliente] = useState('');
  const [notaInterna, setNotaInterna] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeSolicitudes({}, (data) => {
      setSolicitudes(data as unknown as SolicitudDoc[]);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const pendientes = solicitudes.filter(s => ['Nueva', 'Pendiente de revisión'].includes(s.estado)).length;

  const filtradas = useMemo(
    () => (filtroEstado ? solicitudes.filter(s => s.estado === filtroEstado) : solicitudes),
    [solicitudes, filtroEstado]
  );

  const notificar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 4000);
  };

  const abrirRevision = (s: SolicitudDoc) => {
    setSeleccionada(s);
    setNotaParaCliente(s.notaParaCliente || '');
    setNotaInterna(s.notaInterna || '');
  };

  const aplicarEstado = async (estado: string) => {
    if (!seleccionada) return;
    setIsWorking(true);
    try {
      await actualizarEstadoSolicitud(seleccionada.id, estado, {
        notaParaCliente,
        notaInterna,
      });
      notificar(`Solicitud marcada como "${estado}".`);
      setSeleccionada(null);
    } catch (err) {
      console.error('Error updating solicitud:', err);
      notificar('Error al actualizar la solicitud.');
    } finally {
      setIsWorking(false);
    }
  };

  const convertirEnPaquete = (s: SolicitudDoc) => {
    navigate('/dashboard/recepcion', { state: { solicitud: s } });
  };

  const columnas: ColumnaDef<SolicitudDoc>[] = [
    {
      key: 'createdAt', label: 'Fecha', sortable: true,
      valor: (s) => s.createdAt?.toMillis?.() || 0,
      render: (s) => <span className="text-tp-blue/70">{s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('es-ES') : '—'}</span>,
    },
    { key: 'clienteNombre', label: 'Cliente', sortable: true, render: (s) => (
      <div>
        <p className="font-bold text-tp-blue">{s.clienteNombre || '—'}</p>
        <p className="text-xs text-tp-blue/50">{s.clienteEmail}</p>
      </div>
    )},
    { key: 'destinatarioNombre', label: 'Destinatario', sortable: true, valor: (s) => s.destinatarioNombre || '' },
    { key: 'contenido', label: 'Contenido', valor: (s) => s.contenido || '' },
    { key: 'modalidad', label: 'Modalidad', sortable: true, valor: (s) => s.modalidad || 'regular', render: (s) => <span>{s.modalidad === 'express' ? 'Express' : 'Regular'}</span> },
    { key: 'pesoEstimado', label: 'Peso Est.', sortable: true, valor: (s) => s.pesoEstimado || 0, render: (s) => <span>{s.pesoEstimado ? `${s.pesoEstimado} kg` : '—'}</span> },
    { key: 'estado', label: 'Estado', sortable: true, render: (s) => <ChipEstado estado={s.estado} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Solicitudes de Envío</h1>
          <p className="text-tp-blue/60 mt-1">
            Solicitudes creadas por clientes desde su portal
            {pendientes > 0 && <span className="ml-2 bg-tp-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendientes} por revisar</span>}
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{mensaje}</p>
        </div>
      )}

      <DataTable
        datos={filtradas}
        columnas={columnas}
        isLoading={isLoading}
        buscarEn={(s) => `${s.clienteNombre || ''} ${s.clienteEmail || ''} ${s.destinatarioNombre || ''} ${s.contenido || ''} ${s.tracking || ''}`}
        placeholderBusqueda="Buscar por cliente, destinatario, contenido..."
        filtros={
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-tp-blue-light text-tp-blue px-4 py-2 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_SOLICITUD.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        }
        accionesFila={(s) => (
          <button
            onClick={() => abrirRevision(s)}
            className="text-tp-blue hover:text-tp-red font-bold transition-colors text-xs"
          >
            Revisar
          </button>
        )}
        exportarNombre="solicitudes"
        exportarFila={(s) => ({
          Fecha: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('es-ES') : '',
          Cliente: s.clienteNombre || '',
          Email: s.clienteEmail || '',
          Destinatario: s.destinatarioNombre || '',
          Provincia: s.destinatarioProvincia || '',
          Contenido: s.contenido || '',
          'Tipo de Envío': s.tipoEnvio || '',
          Modalidad: s.modalidad === 'express' ? 'Express' : 'Regular',
          'Peso Estimado': s.pesoEstimado || '',
          Estado: s.estado,
          Tracking: s.tracking || '',
        })}
        porPagina={20}
        vacio="No hay solicitudes de clientes todavía."
      />

      {/* Modal de revisión */}
      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold flex items-center gap-2"><Inbox className="w-5 h-5" /> Revisar Solicitud</h3>
              <button onClick={() => setSeleccionada(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-bold text-tp-blue">{seleccionada.clienteNombre}</p>
                  <p className="text-xs text-tp-blue/50">{seleccionada.clienteEmail}{seleccionada.clienteTelefono ? ` · ${seleccionada.clienteTelefono}` : ''}</p>
                </div>
                <ChipEstado estado={seleccionada.estado} />
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-tp-gray-soft text-sm">
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Destinatario</p>
                  <p className="font-bold text-tp-blue">{seleccionada.destinatarioNombre}</p>
                  <p className="text-xs text-tp-blue/60">{seleccionada.destinatarioProvincia || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Envío</p>
                  <p className="font-bold text-tp-blue">{seleccionada.tipoEnvio}</p>
                  <p className="text-xs text-tp-blue/60">{seleccionada.modalidad === 'express' ? 'Express' : 'Regular'}</p>
                  <p className="text-xs text-tp-blue/60">{seleccionada.pesoEstimado ? `~${seleccionada.pesoEstimado} kg` : 'Peso sin estimar'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Contenido</p>
                  <p className="text-tp-blue/80">{seleccionada.contenido}</p>
                </div>
                {seleccionada.observaciones && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Observaciones del Cliente</p>
                    <p className="text-tp-blue/80">{seleccionada.observaciones}</p>
                  </div>
                )}
                {seleccionada.tracking && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-tp-blue/40 uppercase">Tracking del Paquete</p>
                    <p className="font-mono font-bold text-tp-blue">{seleccionada.tracking}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nota para el Cliente (visible si faltan datos)</label>
                <textarea
                  rows={2}
                  value={notaParaCliente}
                  onChange={e => setNotaParaCliente(e.target.value)}
                  placeholder="Ej: necesitamos el carnet del destinatario..."
                  className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none text-tp-blue"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nota Interna</label>
                <textarea
                  rows={2}
                  value={notaInterna}
                  onChange={e => setNotaInterna(e.target.value)}
                  placeholder="Solo visible para el equipo..."
                  className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none text-tp-blue"
                ></textarea>
              </div>

              {seleccionada.estado !== 'Convertida en paquete' ? (
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    onClick={() => aplicarEstado('Rechazada')}
                    disabled={isWorking}
                    className="px-4 py-2 text-tp-red font-bold hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => aplicarEstado('Faltan datos')}
                    disabled={isWorking || !notaParaCliente.trim()}
                    title={!notaParaCliente.trim() ? 'Escribe la nota para el cliente indicando qué falta' : undefined}
                    className="px-4 py-2 bg-amber-100 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                  >
                    Faltan Datos
                  </button>
                  <button
                    onClick={() => aplicarEstado('Aprobada')}
                    disabled={isWorking}
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => convertirEnPaquete(seleccionada)}
                    disabled={isWorking}
                    className="px-4 py-2 bg-tp-red text-white font-bold rounded-lg hover:bg-[#D91F33] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <PackagePlus className="w-4 h-4" /> Convertir en Paquete
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Esta solicitud ya fue convertida en paquete.
                </div>
              )}

              {isWorking && (
                <div className="flex items-center gap-2 text-tp-blue/50 text-sm">
                  <div className="w-4 h-4 border-2 border-tp-blue border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
