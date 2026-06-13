import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getProfile } from '../services/profiles';

export function Calculadora() {
  const { user, profile } = useAuth();
  const [calcPeso, setCalcPeso] = useState(5);
  const [calcDestino, setCalcDestino] = useState('La Habana');
  const [calcTipo, setCalcTipo] = useState('Normal');
  const [calcVolumen, setCalcVolumen] = useState({ largo: 0, ancho: 0, alto: 0 });
  const [precioPorKilo, setPrecioPorKilo] = useState(5.00);

  useEffect(() => {
    const fetchAgentPrice = async () => {
      if (profile?.role === 'cliente' && profile?.agenteId) {
        try {
          const agent = await getProfile(profile.agenteId);
          if (agent && agent.precioPorKilo) {
            setPrecioPorKilo(agent.precioPorKilo as number);
          }
        } catch (error) {
          console.error("Error fetching agent price:", error);
        }
      } else if (profile?.role === 'agente' && profile?.precioPorKilo) {
        setPrecioPorKilo(profile.precioPorKilo);
      }
    };
    fetchAgentPrice();
  }, [profile]);

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
              Transparencia total. Conoce el precio exacto de tu paquete según el peso, destino y tipo de artículo.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">Costo Estimado</div>
              <div className="text-5xl font-black text-white flex items-baseline gap-2">
                €{(calcPeso * precioPorKilo).toFixed(2)}
                <span className="text-lg font-medium text-white/60">EUR</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                <span className="text-white/70">Tarifa aplicada:</span>
                <span className="font-bold">€{precioPorKilo.toFixed(2)} / kg</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 lg:p-8 text-tp-blue shadow-2xl">
            <h3 className="font-bold text-xl mb-6">Detalles del Paquete</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Peso (kg)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" max="100" step="0.5"
                    value={calcPeso}
                    onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                    className="flex-1 h-2 bg-tp-gray-soft rounded-lg appearance-none cursor-pointer accent-tp-red"
                  />
                  <div className="w-24 px-3 py-2 bg-tp-blue-light/30 border border-tp-gray-soft rounded-xl font-bold text-center">
                    {calcPeso} kg
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Destino</label>
                  <select 
                    value={calcDestino}
                    onChange={(e) => setCalcDestino(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-medium"
                  >
                    <option value="La Habana">La Habana</option>
                    <option value="Santiago de Cuba">Santiago de Cuba</option>
                    <option value="Matanzas">Matanzas</option>
                    <option value="Holguín">Holguín</option>
                    <option value="Otras Provincias">Otras Provincias</option>
                  </select>
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
          </div>
        </div>
      </div>
    </div>
  );
}
