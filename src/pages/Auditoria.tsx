import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { DataTable, type ColumnaDef } from '../components/DataTable';

const ETIQUETAS_ACCION: Record<string, string> = {
  crear_paquete: 'Paquete creado',
  cambio_estado: 'Cambio de estado',
  cobro: 'Cobro',
  crear_gasto: 'Gasto creado',
  eliminar_gasto: 'Gasto eliminado',
  crear_lote: 'Lote creado',
  agregar_a_lote: 'Agregado a lote',
  quitar_de_lote: 'Quitado de lote',
  cambio_estado_lote: 'Estado de lote',
  cambio_solicitud: 'Solicitud',
  cambio_etiquetas_cliente: 'Etiquetas cliente',
  cambio_datos_cliente: 'Datos de cliente',
  importacion: 'Importación',
};

interface Entrada {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  descripcion: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  motivo?: string | null;
  usuario: string;
  usuarioEmail?: string;
  fecha?: any;
}

export function Auditoria() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'auditoria'), orderBy('fecha', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      setEntradas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Entrada)));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const filtradas = useMemo(
    () => (filtroAccion ? entradas.filter(e => e.accion === filtroAccion) : entradas),
    [entradas, filtroAccion]
  );

  const fmtFecha = (f: any) => f?.toDate ? f.toDate().toLocaleString('es-ES') : '—';

  const columnas: ColumnaDef<Entrada>[] = [
    {
      key: 'fecha', label: 'Fecha', sortable: true,
      valor: (e) => e.fecha?.toMillis?.() || 0,
      render: (e) => <span className="text-tp-blue/70 whitespace-nowrap">{fmtFecha(e.fecha)}</span>,
    },
    {
      key: 'accion', label: 'Acción', sortable: true,
      valor: (e) => ETIQUETAS_ACCION[e.accion] || e.accion,
      render: (e) => (
        <span className="px-2 py-1 bg-tp-blue-light text-tp-blue rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
          {ETIQUETAS_ACCION[e.accion] || e.accion}
        </span>
      ),
    },
    {
      key: 'descripcion', label: 'Detalle',
      valor: (e) => e.descripcion,
      render: (e) => (
        <div className="max-w-md">
          <p className="text-tp-blue/80">{e.descripcion}</p>
          {(e.valorAnterior || e.valorNuevo) && (
            <p className="text-[11px] text-tp-blue/50 mt-0.5">
              {e.valorAnterior ? <>Antes: <span className="font-medium">{e.valorAnterior}</span></> : null}
              {e.valorAnterior && e.valorNuevo ? ' → ' : null}
              {e.valorNuevo ? <>Ahora: <span className="font-medium">{e.valorNuevo}</span></> : null}
            </p>
          )}
          {e.motivo && <p className="text-[11px] text-amber-700 mt-0.5">Motivo: {e.motivo}</p>}
        </div>
      ),
    },
    {
      key: 'usuarioEmail', label: 'Usuario', sortable: true,
      valor: (e) => e.usuarioEmail || e.usuario,
      render: (e) => <span className="text-xs text-tp-blue/60">{e.usuarioEmail || e.usuario}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tp-blue flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" /> Auditoría
        </h1>
        <p className="text-tp-blue/60 mt-1">Registro inmutable de las acciones importantes (últimas 500)</p>
      </div>

      <DataTable
        datos={filtradas}
        columnas={columnas}
        isLoading={isLoading}
        buscarEn={(e) => `${e.descripcion} ${e.entidadId} ${e.usuarioEmail || ''} ${e.valorAnterior || ''} ${e.valorNuevo || ''}`}
        placeholderBusqueda="Buscar por tracking, lote, usuario..."
        filtros={
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="bg-tp-blue-light text-tp-blue px-4 py-2 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20 appearance-none cursor-pointer"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ETIQUETAS_ACCION).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        }
        exportarNombre="auditoria"
        exportarFila={(e) => ({
          Fecha: fmtFecha(e.fecha),
          'Acción': ETIQUETAS_ACCION[e.accion] || e.accion,
          Entidad: e.entidad,
          Referencia: e.entidadId,
          Detalle: e.descripcion,
          'Valor Anterior': e.valorAnterior || '',
          'Valor Nuevo': e.valorNuevo || '',
          Motivo: e.motivo || '',
          Usuario: e.usuarioEmail || e.usuario,
        })}
        porPagina={25}
        vacio="Aún no hay entradas de auditoría. Se irán registrando con cada acción importante."
      />
    </div>
  );
}
