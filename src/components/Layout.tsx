import React, { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cargarConfigNegocio } from '../services/paquetes';

const Chatbot = React.lazy(() => import('./Chatbot').then((m) => ({ default: m.Chatbot })));

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Carga la configuración del negocio una vez (datos de empresa para
  // documentos, tarifas, catálogos logísticos...)
  useEffect(() => {
    cargarConfigNegocio();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-tp-blue/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-[280px]">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-4 md:p-8 relative">
          <Outlet />
        </main>
      </div>
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </div>
  );
}
