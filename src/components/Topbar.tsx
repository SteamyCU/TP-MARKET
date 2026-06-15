import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Plus, Menu, UserPlus, Inbox, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { contarSolicitudesAfiliadoPendientes } from '../services/afiliados';
import { contarContactosPartnersPendientes } from '../services/contactosPartners';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [openNotif, setOpenNotif] = useState(false);
  const [afiliadosPend, setAfiliadosPend] = useState(0);
  const [b2bPend, setB2bPend] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const totalPend = afiliadosPend + b2bPend;

  // Solo el admin recibe avisos de solicitudes entrantes.
  useEffect(() => {
    if (role !== 'admin') return;
    let active = true;
    const cargar = () => {
      Promise.all([
        contarSolicitudesAfiliadoPendientes(),
        contarContactosPartnersPendientes(),
      ])
        .then(([afiliados, b2b]) => {
          if (!active) return;
          setAfiliadosPend(afiliados);
          setB2bPend(b2b);
        })
        .catch((err) => console.error('Error cargando avisos:', err));
    };
    cargar();
    // Refresca cada 60s para captar nuevas solicitudes sin recargar.
    const intervalo = setInterval(cargar, 60000);
    return () => { active = false; clearInterval(intervalo); };
  }, [role]);

  // Cierra el menú al hacer clic fuera.
  useEffect(() => {
    if (!openNotif) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setOpenNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openNotif]);

  const irA = (ruta: string) => {
    setOpenNotif(false);
    navigate(ruta);
  };

  return (
    <header className="h-20 bg-white border-b border-tp-gray-soft flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-tp-blue" />
        </button>

        <div className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tp-blue/40" />
            <input
              type="text"
              placeholder="Buscar tracking, cliente, destino..."
              className="w-full pl-10 pr-4 py-2.5 bg-tp-blue-light/30 border border-tp-gray-soft rounded-full focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 ml-4">
        {role !== 'cliente' && (
          <button
            onClick={() => navigate('/dashboard/recepcion')}
            className="hidden md:flex items-center gap-2 bg-tp-red hover:bg-[#D91F33] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar paquete
          </button>
        )}

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setOpenNotif(o => !o)}
            className="relative p-2 text-tp-blue/70 hover:text-tp-blue transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-6 h-6" />
            {role === 'admin' && totalPend > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-tp-red text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
                {totalPend > 9 ? '9+' : totalPend}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-tp-gray-soft overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-tp-gray-soft bg-gray-50/50">
                <h3 className="font-black text-tp-blue text-sm">Notificaciones</h3>
              </div>

              {role !== 'admin' ? (
                <div className="p-8 text-center">
                  <CheckCheck className="w-10 h-10 text-tp-blue/15 mx-auto mb-3" />
                  <p className="text-sm text-tp-blue/40 font-medium">No tienes notificaciones nuevas.</p>
                </div>
              ) : totalPend === 0 ? (
                <div className="p-8 text-center">
                  <CheckCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-tp-blue/50 font-bold">¡Todo al día!</p>
                  <p className="text-xs text-tp-blue/40 mt-1">No hay solicitudes pendientes.</p>
                </div>
              ) : (
                <div className="py-2">
                  {afiliadosPend > 0 && (
                    <button
                      onClick={() => irA('/dashboard/solicitudes-afiliados')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tp-blue-light/30 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-tp-red/10 text-tp-red flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-tp-blue">Altas de afiliados</p>
                        <p className="text-xs text-tp-blue/50">{afiliadosPend} solicitud{afiliadosPend === 1 ? '' : 'es'} de Agente/Influencer por revisar</p>
                      </div>
                      <span className="w-6 h-6 bg-tp-red text-white text-xs font-black rounded-full flex items-center justify-center shrink-0">{afiliadosPend}</span>
                    </button>
                  )}
                  {b2bPend > 0 && (
                    <button
                      onClick={() => irA('/dashboard/negocios?tab=solicitudes')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tp-blue-light/30 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-tp-blue/10 text-tp-blue flex items-center justify-center shrink-0">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-tp-blue">Solicitudes de la web</p>
                        <p className="text-xs text-tp-blue/50">{b2bPend} lead{b2bPend === 1 ? '' : 's'} de Partner/Franquicia/Punto sin atender</p>
                      </div>
                      <span className="w-6 h-6 bg-tp-blue text-white text-xs font-black rounded-full flex items-center justify-center shrink-0">{b2bPend}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-tp-gray-soft pl-6">
          <div className="w-10 h-10 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue font-bold">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-tp-blue leading-tight">{user?.displayName || 'Operador'}</p>
            <p className="text-xs text-tp-blue/60">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
