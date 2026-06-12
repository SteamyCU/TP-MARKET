import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';

export function ConfiguracionAfiliados() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    bronce: { min: 0, max: 50, comision: 0.03, bono: 5, subAfiliado: 0, pagoMinimo: 30 },
    plata: { min: 51, max: 200, comision: 0.05, bono: 20, subAfiliado: 0.01, pagoMinimo: 50 },
    oro: { min: 201, max: 500, comision: 0.07, bono: 60, subAfiliado: 0.015, pagoMinimo: 100 },
    elite: { min: 501, max: 999999, comision: 0.10, bono: 150, subAfiliado: 0.02, gestor: true }
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'influencer_levels');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as any);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'influencer_levels'), config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (nivel: string, campo: string, valor: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [nivel]: {
        ...prev[nivel as keyof typeof prev],
        [campo]: valor
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-tp-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-tp-gray-soft shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-tp-blue">Configuración de Afiliados</h1>
          <p className="text-tp-blue/60 text-sm mt-1">Modifica los parámetros de los niveles de influencers.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-tp-blue hover:bg-[#004a78] text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-tp-blue/20 active:scale-95"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-200 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <Settings className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Configuración guardada correctamente.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Niveles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(config).map(([nivel, datos]) => (
            <div key={nivel} className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm hover:border-tp-blue/20 transition-all group">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-tp-gray-soft">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm",
                    nivel === 'bronce' ? "bg-orange-100 text-orange-700" :
                    nivel === 'plata' ? "bg-gray-100 text-gray-600" :
                    nivel === 'oro' ? "bg-yellow-100 text-yellow-700" :
                    "bg-tp-blue text-white"
                  )}>
                    {nivel.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-tp-blue capitalize">Nivel {nivel}</h2>
                    <p className="text-[10px] text-tp-blue/40 font-bold uppercase tracking-widest">Parámetros de rendimiento</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1.5 ml-1">Mín. Envíos</label>
                      <input
                        type="number"
                        value={datos.min}
                        onChange={(e) => handleChange(nivel, 'min', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1.5 ml-1">Máx. Envíos</label>
                      <input
                        type="number"
                        value={datos.max}
                        onChange={(e) => handleChange(nivel, 'max', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1.5 ml-1">Comisión Directa</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={datos.comision}
                        onChange={(e) => handleChange(nivel, 'comision', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1.5 ml-1">Bono Fijo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">€</span>
                        <input
                          type="number"
                          value={datos.bono}
                          onChange={(e) => handleChange(nivel, 'bono', Number(e.target.value))}
                          className="w-full pl-7 pr-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1.5 ml-1">Sub-Afiliados</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.001"
                          value={datos.subAfiliado}
                          onChange={(e) => handleChange(nivel, 'subAfiliado', Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold text-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">%</span>
                      </div>
                    </div>
                  </div>
                  
                  {nivel !== 'elite' ? (
                    <div>
                      <label className="block text-[10px] font-black text-tp-blue/40 uppercase tracking-widest mb-1.5 ml-1">Pago Mínimo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-blue/30 font-bold text-xs">€</span>
                        <input
                          type="number"
                          value={(datos as any).pagoMinimo}
                          onChange={(e) => handleChange(nivel, 'pagoMinimo', Number(e.target.value))}
                          className="w-full pl-7 pr-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center h-full pt-6">
                      <label className="relative flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(datos as any).gestor}
                          onChange={(e) => handleChange(nivel, 'gestor', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tp-blue"></div>
                        <span className="ml-3 text-sm font-bold text-tp-blue group-hover:text-tp-red transition-colors">Gestor Propio</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
