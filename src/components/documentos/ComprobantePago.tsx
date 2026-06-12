import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { EncabezadoDocumento, PieDocumento } from './EncabezadoDocumento';

export interface DatosComprobante {
  referencia: string;
  tracking: string;
  fecha?: Date;
  monto: number;
  metodo: string;
  estado: string;
  agenteNombre?: string;
  nota?: string;
}

interface ComprobantePagoProps {
  comprobante: DatosComprobante;
}

/** Comprobante de pago imprimible para entregar al cliente al cobrar. */
export const ComprobantePago = React.forwardRef<HTMLDivElement, ComprobantePagoProps>(({ comprobante }, ref) => {
  return (
    <div ref={ref} className="bg-white text-black p-8 font-sans text-xs w-[148mm] mx-auto print:m-0 print:p-6">
      <EncabezadoDocumento titulo="Comprobante de Pago" referencia={`REF-${comprobante.referencia.slice(0, 8).toUpperCase()}`} fecha={comprobante.fecha} />

      <div className="border-2 border-black p-4 mb-4 text-center">
        <p className="font-bold text-[9px] uppercase">Importe Recibido</p>
        <p className="text-3xl font-black mt-1">{comprobante.monto.toFixed(2)} €</p>
        <p className="text-[10px] font-bold uppercase mt-1">{comprobante.metodo} · {comprobante.estado}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-black p-3">
          <p className="font-bold text-[9px] uppercase border-b border-black mb-1.5 pb-1">Paquete Asociado</p>
          <p className="font-mono font-black text-sm">{comprobante.tracking}</p>
          {comprobante.agenteNombre && <p className="mt-1">Atendido por: {comprobante.agenteNombre}</p>}
          {comprobante.nota && <p className="mt-1 italic">{comprobante.nota}</p>}
        </div>
        <div className="border border-black p-3 flex flex-col items-center justify-center">
          <QRCodeSVG value={comprobante.tracking} size={70} level="M" />
          <p className="font-mono font-black text-[9px] mt-2">{comprobante.tracking}</p>
        </div>
      </div>

      <div className="text-[8px] leading-snug border border-black p-2">
        <span className="font-bold uppercase">Nota: </span>
        Este comprobante acredita el pago recibido por los servicios de envío asociados al paquete indicado.
        Consérvelo como justificante. Puede consultar el estado del envío con el número de tracking.
      </div>

      <div className="grid grid-cols-2 gap-12 mt-10">
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Recibí Conforme (Cliente)</p>
        </div>
        <div className="border-t border-black pt-2 text-center">
          <p className="font-bold text-[10px] uppercase">Firma y Sello de Oficina</p>
        </div>
      </div>

      <PieDocumento />
    </div>
  );
});

ComprobantePago.displayName = 'ComprobantePago';
