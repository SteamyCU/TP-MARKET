import React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { user, role } = useAuth();

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
            onClick={() => navigate('/recepcion')}
            className="hidden md:flex items-center gap-2 bg-tp-red hover:bg-[#D91F33] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar paquete
          </button>
        )}

        <button className="relative p-2 text-tp-blue/70 hover:text-tp-blue transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-tp-red rounded-full border-2 border-white"></span>
        </button>

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
