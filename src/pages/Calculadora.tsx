import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Loader2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  getTarifasEnvio, getTarifasTransporte, getTarifasExpressContenido, calcularPrecio, calcularPrecioExpressContenido,
  EXPRESS_CONTENIDO_POR_TIPO, TarifaEnvio, TarifaTransporteCuba, TarifaExpressContenido,
} from '../services/tarifas';

export function Calculadora() {
  const [calcPeso, setCalcPeso] = useState(5);
  const [calcCantidad, setCalcCantidad] = useState(1);
  const [calcDestino, setCalcDestino] = useState('La Habana');
  const [calcTipo, setCalcTipo] = useState('Normal');
  const [calcModo, setCalcModo] = useState<'Regular' | 'Express'>('Regular');
  const [calcVolumen, setCalcVolumen] = useState({ largo: 0, ancho: 0, alto: 0 });

  const [tarifasEnvio, setTarifasEnvio] = useState<TarifaEnvio[]>([]);
  const [tarifasTransporte, setTarifasTransporte] = useState<TarifaTransporteCuba[]>([]);
  const [tarifasExpressContenido, setTarifasExpressContenido] = useState<TarifaExpressContenido[]>([]);
  const [loadingTarifas, setLoadingTarifas] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getTarifasEnvio(), getTarifasTransporte(), getTarifasExpressContenido()])
      .then(([envio, transporte, expressContenido]) => {
        if (!active) return;
        setTarifasEnvio(envio);
        setTarifasTransporte(transporte);
        setTarifasExpressContenido(expressContenido);
        const activos = transporte.filter(g => g.activo);
        if (activos.length > 0 && !activos.some(g => g.provincias.includes(calcDestino))) {
          setCalcDestino(activos[0].provincias[0]);
        }
      })
      .catch((error) => console.error('Error cargando tarifas:', error))
      .finally(() => { if (active) setLoadingTarifas(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (calcModo === 'Express' && calcDestino !== 'La Habana') {
      setCalcDestino('La Habana');
    }
  }, [calcModo, calcDestino]);

  const provinciasDisponibles = useMemo(
    () => tarifasTransporte.filter(g => g.activo).flatMap(g => g.provincias),
    [tarifasTransporte]
  );

  const pesoMaximo = useMemo(() => {
    const maximos = tarifasEnvio.filter(t => t.activo && t.peso_max !== null).map(t => t.peso_max as number);
    return maximos.length > 0 ? Math.max(...maximos) : 100;
  }, [tarifasEnvio]);

  const calculo = useMemo(
    () => calcularPrecio(calcPeso, 'regular', calcDestino, tarifasEnvio, tarifasTransporte),
    [calcPeso, calcDestino, tarifasEnvio, tarifasTransporte]
  );

  const calculoExpress = useMemo(
    () => calcularPrecioExpressContenido(EXPRESS_CONTENIDO_POR_TIPO[calcTipo], calcPeso, calcCantidad, tarifasExpressContenido),
    [calcTipo, calcPeso, calcCantidad, tarifasExpressContenido]
  );

  const expressPorUnidad = calcModo === 'Express' && calculoExpress?.tipoPrecio === 'unidad';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tp-blue to-[#003355] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tp-red/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-tp-blue-light/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-white/20">
              <Calculator className="w-4 h-4" /> Calculadora de Envíos
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">
              Calcula el costo de tu envío a Cuba al instante
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-md">
              Transparencia total. Conoce el precio exacto de tu paquete según el peso, destino y modalidad.
            </p>

            {calcModo === 'Express' ? (
              calculoExpress ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70">
                      {calculoExpress.tipoPrecio === 'unidad'
                        ? `${calculoExpress.cantidad} ud. × €${calculoExpress.precioUnitario.toFixed(2)}/ud.`
                        : `${calculoExpress.cantidad}kg × €${calculoExpress.precioUnitario.toFixed(2)}/kg`}
                    </span>
                    <span className="font-bold">€{calculoExpress.total.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-white/10">
                    <div className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">Costo Estimado</div>
                    <div className="text-5xl font-black text-white flex items-baseline gap-2">
                      €{calculoExpress.total.toFixed(2)}
                      <span className="text-lg font-medium text-white/60">EUR</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">Costo Estimado</div>
                  <div className="text-3xl font-black text-white">
                    {loadingTarifas ? 'Cargando...' : 'Consultar precio'}
                  </div>
                </div>
              )
            ) : calculo ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">Precio base: {calculo.pesoKg}kg × €{calculo.precioKgBase.toFixed(2)}/kg</span>
                  <span className="font-bold">€{calculo.precioBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">Transporte Cuba: {calculo.pesoKg}kg × €{calculo.recargoProvincialKg.toFixed(2)}/kg</span>
                  <span className="font-bold">€{calculo.recargoProvincial.toFixed(2)}</span>
                </div>
                <div className="pt-4 mt-2 border-t border-white/10">
                  <div className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">Costo Estimado</div>
                  <div className="text-5xl font-black text-white flex items-baseline gap-2">
                    €{calculo.total.toFixed(2)}
                    <span className="text-lg font-medium text-white/60">EUR</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">Costo Estimado</div>
                <div className="text-3xl font-black text-white">
                  {loadingTarifas ? 'Cargando...' : 'Consultar precio'}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 lg:p-8 text-tp-blue shadow-2xl">
            <h3 className="font-bold text-xl mb-6">Detalles del Paquete</h3>

            {loadingTarifas ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-tp-blue/40">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">Cargando tarifas...</span>
              </div>
            ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Modalidad</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCalcModo('Regular')}
                    className={cn(
                      "px-4 py-3 rounded-xl font-black text-center transition-all border",
                      calcModo === 'Regular'
                        ? "bg-tp-blue text-white border-tp-blue shadow-md"
                        : "bg-gray-50 text-tp-blue border-tp-gray-soft hover:border-tp-blue/30"
                    )}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcModo('Express')}
                    className={cn(
                      "px-4 py-3 rounded-xl font-black text-center transition-all border",
                      calcModo === 'Express'
                        ? "bg-tp-red text-white border-tp-red shadow-md"
                        : "bg-gray-50 text-tp-blue border-tp-gray-soft hover:border-tp-blue/30"
                    )}
                  >
                    Express
                  </button>
                </div>
              </div>

              {expressPorUnidad ? (
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Cantidad de unidades</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1" max="20" step="1"
                      value={calcCantidad}
                      onChange={(e) => setCalcCantidad(parseInt(e.target.value) || 1)}
                      className="flex-1 h-2 bg-tp-gray-soft rounded-lg appearance-none cursor-pointer accent-tp-red"
                    />
                    <div className="w-24 px-3 py-2 bg-tp-blue-light/30 border border-tp-gray-soft rounded-xl font-bold text-center">
                      {calcCantidad} ud.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Peso (kg)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1" max={pesoMaximo} step="0.5"
                      value={calcPeso}
                      onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                      className="flex-1 h-2 bg-tp-gray-soft rounded-lg appearance-none cursor-pointer accent-tp-red"
                    />
                    <div className="w-24 px-3 py-2 bg-tp-blue-light/30 border border-tp-gray-soft rounded-xl font-bold text-center">
                      {calcPeso} kg
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Destino</label>
                  <select
                    value={calcDestino}
                    onChange={(e) => setCalcDestino(e.target.value)}
                    disabled={calcModo === 'Express'}
                    className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {(calcModo === 'Express' ? ['La Habana'] : provinciasDisponibles).map((provincia) => (
                      <option key={provincia} value={provincia}>{provincia}</option>
                    ))}
                  </select>
                  {calcModo === 'Express' && (
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      El envío Express solo está disponible a La Habana.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Tipo</label>
                  <select
                    value={calcTipo}
                    onChange={(e) => setCalcTipo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-medium"
                  >
                    <option value="Normal">Miscelánea Normal</option>
                    <option value="Bateria">Batería</option>
                    <option value="Movil">Móvil / Celular</option>
                    <option value="Laptop">Laptop / PC</option>
                    <option value="Medicinas">Medicinas (Exento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Volumen (cm) - Opcional</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <input type="number" placeholder="Largo" value={calcVolumen.largo || ''} onChange={e => setCalcVolumen({...calcVolumen, largo: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tp-blue/40 font-bold">L</span>
                  </div>
                  <div className="relative">
                    <input type="number" placeholder="Ancho" value={calcVolumen.ancho || ''} onChange={e => setCalcVolumen({...calcVolumen, ancho: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tp-blue/40 font-bold">A</span>
                  </div>
                  <div className="relative">
                    <input type="number" placeholder="Alto" value={calcVolumen.alto || ''} onChange={e => setCalcVolumen({...calcVolumen, alto: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tp-blue/20" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tp-blue/40 font-bold">H</span>
                  </div>
                </div>
                <p className="text-[10px] text-tp-blue/40 mt-2 font-medium">* El volumen no afecta el precio base, pero ayuda a la logística.</p>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
