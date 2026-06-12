import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, Calendar, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChipEstado } from '../components/ChipEstado';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

interface TrackingResult {
  trackingNumber: string;
  currentStatus: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: TrackingEvent[];
}

export function Seguimiento() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('t') || '');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('t');
    if (t) {
      performSearch(t);
    }
  }, [searchParams]);

  const performSearch = async (queryStr: string) => {
    if (!queryStr) return;
    setIsLoading(true);
    setError(false);
    setResult(null);

    try {
      const qPaquete = query(collection(db, 'paquetes'), where('tracking', '==', queryStr.toUpperCase()));
      const paqueteSnap = await getDocs(qPaquete);

      if (paqueteSnap.empty) {
        setError(true);
        setIsLoading(false);
        return;
      }

      const paqueteData = paqueteSnap.docs[0].data();

      const qEventos = query(collection(db, 'eventos'), where('paqueteId', '==', queryStr.toUpperCase()), orderBy('timestamp', 'desc'));
      const eventosSnap = await getDocs(qEventos);

      const events: TrackingEvent[] = [];
      eventosSnap.forEach((doc) => {
        const ev = doc.data();
        const dateObj = ev.timestamp ? ev.timestamp.toDate() : new Date();
        events.push({
          date: dateObj.toLocaleDateString(),
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: ev.ubicacion || 'Oficina Central',
          status: ev.estado,
          description: ev.notas || ''
        });
      });

      // If no events, add a default one based on creation date
      if (events.length === 0 && paqueteData.createdAt) {
        const dateObj = paqueteData.createdAt.toDate();
        events.push({
          date: dateObj.toLocaleDateString(),
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: paqueteData.origen || 'Oficina Central',
          status: paqueteData.estado || 'Recepción',
          description: 'Paquete registrado en el sistema'
        });
      }

      setResult({
        trackingNumber: paqueteData.tracking,
        currentStatus: paqueteData.estado || 'Recepción',
        origin: paqueteData.origen || 'Madrid, España',
        destination: paqueteData.destino || 'Cuba',
        estimatedDelivery: 'Por determinar',
        events: events
      });
    } catch (err) {
      console.error("Error fetching tracking data:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    performSearch(searchQuery);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Section */}
      <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-tp-blue mb-2">Seguimiento de Paquetes</h1>
          <p className="text-tp-blue/60">Introduce tu número de tracking para conocer el estado de tu envío</p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tp-blue/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: TP-ES-24072"
              className="w-full pl-12 pr-32 py-4 bg-tp-blue-light/30 border border-tp-gray-soft rounded-2xl text-tp-blue font-bold focus:outline-none focus:ring-2 focus:ring-tp-blue/20 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-tp-blue hover:bg-[#004a78] text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Buscando...' : 'Rastrear'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-tp-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">No se encontró ningún paquete con ese número de tracking. Por favor, verifica e intenta de nuevo.</p>
          </div>
        )}
      </div>

      {/* Result Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Card */}
          <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
            <div className="bg-tp-blue p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Número de Tracking</div>
                <div className="text-2xl font-black">{result.trackingNumber}</div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <div className="text-right hidden sm:block">
                  <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Estado Actual</div>
                  <div className="font-bold">{result.currentStatus}</div>
                </div>
                <ChipEstado estado={result.currentStatus} />
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-tp-blue/50 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Origen
                </div>
                <div className="text-tp-blue font-bold">{result.origin}</div>
              </div>
              <div className="flex items-center justify-center hidden md:flex text-tp-gray-soft">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div className="space-y-1 md:text-right">
                <div className="flex items-center md:justify-end gap-2 text-tp-blue/50 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Destino
                </div>
                <div className="text-tp-blue font-bold">{result.destination}</div>
              </div>
            </div>

            <div className="px-8 pb-8">
              <div className="bg-tp-blue-light/30 rounded-2xl p-4 flex items-center gap-4 border border-tp-gray-soft/50">
                <div className="w-12 h-12 rounded-xl bg-tp-blue text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-tp-blue/60 text-xs font-bold uppercase tracking-wider">Estimación de Entrega</div>
                  <div className="text-lg font-black text-tp-blue">{result.estimatedDelivery}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
            <h2 className="text-xl font-bold text-tp-blue mb-8 flex items-center gap-3">
              <Clock className="w-6 h-6 text-tp-red" />
              Historial de Eventos
            </h2>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-tp-blue before:via-tp-gray-soft before:to-transparent">
              {result.events.map((event, index) => (
                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300",
                    index === 0 ? "bg-tp-red text-white" : "bg-tp-gray-soft text-tp-blue/40"
                  )}>
                    {index === 0 ? <Package className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-tp-gray-soft bg-white shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-tp-blue">{event.status}</div>
                      <time className="font-mono text-xs text-tp-red font-bold">{event.date}</time>
                    </div>
                    <div className="text-tp-blue/60 text-xs font-medium mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location} • {event.time}
                    </div>
                    <div className="text-tp-blue/80 text-sm leading-relaxed">
                      {event.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      {!result && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-tp-blue-light/20 p-6 rounded-3xl border border-tp-gray-soft flex gap-4">
            <div className="w-10 h-10 rounded-full bg-tp-blue/10 text-tp-blue flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-tp-blue mb-1">Envíos Internacionales</h3>
              <p className="text-sm text-tp-blue/60 leading-relaxed">Conectamos España con cada rincón de Cuba con la mayor seguridad y rapidez del mercado.</p>
            </div>
          </div>
          <div className="bg-tp-red/5 p-6 rounded-3xl border border-tp-red/10 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-tp-red/10 text-tp-red flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-tp-blue mb-1">Garantía To Paquete</h3>
              <p className="text-sm text-tp-blue/60 leading-relaxed">Cada envío cuenta con seguro incluido y seguimiento detallado paso a paso.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
