import React from 'react';
import type { Lote } from '../../types/models';

interface PaqueteManifiesto {
  tracking: string;
  clienteNombre?: string;
  destinatarioNombre?: string;
  destinatarioDocumento?: string;
  destino?: string;
  contenido?: string;
  peso?: number;
  pesoTasable?: number | null;
}

interface ManifiestoLoteProps {
  lote: Lote;
  paquetes: PaqueteManifiesto[];
}

/** Manifiesto de carga imprimible de un lote de salida (formato A4). */
export const ManifiestoLote = React.forwardRef<HTMLDivElement, ManifiestoLoteProps>(({ lote, paquetes }, ref) => {
  const pesoTotal = paquetes.reduce((s, p) => s + (p.peso || 0), 0);
  const pesoTasableTotal = paquetes.reduce((s, p) => s + (p.pesoTasable || p.peso || 0), 0);

  return (
    <div ref={ref} className="bg-white text-black p-8 font-sans text-xs w-[210mm] mx-auto print:m-0 print:p-6">
      {/* Cabecera */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div>
          <div className="text-3xl font-black italic tracking-tighter flex mb-1">
            <span>T</span><span>P</span>
          </div>
          <div className="font-bold text-sm">TO PAQUETE LOGÍSTICA S.L.</div>
          <div className="text-[10px]">CUBANACAN EXPRESS PARTNER</div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-black uppercase">Manifiesto de Carga</h1>
          <p className="font-mono font-bold text-base mt-1">{lote.codigo}</p>
          <p className="text-[10px] mt-1">Emitido: {new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>

      {/* Datos del lote */}
      <div className="grid grid-cols-4 gap-3 mb-4 border border-black p-3">
        <div><p className="font-bold text-[9px] uppercase">Ruta</p><p className="font-black">{lote.ruta || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Contenedor / Guía</p><p className="font-black">{lote.contenedor || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Oficina Origen</p><p>{lote.oficinaOrigen || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Oficina Destino</p><p>{lote.oficinaDestino || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Responsable</p><p>{lote.responsable || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Salida Estimada</p><p>{lote.fechaEstimadaSalida || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Llegada Estimada</p><p>{lote.fechaEstimadaLlegada || '—'}</p></div>
        <div><p className="font-bold text-[9px] uppercase">Estado</p><p className="font-black uppercase">{lote.estado}</p></div>
      </div>

      {/* Tabla de paquetes */}
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="border-y-2 border-black text-left text-[9px] uppercase">
            <th className="py-1.5 pr-2">#</th>
            <th className="py-1.5 pr-2">Tracking</th>
            <th className="py-1.5 pr-2">Remitente</th>
            <th className="py-1.5 pr-2">Destinatario</th>
            <th className="py-1.5 pr-2">Documento</th>
            <th className="py-1.5 pr-2">Destino</th>
            <th className="py-1.5 pr-2">Contenido</th>
            <th className="py-1.5 text-right">Peso (kg)</th>
          </tr>
        </thead>
        <tbody>
          {paquetes.map((p, i) => (
            <tr key={p.tracking} className="border-b border-gray-400">
              <td className="py-1 pr-2">{i + 1}</td>
              <td className="py-1 pr-2 font-mono font-bold">{p.tracking}</td>
              <td className="py-1 pr-2">{p.clienteNombre || '—'}</td>
              <td className="py-1 pr-2">{p.destinatarioNombre || '—'}</td>
              <td className="py-1 pr-2">{p.destinatarioDocumento || '—'}</td>
              <td className="py-1 pr-2">{p.destino || '—'}</td>
              <td className="py-1 pr-2">{(p.contenido || '—').slice(0, 40)}</td>
              <td className="py-1 text-right font-bold">{(p.peso || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-black">
            <td colSpan={7} className="py-2 uppercase text-right pr-4">Totales — {paquetes.length} paquetes · Peso tasable {pesoTasableTotal.toFixed(2)} kg</td>
            <td className="py-2 text-right">{pesoTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Firmas */}
      <div className="grid grid-cols-2 gap-12 mt-12">
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Entrega (Oficina Origen)</p>
          <p className="text-[9px] mt-6">Nombre, firma y fecha</p>
        </div>
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Recepción (Transportista / Destino)</p>
          <p className="text-[9px] mt-6">Nombre, firma y fecha</p>
        </div>
      </div>

      <div className="mt-8 pt-3 text-[8px] text-center border-t border-black font-bold italic">
        DOCUMENTO OFICIAL DE TRANSPORTE - TO PAQUETE LOGÍSTICA S.L.
      </div>
    </div>
  );
});

ManifiestoLote.displayName = 'ManifiestoLote';
