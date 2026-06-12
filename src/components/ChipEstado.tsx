import React from 'react';
import { cn } from '../lib/utils';

interface ChipEstadoProps {
  estado: string;
  className?: string;
}

export function ChipEstado({ estado, className }: ChipEstadoProps) {
  let colorClass = '';
  
  switch (estado.toLowerCase()) {
    case 'recepción':
    case 'pendiente':
      colorClass = 'bg-tp-blue-light text-tp-blue';
      break;
    case 'validación':
    case 'validado':
      colorClass = 'bg-blue-100 text-blue-700';
      break;
    case 'consolidado':
      colorClass = 'bg-purple-100 text-purple-700';
      break;
    case 'despacho':
      colorClass = 'bg-orange-100 text-orange-700';
      break;
    case 'entregado':
      colorClass = 'bg-green-100 text-green-700';
      break;
    case 'incidencia':
    case 'peso?':
      colorClass = 'bg-red-100 text-tp-red';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-700';
  }

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold tracking-wide", colorClass, className)}>
      {estado}
    </span>
  );
}
