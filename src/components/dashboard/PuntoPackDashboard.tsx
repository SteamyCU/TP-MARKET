import React, { useState, useEffect } from 'react';
import { Package, Box, TrendingUp, CheckCircle2, Wallet, Clock, Search, Scan, MapPin, ArrowRight, AlertCircle, Phone, User, Calendar } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { subscribePaquetes, getPaqueteByTracking, updatePaquete } from '../../services/paquetes';
import { addEvento } from '../../services/eventos';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { cn } from '../../lib/utils';
import { ChipEstado } from '../ChipEstado';

export function PuntoPackDashboard() {
  const { user, profile } = useAuth();
  const [paquetesEnCustodia, setPaquetesEnCustodia] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    totalMonthly: 0,
    packagesReceived: 0,
    packagesDelivered: 0,
    bonusVolume: 0
  });
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch packages currently at this pickup point
    const unsubscribe = subscribePaquetes({
      destino: profile?.direccion || '', // Assuming destino is the point address for now
      estado: 'En Punto Pack',
    }, (data) => {
      setPaquetesEnCustodia(data);

      // Calculate earnings (mock logic based on the spec)
      const received = data.length + 15; // Mocking some history
      const delivered = 12; // Mocking some history
      const baseRec = received * 0.40;
      const baseEnt = delivered * 0.35;
      const bonus = received > 300 ? received * 0.10 : 0;
      
      setEarnings({
        totalMonthly: baseRec + baseEnt + bonus,
        packagesReceived: received,
        packagesDelivered: delivered,
        bonusVolume: bonus
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'paquetes (punto pack)');
      console.error("Error in punto pack snapshot:", error);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    setIsScanning(true);
    setScanResult(null);
    
    try {
      // Find the package by tracking
      const p = await getPaqueteByTracking(scanInput.trim());
      if (p) {
        setScanResult(p);
      } else {
        setScanResult({ error: 'Paquete no encontrado' });
      }
      setIsScanning(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'paquetes (scan)');
      console.error("Error scanning package:", error);
      setIsScanning(false);
    }
  };

  const confirmReception = async (paquete: any) => {
    try {
      await updatePaquete(paquete.id, {
        estado: 'En Punto Pack',
      });

      // El evento referencia al paquete por su tracking (paquete_id = tracking).
      await addEvento({
        paqueteId: paquete.tracking,
        estado: 'En Punto Pack',
        notas: `Paquete recibido en punto de entrega: ${profile?.name}`,
        operadorId: user?.uid,
      });

      setScanResult(null);
      setScanInput('');
    } catch (error) {
      console.error("Error confirming reception:", error);
    }
  };

  const confirmDelivery = async (paquete: any) => {
    try {
      await updatePaquete(paquete.id, {
        estado: 'Entregado',
      });

      await addEvento({
        paqueteId: paquete.tracking,
        estado: 'Entregado',
        notas: `Paquete entregado al destinatario final en punto de entrega: ${profile?.name}`,
        operadorId: user?.uid,
      });

      setScanResult(null);
      setScanInput('');
    } catch (error) {
      console.error("Error confirming delivery:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tp-red to-[#D91F33] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-red-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs opacity-80">Portal de Punto Pack</span>
          </div>
          <h1 className="text-3xl font-black mb-2">{profile?.name}</h1>
          <p className="text-white/70 max-w-xl">
            Tu establecimiento es clave en la última milla. Escanea paquetes, gestiona la custodia y aumenta tus ingresos.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos del Mes', value: `€${earnings.totalMonthly.toFixed(2)}`, icon: Wallet, color: 'text-green-500' },
          { label: 'Paquetes en Custodia', value: paquetesEnCustodia.length.toString(), icon: Box, color: 'text-tp-blue' },
          { label: 'Recibidos (Mes)', value: earnings.packagesReceived.toString(), icon: Package, color: 'text-blue-500' },
          { label: 'Entregados (Mes)', value: earnings.packagesDelivered.toString(), icon: CheckCircle2, color: 'text-tp-red' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm hover:shadow-md transition-shadow">
            <kpi.icon className={cn("w-6 h-6 mb-4", kpi.color)} />
            <div className="text-2xl font-black text-tp-blue">{kpi.value}</div>
            <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
            <h2 className="text-xl font-bold text-tp-blue mb-6 flex items-center gap-2">
              <Scan className="w-6 h-6 text-tp-red" />
              Escanear Paquete (Entrada/Salida)
            </h2>
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 mb-8">
              <input 
                type="text" 
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Escanea o escribe el número de tracking..." 
                className="flex-1 px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold text-tp-blue"
              />
              <button 
                type="submit" 
                disabled={isScanning}
                className="bg-tp-blue text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#004a78] transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isScanning ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="w-5 h-5" />}
                BUSCAR
              </button>
            </form>

            {scanResult && !scanResult.error && (
              <div className="p-6 bg-tp-blue-light/30 rounded-3xl border border-tp-blue/10 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs font-bold text-tp-blue/40 uppercase mb-1">Paquete Encontrado</div>
                    <div className="text-2xl font-black text-tp-blue">{scanResult.tracking}</div>
                  </div>
                  <ChipEstado estado={scanResult.estado} />
                </div>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-tp-blue shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-tp-blue/40 uppercase">Destinatario</div>
                      <div className="text-sm font-bold text-tp-blue">{scanResult.destinatarioNombre || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-tp-blue shadow-sm">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-tp-blue/40 uppercase">Teléfono</div>
                      <div className="text-sm font-bold text-tp-blue">{scanResult.destinatarioTelefono || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {scanResult.estado !== 'En Punto Pack' && scanResult.estado !== 'Entregado' && (
                    <button 
                      onClick={() => confirmReception(scanResult)}
                      className="flex-1 bg-tp-blue text-white py-4 rounded-2xl font-bold hover:bg-[#004a78] transition-all"
                    >
                      CONFIRMAR RECEPCIÓN EN PUNTO
                    </button>
                  )}
                  {scanResult.estado === 'En Punto Pack' && (
                    <button 
                      onClick={() => confirmDelivery(scanResult)}
                      className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all"
                    >
                      CONFIRMAR ENTREGA AL CLIENTE
                    </button>
                  )}
                </div>
              </div>
            )}

            {scanResult?.error && (
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4 text-tp-red">
                <AlertCircle className="w-8 h-8" />
                <div>
                  <div className="font-bold">Error de Escaneo</div>
                  <div className="text-sm opacity-80">{scanResult.error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Custody List */}
          <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center">
              <h2 className="text-lg font-bold text-tp-blue">Paquetes en Custodia</h2>
              <span className="text-xs font-bold text-tp-blue/40 uppercase">{paquetesEnCustodia.length} Paquetes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
                  <tr>
                    <th className="px-6 py-4">Tracking</th>
                    <th className="px-6 py-4">Días en Punto</th>
                    <th className="px-6 py-4">Destinatario</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tp-gray-soft">
                  {paquetesEnCustodia.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-tp-blue">{p.tracking}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-tp-blue/30" />
                          <span className={cn(
                            "font-bold",
                            (p.updatedAt?.toDate() ? Math.floor((Date.now() - p.updatedAt.toDate()) / (1000 * 60 * 60 * 24)) : 0) > 4 ? "text-tp-red" : "text-tp-blue/70"
                          )}>
                            {p.updatedAt?.toDate() ? Math.floor((Date.now() - p.updatedAt.toDate()) / (1000 * 60 * 60 * 24)) : 0} días
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-tp-blue/70">{p.destinatarioNombre}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => confirmDelivery(p)}
                          className="text-tp-blue hover:text-tp-red font-bold transition-colors"
                        >
                          Entregar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paquetesEnCustodia.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-tp-blue/30 italic">No hay paquetes en custodia.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Earnings Breakdown */}
          <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
            <h2 className="text-lg font-bold text-tp-blue mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-tp-red" />
              Detalle de Ganancias
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-xs font-bold text-tp-blue/60 uppercase">Recibidos (0,40€)</span>
                <span className="font-bold text-tp-blue">€{(earnings.packagesReceived * 0.40).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-xs font-bold text-tp-blue/60 uppercase">Entregados (0,35€)</span>
                <span className="font-bold text-tp-blue">€{(earnings.packagesDelivered * 0.35).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-tp-red/5 rounded-2xl border border-tp-red/10">
                <span className="text-xs font-bold text-tp-red uppercase">Bono Volumen</span>
                <span className="font-bold text-tp-red">€{earnings.bonusVolume.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-tp-gray-soft flex justify-between items-center">
                <span className="font-black text-tp-blue">TOTAL ACUMULADO</span>
                <span className="text-2xl font-black text-tp-blue">€{earnings.totalMonthly.toFixed(2)}</span>
              </div>
              <button className="w-full bg-tp-blue text-white py-4 rounded-2xl font-bold hover:bg-[#004a78] transition-all mt-4">
                SOLICITAR LIQUIDACIÓN
              </button>
            </div>
          </div>

          {/* Point Info */}
          <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
            <h2 className="text-lg font-bold text-tp-blue mb-4">Información del Punto</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-tp-red shrink-0" />
                <div className="text-xs text-tp-blue/60 leading-relaxed">
                  {profile?.direccion}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-tp-blue shrink-0" />
                <div className="text-xs text-tp-blue/60">
                  Horario: Lun-Vie 09:00 - 20:00
                </div>
              </div>
              <div className="p-4 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                <div className="text-[10px] font-bold text-tp-blue/40 uppercase mb-1">Capacidad de Almacén</div>
                <div className="flex justify-between text-xs font-bold text-tp-blue mb-2">
                  <span>{paquetesEnCustodia.length} / {profile?.capacityPackages || 50} paquetes</span>
                  <span>{Math.round((paquetesEnCustodia.length / (profile?.capacityPackages || 50)) * 100)}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tp-blue transition-all" 
                    style={{ width: `${(paquetesEnCustodia.length / (profile?.capacityPackages || 50)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
