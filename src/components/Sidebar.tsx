import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Layers, 
  Truck, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Wallet,
  Search as SearchIcon,
  UserSquare2,
  Newspaper,
  Building2,
  Inbox,
  Send,
  Megaphone,
  Shield,
  UserPlus,
  Tag,
  Plane,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { logout } from '../supabase';
import { useAuth } from '../AuthContext';
import { subscribePagosPendientesCount } from '../services/pagos';
import { contarSolicitudesAfiliadoPendientes } from '../services/afiliados';
import { contarIncidenciasAbiertas } from '../services/incidencias';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, profile } = useAuth();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingAfiliados, setPendingAfiliados] = useState(0);
  const [incidenciasAbiertas, setIncidenciasAbiertas] = useState(0);

  useEffect(() => {
    if (role === 'admin') {
      const unsub = subscribePagosPendientesCount((count) => {
        setPendingPayments(count);
      });
      return () => unsub();
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'admin') return;
    let active = true;
    const cargar = () => {
      contarSolicitudesAfiliadoPendientes()
        .then(count => { if (active) setPendingAfiliados(count); })
        .catch(err => console.error('Error cargando solicitudes de afiliados:', err));
    };
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => { active = false; clearInterval(intervalo); };
  }, [role]);

  // Incidencias abiertas: visible para roles operativos (admin/agente/logística).
  useEffect(() => {
    if (!role || !['admin', 'agente', 'logistica'].includes(role)) return;
    let active = true;
    const cargar = () => {
      contarIncidenciasAbiertas()
        .then(count => { if (active) setIncidenciasAbiertas(count); })
        .catch(err => console.error('Error cargando incidencias abiertas:', err));
    };
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => { active = false; clearInterval(intervalo); };
  }, [role]);

  const adminItems = [
    { name: 'Dashboard Global', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Negocios', path: '/dashboard/negocios', icon: Building2 },
    {
      name: 'Solicitudes Afiliados',
      path: '/dashboard/solicitudes-afiliados',
      icon: UserPlus,
      badge: pendingAfiliados > 0 ? pendingAfiliados : null,
    },
    { name: 'Gestión Clientes', path: '/dashboard/clientes', icon: Users },
    { name: 'Marketing Clientes', path: '/dashboard/marketing', icon: Megaphone },
    { name: 'Solicitudes', path: '/dashboard/solicitudes', icon: Inbox },
    { 
      name: 'Contabilidad', 
      path: '/dashboard/contabilidad', 
      icon: Wallet,
      badge: pendingPayments > 0 ? pendingPayments : null
    },
    { name: 'Cobros y Pagos', path: '/dashboard/pagos', icon: Wallet },
    {
      name: 'Incidencias',
      path: '/dashboard/incidencias',
      icon: AlertTriangle,
      badge: incidenciasAbiertas > 0 ? incidenciasAbiertas : null,
    },
    { name: 'Cupones y Códigos', path: '/dashboard/cupones', icon: Tag },
    { name: 'Ofertas y Salidas', path: '/dashboard/ofertas', icon: BarChart3 },
    { name: 'Reportes Globales', path: '/dashboard/reportes', icon: BarChart3 },
    { name: 'Configuración', path: '/dashboard/configuracion', icon: Settings },
    { name: 'Auditoría', path: '/dashboard/auditoria', icon: Shield },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings },
  ];

  const agenteItems = [
    { name: 'Dashboard Operativo', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Recepción', path: '/dashboard/recepcion', icon: PackagePlus, badge: null },
    { name: 'Solicitudes', path: '/dashboard/solicitudes', icon: Inbox, badge: null },
    { name: 'Gestión Clientes', path: '/dashboard/clientes', icon: Users, badge: null },
    { name: 'Marketing Clientes', path: '/dashboard/marketing', icon: Megaphone, badge: null },
    { name: 'Contabilidad', path: '/dashboard/contabilidad', icon: Wallet, badge: null },
    { name: 'Cobros y Pagos', path: '/dashboard/pagos', icon: Wallet, badge: null },
    { name: 'Seguimiento', path: '/dashboard/seguimiento', icon: SearchIcon, badge: null },
    { name: 'Logística', path: '/dashboard/logistica', icon: Truck, badge: null },
    { name: 'Mis Comisiones', path: '/dashboard/comisiones', icon: Wallet, badge: null },
    { name: 'Ofertas y Salidas', path: '/dashboard/ofertas', icon: BarChart3, badge: null },
    { name: 'Incidencias', path: '/dashboard/incidencias', icon: AlertTriangle, badge: incidenciasAbiertas > 0 ? incidenciasAbiertas : null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const clienteItems = [
    { name: 'Mis Paquetes', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Solicitar Envío', path: '/dashboard/mis-solicitudes', icon: Send, badge: null },
    { name: 'Mis Destinatarios', path: '/dashboard/mis-destinatarios', icon: Users, badge: null },
    { name: 'Calculadora', path: '/dashboard/calculadora', icon: LayoutDashboard, badge: null },
    { name: 'Seguimiento', path: '/dashboard/seguimiento', icon: SearchIcon, badge: null },
    { name: 'Ofertas y Salidas', path: '/dashboard/ofertas', icon: BarChart3, badge: null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const influencerItems = [
    { name: 'Dashboard Influencer', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Mis Ganancias', path: '/dashboard/comisiones', icon: Wallet, badge: null },
    { name: 'Ofertas y Salidas', path: '/dashboard/ofertas', icon: BarChart3, badge: null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const partnerItems = [
    { name: 'Dashboard Partner', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Logística B2B', path: '/dashboard/logistica', icon: Truck, badge: null },
    { name: 'Contabilidad', path: '/dashboard/contabilidad', icon: Wallet, badge: null },
    { name: 'Ofertas y Salidas', path: '/dashboard/ofertas', icon: BarChart3, badge: null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const contabilidadItems = [
    { name: 'Contabilidad', path: '/dashboard/contabilidad', icon: Wallet, badge: null },
    { name: 'Cobros y Pagos', path: '/dashboard/pagos', icon: Wallet, badge: null },
    { name: 'Reportes', path: '/dashboard/reportes', icon: BarChart3, badge: null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const logisticaItems = [
    { name: 'Recepción', path: '/dashboard/recepcion', icon: PackagePlus, badge: null },
    { name: 'Logística', path: '/dashboard/logistica', icon: Truck, badge: null },
    { name: 'Incidencias', path: '/dashboard/incidencias', icon: AlertTriangle, badge: incidenciasAbiertas > 0 ? incidenciasAbiertas : null },
    { name: 'Seguimiento', path: '/dashboard/seguimiento', icon: SearchIcon, badge: null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const puntoPackItems = [
    { name: 'Dashboard Punto Pack', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Paquetes en Custodia', path: '/dashboard/logistica', icon: PackagePlus, badge: null },
    { name: 'Mis Ganancias', path: '/dashboard/contabilidad', icon: Wallet, badge: null },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: Settings, badge: null },
  ];

  const baseNavItems = role === 'admin' ? adminItems :
                   role === 'agente' ? agenteItems :
                   role === 'influencer' ? influencerItems :
                   role === 'partner' ? (profile?.tipoColaborador === 'punto_pack' ? puntoPackItems : partnerItems) :
                   role === 'contabilidad' ? contabilidadItems :
                   role === 'logistica' ? logisticaItems :
                   clienteItems;

  // "Kilos Disponibles" (Programa de Viajeros) es visible para cualquier rol
  // autenticado. Se inserta antes de "Mi Perfil" para mantenerlo agrupado al final.
  const viajerosItem = { name: 'Kilos Disponibles', path: '/dashboard/kilos-disponibles', icon: Plane, badge: null };
  const perfilIdx = baseNavItems.findIndex((item) => item.path === '/dashboard/perfil');
  const navItems = perfilIdx === -1
    ? [...baseNavItems, viajerosItem]
    : [...baseNavItems.slice(0, perfilIdx), viajerosItem, ...baseNavItems.slice(perfilIdx)];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 w-[280px] bg-white border-r border-tp-gray-soft flex flex-col z-40 transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-tp-gray-soft">
        <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="text-3xl font-black italic tracking-tighter flex">
            <span className="text-tp-blue">T</span>
            <span className="text-tp-red">P</span>
          </div>
          <span className="font-bold text-tp-blue text-xl ml-2">To Paquete</span>
        </NavLink>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-tp-blue" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-medium group",
                isActive 
                  ? "bg-tp-blue-light text-tp-blue" 
                  : "text-tp-blue/70 hover:bg-tp-blue-light/50 hover:text-tp-blue"
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {item.name}
            </div>
            {item.badge && (
              <span className="bg-tp-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Area */}
      <div className="p-4 border-t border-tp-gray-soft">
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-tp-blue/70 hover:text-tp-red px-4 py-2 w-full transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
