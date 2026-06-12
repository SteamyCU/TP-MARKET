import React from 'react';
import { EncabezadoDocumento, PieDocumento } from './EncabezadoDocumento';
import type { Lote } from '../../types/models';

export interface PaqueteEntrega {
  tracking: string;
  destinatarioNombre?: string;
  destinatarioTelefono?: string;
  destinatarioDireccion?: string;
  destino?: string;
  importePendiente?: number;
}

interface HojaEntregaProps {
  titulo?: string;
  lote?: Lote | null;
  paquetes: PaqueteEntrega[];
}

/** Hoja de entrega imprimible: lista de paquetes con espacio para firma del receptor. */
export const HojaEntrega = React.forwardRef<HTMLDivElement, HojaEntregaProps>(({ titulo, lote, paquetes }, ref) => {
  return (
    <div ref={ref} className="bg-white text-black p-8 font-sans text-xs w-[210mm] mx-auto print:m-0 print:p-6">
      <EncabezadoDocumento titulo={titulo || 'Hoja de Entrega'} referencia={lote?.codigo} />

      {lote && (
        <div className="grid grid-cols-3 gap-3 mb-4 border border-black p-3">
          <div><p className="font-bold text-[9px] uppercase">Ruta</p><p className="font-black">{lote.ruta || '—'}</p></div>
          <div><p className="font-bold text-[9px] uppercase">Oficina Destino</p><p>{lote.oficinaDestino || '—'}</p></div>
          <div><p className="font-bold text-[9px] uppercase">Responsable</p><p>{lote.responsable || '—'}</p></div>
        </div>
      )}

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="border-y-2 border-black text-left text-[9px] uppercase">
            <th className="py-1.5 pr-2">#</th>
            <th className="py-1.5 pr-2">Tracking</th>
            <th className="py-1.5 pr-2">Destinatario</th>
            <th className="py-1.5 pr-2">Teléfono</th>
            <th className="py-1.5 pr-2">Dirección</th>
            <th className="py-1.5 pr-2 text-right">Por Cobrar</th>
            <th className="py-1.5 pl-3 w-[34mm]">Firma / Fecha</th>
          </tr>
        </thead>
        <tbody>
          {paquetes.map((p, i) => (
            <tr key={p.tracking} className="border-b border-gray-400">
              <td className="py-2 pr-2">{i + 1}</td>
              <td className="py-2 pr-2 font-mono font-bold">{p.tracking}</td>
              <td className="py-2 pr-2 font-bold">{p.destinatarioNombre || '—'}</td>
              <td className="py-2 pr-2">{p.destinatarioTelefono || '—'}</td>
              <td className="py-2 pr-2">{(p.destinatarioDireccion || p.destino || '—').slice(0, 60)}</td>
              <td className="py-2 pr-2 text-right font-black">
                {(p.importePendiente || 0) > 0 ? `${(p.importePendiente || 0).toFixed(2)} €` : '—'}
              </td>
              <td className="py-2 pl-3 border-l border-gray-400"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[9px] mb-2">
        Total: <span className="font-black">{paquetes.length} paquete(s)</span> ·
        Importe por cobrar en entrega: <span className="font-black">
          {paquetes.reduce((a, p) => a + (p.importePendiente || 0), 0).toFixed(2)} €
        </span>
      </p>

      <div className="grid grid-cols-2 gap-12 mt-10">
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Repartidor</p>
          <p className="text-[9px] mt-6">Nombre, firma y fecha</p>
        </div>
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Supervisor</p>
          <p className="text-[9px] mt-6">Nombre, firma y fecha</p>
        </div>
      </div>

      <PieDocumento />
    </div>
  );
});

HojaEntrega.displayName = 'HojaEntrega';
