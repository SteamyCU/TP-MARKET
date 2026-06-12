import React from 'react';
import { getEmpresa } from '../../lib/empresa';

interface EncabezadoDocumentoProps {
  titulo: string;
  referencia?: string;
  fecha?: Date;
}

/** Cabecera estándar de los documentos imprimibles de ToPaquete. Los datos de
 * empresa se leen de settings/negocio (con valores por defecto). */
export function EncabezadoDocumento({ titulo, referencia, fecha }: EncabezadoDocumentoProps) {
  const empresa = getEmpresa();
  return (
    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
      <div>
        <div className="text-3xl font-black italic tracking-tighter flex mb-1">
          <span>T</span><span>P</span>
        </div>
        <div className="font-bold text-sm">{empresa.nombre}</div>
        <div className="text-[10px]">{empresa.subtitulo}</div>
        {(empresa.telefono || empresa.email) && (
          <div className="text-[9px] mt-0.5">{[empresa.telefono, empresa.email].filter(Boolean).join(' · ')}</div>
        )}
      </div>
      <div className="text-right">
        <h1 className="text-xl font-black uppercase">{titulo}</h1>
        {referencia && <p className="font-mono font-bold text-base mt-1">{referencia}</p>}
        <p className="text-[10px] mt-1">{(fecha || new Date()).toLocaleString('es-ES')}</p>
      </div>
    </div>
  );
}

export function PieDocumento({ texto }: { texto?: string }) {
  return (
    <div className="mt-8 pt-3 text-[8px] text-center border-t border-black font-bold italic">
      {texto || getEmpresa().pie}
    </div>
  );
}
