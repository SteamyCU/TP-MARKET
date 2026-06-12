import React, { useState, useEffect } from 'react';
import { 
  Calculator, Trophy, Star, Shield, Crown, AlertCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export function ProgramaAfiliados() {
  const { user, loading: authLoading, profile: userData } = useAuth();
  
  // Simulator state
  const [simulator, setSimulator] = useState({
    seguidores: 100,
    kilosCliente: 5,
    precioMedioKilo: 6
  });

  const [levelsConfig, setLevelsConfig] = useState<any>({
    bronce: { min: 0, max: 50, comision: 0.03, bono: 5, subAfiliado: 0, pagoMinimo: 30 },
    plata: { min: 51, max: 200, comision: 0.05, bono: 20, subAfiliado: 0.01, pagoMinimo: 50 },
    oro: { min: 201, max: 500, comision: 0.07, bono: 60, subAfiliado: 0.015, pagoMinimo: 100 },
    elite: { min: 501, max: 999999, comision: 0.10, bono: 150, subAfiliado: 0.02, gestor: true }
  });

  const [basePrice, setBasePrice] = useState(6);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'influencer_levels');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLevelsConfig(docSnap.data());
        }

        const preciosRef = doc(db, 'settings', 'precios');
        const preciosSnap = await getDoc(preciosRef);
        if (preciosSnap.exists()) {
          const preciosData = preciosSnap.data();
          if (userData?.role === 'partner') {
            setBasePrice(preciosData.b2b || 5);
            setSimulator(prev => ({ ...prev, precioMedioKilo: preciosData.b2b || 5 }));
          } else {
            setBasePrice(preciosData.influencer || 6);
            setSimulator(prev => ({ ...prev, precioMedioKilo: preciosData.influencer || 6 }));
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    if (userData) {
      fetchSettings();
    }
  }, [userData]);

  const calculateSimulator = () => {
    const totalKilos = simulator.seguidores * simulator.kilosCliente;
    const volumen = totalKilos * simulator.precioMedioKilo;
    
    // We use totalKilos instead of envios for the level logic in the simulator
    let nivel = 'bronce';
    let conf = levelsConfig.bronce;
    
    if (totalKilos > levelsConfig.elite.min) { nivel = 'élite'; conf = levelsConfig.elite; }
    else if (totalKilos > levelsConfig.oro.min) { nivel = 'oro'; conf = levelsConfig.oro; }
    else if (totalKilos > levelsConfig.plata.min) { nivel = 'plata'; conf = levelsConfig.plata; }

    const comisionEnvios = volumen * conf.comision;
    const totalMes = comisionEnvios + conf.bono;

    // Anti-fraud: minimum 50kg and 5 clients to withdraw
    const canWithdraw = totalKilos >= 50 && simulator.seguidores >= 5;

    return { totalKilos, volumen, nivel, conf, comisionEnvios, totalMes, canWithdraw };
  };

  const simResult = calculateSimulator();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-tp-blue">Información del Programa</h1>
          <p className="text-tp-blue/60">Simula tus ganancias y conoce los beneficios de cada nivel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator */}
        <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
          <h2 className="text-xl font-bold text-tp-blue mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-tp-red" />
            Simulador de Ganancias
          </h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Seguidores que convierten</label>
              <input 
                type="number" 
                value={simulator.seguidores}
                onChange={(e) => setSimulator({...simulator, seguidores: Number(e.target.value)})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Kilos / cliente / mes</label>
                <input 
                  type="number" 
                  value={simulator.kilosCliente}
                  onChange={(e) => setSimulator({...simulator, kilosCliente: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2">Precio medio kilo (€)</label>
                <input 
                  type="number" 
                  value={simulator.precioMedioKilo}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-100 border border-tp-gray-soft rounded-xl focus:outline-none text-tp-blue/60 font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="text-tp-blue/60">Total kilos/mes:</div>
              <div className="font-bold text-tp-blue text-right">{simResult.totalKilos} kg</div>
              
              <div className="text-tp-blue/60">Nivel estimado:</div>
              <div className="font-bold text-tp-red text-right uppercase">{simResult.nivel}</div>
              
              <div className="text-tp-blue/60">Volumen generado:</div>
              <div className="font-bold text-tp-blue text-right">€{simResult.volumen.toFixed(2)}</div>
              
              <div className="text-tp-blue/60">Comisión ({simResult.conf.comision * 100}%):</div>
              <div className="font-bold text-tp-blue text-right">€{simResult.comisionEnvios.toFixed(2)}</div>
              
              <div className="text-tp-blue/60">Bono mensual:</div>
              <div className="font-bold text-tp-blue text-right">€{simResult.conf.bono.toFixed(2)}</div>
              
              <div className="col-span-2 border-t border-tp-blue/10 pt-4 mt-2 flex justify-between items-center">
                <div className="font-bold text-tp-blue">Total/mes estimado:</div>
                <div className="text-2xl font-black text-green-500">€{simResult.totalMes.toFixed(2)}</div>
              </div>
            </div>
            
            {!simResult.canWithdraw && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  <strong>Atención:</strong> Para retirar ganancias necesitas un mínimo de <strong>50 kg</strong> enviados y <strong>5 clientes</strong>. 
                  Actualmente tienes {simResult.totalKilos} kg y {simulator.seguidores} clientes en esta simulación.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Levels Explanation */}
        <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
          <h2 className="text-xl font-bold text-tp-blue mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-tp-red" />
            Niveles de Afiliado
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-tp-gray-soft hover:border-tp-blue/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-tp-blue flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-400" /> Nivel Bronce
                </div>
                <div className="text-xs font-bold text-tp-blue/50 bg-gray-100 px-2 py-1 rounded-md">{levelsConfig.bronce.min} a {levelsConfig.bronce.max} kg/mes</div>
              </div>
              <div className="text-sm text-tp-blue/70 grid grid-cols-2 gap-2">
                <div>Comisión: <span className="font-bold">{(levelsConfig.bronce.comision * 100).toFixed(0)}%</span></div>
                <div>Bono: <span className="font-bold">€{levelsConfig.bronce.bono}</span></div>
                <div>Pago mínimo: <span className="font-bold">€{levelsConfig.bronce.pagoMinimo}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-tp-gray-soft hover:border-tp-blue/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-tp-blue flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" /> Nivel Plata
                </div>
                <div className="text-xs font-bold text-tp-blue/50 bg-gray-100 px-2 py-1 rounded-md">{levelsConfig.plata.min} a {levelsConfig.plata.max} kg/mes</div>
              </div>
              <div className="text-sm text-tp-blue/70 grid grid-cols-2 gap-2">
                <div>Comisión: <span className="font-bold">{(levelsConfig.plata.comision * 100).toFixed(0)}%</span></div>
                <div>Bono: <span className="font-bold">€{levelsConfig.plata.bono}</span></div>
                <div>Sub-afiliado: <span className="font-bold">{(levelsConfig.plata.subAfiliado * 100).toFixed(0)}%</span></div>
                <div>Pago mínimo: <span className="font-bold">€{levelsConfig.plata.pagoMinimo}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-tp-gray-soft hover:border-tp-blue/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-tp-blue flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Nivel Oro
                </div>
                <div className="text-xs font-bold text-tp-blue/50 bg-gray-100 px-2 py-1 rounded-md">{levelsConfig.oro.min} a {levelsConfig.oro.max} kg/mes</div>
              </div>
              <div className="text-sm text-tp-blue/70 grid grid-cols-2 gap-2">
                <div>Comisión: <span className="font-bold">{(levelsConfig.oro.comision * 100).toFixed(0)}%</span></div>
                <div>Bono: <span className="font-bold">€{levelsConfig.oro.bono}</span></div>
                <div>Sub-afiliado: <span className="font-bold">{(levelsConfig.oro.subAfiliado * 100).toFixed(1)}%</span></div>
                <div>Pago mínimo: <span className="font-bold">€{levelsConfig.oro.pagoMinimo}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-tp-red/30 bg-tp-red/5">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-tp-red flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Nivel Élite
                </div>
                <div className="text-xs font-bold text-tp-red/70 bg-tp-red/10 px-2 py-1 rounded-md">+{levelsConfig.elite.min} kg/mes</div>
              </div>
              <div className="text-sm text-tp-blue/70 grid grid-cols-2 gap-2">
                <div>Comisión: <span className="font-bold text-tp-red">{(levelsConfig.elite.comision * 100).toFixed(0)}%</span></div>
                <div>Bono: <span className="font-bold text-tp-red">€{levelsConfig.elite.bono}</span></div>
                <div>Sub-afiliado: <span className="font-bold text-tp-red">{(levelsConfig.elite.subAfiliado * 100).toFixed(0)}%</span></div>
                <div>Gestor propio: <span className="font-bold text-tp-red">✓</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
