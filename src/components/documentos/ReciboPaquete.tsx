import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { EncabezadoDocumento, PieDocumento } from './EncabezadoDocumento';
import { getCondicionesRecibo } from '../../lib/empresa';

export interface DatosRecibo {
  tracking: string;
  fecha?: Date;
  estado?: string;
  clienteNombre: string;
  clienteTelefono?: string;
  destinatarioNombre: string;
  destinatarioDocumento?: string;
  destinatarioTelefono?: string;
  destinatarioDireccion?: string;
  destino?: string;
  contenido?: string;
  tipoEnvio?: string;
  peso?: number;
  pesoTasable?: number | null;
  precioFinal?: number | null;
  importePagado?: number;
  importePendiente?: number;
  metodoPago?: string;
  estadoPago?: string;
}

interface ReciboPaqueteProps {
  recibo: DatosRecibo;
}

const eur = (n?: number | null) => n !== undefined && n !== null ? `${n.toFixed(2)} €` : '—';

/** Recibo de paquete imprimible (entregable al cliente en recepción). */
export const ReciboPaquete = React.forwardRef<HTMLDivElement, ReciboPaqueteProps>(({ recibo }, ref) => {
  return (
    <div ref={ref} className="bg-white text-black p-8 font-sans text-xs w-[148mm] mx-auto print:m-0 print:p-6">
      <EncabezadoDocumento titulo="Recibo de Paquete" referencia={recibo.tracking} fecha={recibo.fecha} />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-black p-3">
          <p className="font-bold text-[9px] uppercase border-b border-black mb-1.5 pb-1">Remitente</p>
          <p className="font-black text-sm">{recibo.clienteNombre || '—'}</p>
          {recibo.clienteTelefono && <p>{recibo.clienteTelefono}</p>}
        </div>
        <div className="border border-black p-3">
          <p className="font-bold text-[9px] uppercase border-b border-black mb-1.5 pb-1">Destinatario (Cuba)</p>
          <p className="font-black text-sm">{recibo.destinatarioNombre || '—'}</p>
          {recibo.destinatarioDocumento && <p>CI/Pasaporte: {recibo.destinatarioDocumento}</p>}
          {recibo.destinatarioTelefono && <p>{recibo.destinatarioTelefono}</p>}
          <p className="mt-1">{recibo.destinatarioDireccion || ''}{recibo.destino ? ` · ${recibo.destino}` : ''}</p>
        </div>
      </div>

      <div className="border border-black p-3 mb-4">
        <p className="font-bold text-[9px] uppercase border-b border-black mb-1.5 pb-1">Detalle del Envío</p>
        <div className="grid grid-cols-4 gap-3 text-center mt-2">
          <div>
            <p className="font-bold text-[8px] uppercase">Contenido</p>
            <p className="font-black">{(recibo.contenido || '—').slice(0, 30)}</p>
          </div>
          <div>
            <p className="font-bold text-[8px] uppercase">Tipo</p>
            <p className="font-black">{recibo.tipoEnvio || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-[8px] uppercase">Peso Real</p>
            <p className="font-black">{recibo.peso ? `${recibo.peso.toFixed(2)} kg` : '—'}</p>
          </div>
          <div>
            <p className="font-bold text-[8px] uppercase">Peso Tasable</p>
            <p className="font-black">{recibo.pesoTasable ? `${recibo.pesoTasable.toFixed(2)} kg` : '—'}</p>
          </div>
        </div>
        {recibo.estado && <p className="mt-2 text-[9px]"><span className="font-bold uppercase">Estado:</span> {recibo.estado}</p>}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 border-2 border-black p-3">
          <p className="font-bold text-[9px] uppercase border-b border-black mb-2 pb-1">Importes</p>
          <div className="space-y-1">
            <div className="flex justify-between"><span>Precio del envío</span><span className="font-black">{eur(recibo.precioFinal)}</span></div>
            <div className="flex justify-between"><span>Pagado{recibo.metodoPago ? ` (${recibo.metodoPago})` : ''}</span><span className="font-black">{eur(recibo.importePagado || 0)}</span></div>
            <div className="flex justify-between border-t border-black pt-1 mt-1">
              <span className="font-bold uppercase">Pendiente de pago</span>
              <span className="font-black text-sm">{eur(recibo.importePendiente || 0)}</span>
            </div>
          </div>
          {recibo.estadoPago && <p className="mt-2 text-[9px] font-bold uppercase">Estado de pago: {recibo.estadoPago}</p>}
        </div>
        <div className="flex flex-col items-center justify-center border border-black p-3">
          <QRCodeSVG value={recibo.tracking} size={80} level="M" />
          <p className="font-mono font-black text-[10px] mt-2">{recibo.tracking}</p>
        </div>
      </div>

      <div className="text-[8px] leading-snug border border-black p-2 mb-4">
        <span className="font-bold uppercase">Condiciones: </span>
        {getCondicionesRecibo()} Consulte el estado de su envío con el número de tracking en nuestra plataforma de seguimiento.
      </div>

      <div className="grid grid-cols-2 gap-12 mt-8">
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Firma del Remitente</p>
        </div>
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Firma y Sello de Oficina</p>
        </div>
      </div>

      <PieDocumento />
    </div>
  );
});

ReciboPaquete.displayName = 'ReciboPaquete';
