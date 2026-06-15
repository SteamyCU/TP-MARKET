import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Building2, Star, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';
import { Usuarios } from './Usuarios';
import { AdminB2B } from './AdminB2B';
import { ConfiguracionAfiliados } from './ConfiguracionAfiliados';
import { SolicitudesB2B } from './SolicitudesB2B';

type TabId = 'agentes' | 'b2b' | 'afiliados' | 'solicitudes';

export function Negocios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('agentes');

  // Permite abrir una pestaña concreta vía ?tab= (lo usa la campana de avisos).
  useEffect(() => {
    const tab = searchParams.get('tab') as TabId | null;
    if (tab && ['agentes', 'b2b', 'afiliados', 'solicitudes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const cambiarTab = (id: TabId) => {
    setActiveTab(id);
    if (searchParams.get('tab')) {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const tabs = [
    { id: 'agentes', label: 'Agentes Freelance', icon: Users, description: 'Gestión de agentes y sus oficinas' },
    { id: 'b2b', label: 'Partners B2B', icon: Building2, description: 'Directorio de socios y facturación' },
    { id: 'afiliados', label: 'Influencers / Afiliados', icon: Star, description: 'Configuración de niveles y comisiones' },
    { id: 'solicitudes', label: 'Solicitudes Web', icon: Inbox, description: 'Leads de Partner, Franquicia y Punto de Entrega' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-tp-blue">Gestión de Negocios</h1>
          <p className="text-tp-blue/60 text-sm mt-1">Administra todos los modelos de colaboración desde un solo lugar.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => cambiarTab(tab.id as TabId)}
            className={cn(
              "flex flex-col p-5 rounded-3xl border transition-all text-left group relative overflow-hidden",
              activeTab === tab.id
                ? "bg-tp-blue border-tp-blue shadow-xl shadow-tp-blue/20"
                : "bg-white border-tp-gray-soft hover:border-tp-blue/20"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
              activeTab === tab.id ? "bg-white/20 text-white" : "bg-tp-blue-light text-tp-blue"
            )}>
              <tab.icon className="w-6 h-6" />
            </div>
            <h3 className={cn(
              "font-black text-lg transition-colors",
              activeTab === tab.id ? "text-white" : "text-tp-blue"
            )}>
              {tab.label}
            </h3>
            <p className={cn(
              "text-xs font-medium mt-1 transition-colors",
              activeTab === tab.id ? "text-white/60" : "text-tp-blue/40"
            )}>
              {tab.description}
            </p>
            {activeTab === tab.id && (
              <div className="absolute top-4 right-4">
                <ChevronRight className="w-5 h-5 text-white/40" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'agentes' && <Usuarios />}
        {activeTab === 'b2b' && <AdminB2B />}
        {activeTab === 'afiliados' && <ConfiguracionAfiliados />}
        {activeTab === 'solicitudes' && <SolicitudesB2B />}
      </div>
    </div>
  );
}
