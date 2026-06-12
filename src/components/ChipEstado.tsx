import React from 'react';
import { cn } from '../lib/utils';
import { ESTADO_COLOR } from '../constants/estados';

interface ChipEstadoProps {
  estado: string;
  className?: string;
}

export function ChipEstado({ estado, className }: ChipEstadoProps) {
  const colorClass = ESTADO_COLOR[estado?.toLowerCase()] || 'bg-gray-100 text-gray-700';

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold tracking-wide", colorClass, className)}>
      {estado}
    </span>
  );
}
