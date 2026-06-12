import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface EtiquetaPaqueteProps {
  paquete: {
    tracking: string;
    remitente: string;
    consignatario: string;
    direccion: string;
    telefono: string;
    idDestinatario: string;
    peso: number;
    piezas: number;
    guiaMaster: string;
    trackingInterno: string;
  };
}

export const EtiquetaPaquete = React.forwardRef<HTMLDivElement, EtiquetaPaqueteProps>(({ paquete }, ref) => {
  const qrData = JSON.stringify({
    t: paquete.tracking,
    c: paquete.consignatario,
    d: paquete.direccion,
    p: paquete.peso
  });

  return (
    <div ref={ref} className="w-[10cm] h-[15cm] p-4 border-2 border-black bg-white text-black font-sans uppercase text-[10px] mx-auto my-4 shadow-sm print:shadow-none print:m-0 print:border-black">
      <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
        <div className="flex flex-col">
          <div className="text-2xl font-black italic tracking-tighter flex mb-1">
            <span className="text-black">T</span>
            <span className="text-black">P</span>
          </div>
          <div className="font-bold text-xs">TO PAQUETE LOGÍSTICA</div>
          <div className="text-[8px] font-bold">CUBANACAN EXPRESS PARTNER</div>
        </div>
        <QRCodeSVG value={qrData} size={70} level="M" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <section>
          <p className="font-bold border-b border-black mb-1 text-[8px]">REMITENTE:</p>
          <p className="font-bold h-8 overflow-hidden text-[9px]">{paquete.remitente}</p>
        </section>
        <section>
          <p className="font-bold border-b border-black mb-1 text-[8px]">CONSIGNATARIO:</p>
          <p className="font-black h-8 overflow-hidden text-[10px]">{paquete.consignatario}</p>
        </section>
      </div>

      <div className="mt-4">
        <p className="font-bold border-b border-black mb-1 text-[8px]">DIRECCIÓN DE ENTREGA:</p>
        <p className="text-[12px] font-black leading-tight h-20 overflow-hidden">{paquete.direccion}</p>
      </div>

      <div className="grid grid-cols-2 mt-4 border-t border-black pt-2">
        <div>
          <p className="font-bold text-[8px]">TELÉFONOS:</p>
          <p className="font-black text-[11px]">{paquete.telefono}</p>
        </div>
        <div>
          <p className="font-bold text-[8px]">CARNET / PASAPORTE:</p>
          <p className="font-black text-[11px]">{paquete.idDestinatario}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 mt-4 border-y-2 border-black py-3 text-center">
        <div>
          <p className="font-bold text-[8px]">PESO (KG):</p>
          <p className="text-lg font-black">{paquete.peso}</p>
        </div>
        <div>
          <p className="font-bold text-[8px]">PIEZAS:</p>
          <p className="text-lg font-black">{paquete.piezas}</p>
        </div>
        <div>
          <p className="font-bold text-[8px]">GUÍA MÁSTER:</p>
          <p className="text-[10px] font-black mt-1">{paquete.guiaMaster}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <Barcode 
          value={paquete.tracking} 
          width={2} 
          height={60} 
          fontSize={16}
          margin={0}
          displayValue={false}
        />
        <p className="mt-2 font-black text-base tracking-[0.2em]">{paquete.tracking}</p>
      </div>

      <div className="mt-auto pt-4 text-[8px] text-center border-t border-black font-bold italic">
        DOCUMENTO OFICIAL DE TRANSPORTE - TO PAQUETE LOGÍSTICA S.L.
      </div>
    </div>
  );
});

EtiquetaPaquete.displayName = 'EtiquetaPaquete';
