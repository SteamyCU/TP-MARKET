import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Facebook, Instagram, Mail, Phone, MapPin, Globe, ChevronDown
} from 'lucide-react';
import { SoporteWidget } from './SoporteWidget';

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-tp-red/20 selection:text-tp-red">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-tp-gray-soft px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="text-3xl font-black italic tracking-tighter flex">
            <span className="text-tp-blue">T</span>
            <span className="text-tp-red">P</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-tp-blue text-lg">TO PAQUETE</span>
            <span className="text-[10px] font-bold text-tp-red tracking-widest uppercase">Logística Cuba</span>
          </div>
        </button>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-tp-blue/70">
            <button onClick={() => navigate('/#calculadora')} className="hover:text-tp-red transition-colors">Calculadora</button>
            <button onClick={() => navigate('/#faq')} className="hover:text-tp-red transition-colors">FAQ</button>
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-tp-red transition-colors">
                Negocio <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute right-0 top-full pt-3 hidden group-hover:block">
                <div className="bg-white rounded-2xl shadow-xl border border-tp-gray-soft py-2 w-60">
                  {[
                    { label: 'Modelos de Negocio', path: '/ser-agente' },
                    { label: 'Partner Logístico', path: '/ser-partner' },
                    { label: 'Franquicia', path: '/franquicia' },
                    { label: 'Punto de Entrega', path: '/punto-de-entrega' },
                    { label: 'Influencer', path: '/ser-influencer' },
                    { label: 'Únete como Agente', path: '/unirse' },
                  ].map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="block w-full text-left px-5 py-2.5 text-tp-blue/70 hover:text-tp-red hover:bg-gray-50 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login?mode=login')} className="text-tp-blue font-bold hover:text-tp-red transition-colors text-sm px-4 py-2">
              Entrar
            </button>
            <button onClick={() => navigate('/login?mode=register')} className="bg-tp-blue text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#004a78] transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
              Empezar
            </button>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      <SoporteWidget />

      {/* Footer */}
      <footer className="bg-white border-t border-tp-gray-soft pt-20 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="text-4xl font-black italic tracking-tighter flex">
                  <span className="text-tp-blue">T</span>
                  <span className="text-tp-red">P</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-black text-tp-blue text-xl">TO PAQUETE</span>
                  <span className="text-[10px] font-bold text-tp-red tracking-widest uppercase">Logística Cuba</span>
                </div>
              </div>
              <p className="text-tp-blue/60 leading-relaxed font-medium">
                Líderes en logística de envíos a Cuba. Seguridad, rapidez y transparencia en cada paquete. Sin límites de envío y sin costos sorpresa.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/share/1BBPpRQF71/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-tp-blue-light rounded-xl flex items-center justify-center text-tp-blue hover:bg-tp-blue hover:text-white transition-all"><Facebook className="w-5 h-5" /></a>
                <a href="https://www.instagram.com/topaquete_?utm_source=qr&igsh=MXh2YmphN25waGIwZA==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-tp-blue-light rounded-xl flex items-center justify-center text-tp-blue hover:bg-tp-blue hover:text-white transition-all"><Instagram className="w-5 h-5" /></a>
                <a href="https://www.tiktok.com/@topaquete?_r=1&_t=ZN-95IUkvb131a" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-tp-blue-light rounded-xl flex items-center justify-center text-tp-blue hover:bg-tp-blue hover:text-white transition-all"><TiktokIcon className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black text-tp-blue uppercase tracking-widest text-sm mb-8">Servicios</h4>
              <ul className="space-y-4 font-bold text-tp-blue/60">
                <li><button onClick={() => navigate('/envios-aereos')} className="hover:text-tp-red transition-colors">Envíos Aéreos</button></li>
                <li><button onClick={() => navigate('/envios-maritimos')} className="hover:text-tp-red transition-colors">Envíos Marítimos</button></li>
                <li><button onClick={() => navigate('/carga-miscelanea')} className="hover:text-tp-red transition-colors">Carga de Miscelánea</button></li>
                <li><button onClick={() => navigate('/envio-electrodomesticos')} className="hover:text-tp-red transition-colors">Envío de Electrodomésticos</button></li>
                <li><button onClick={() => navigate('/medicinas-exentas')} className="hover:text-tp-red transition-colors">Medicinas Exentas</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-tp-blue uppercase tracking-widest text-sm mb-8">Compañía</h4>
              <ul className="space-y-4 font-bold text-tp-blue/60">
                <li><button onClick={() => navigate('/sobre-nosotros')} className="hover:text-tp-red transition-colors">Sobre Nosotros</button></li>
                <li><button onClick={() => navigate('/unirse')} className="hover:text-tp-red transition-colors">Nuestros Agentes</button></li>
                <li><button onClick={() => navigate('/terminos-condiciones')} className="hover:text-tp-red transition-colors">Términos y Condiciones</button></li>
                <li><button onClick={() => navigate('/politica-privacidad')} className="hover:text-tp-red transition-colors">Política de Privacidad</button></li>
                <li><button onClick={() => navigate('/unirse')} className="hover:text-tp-red transition-colors">Trabaja con nosotros</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-tp-blue uppercase tracking-widest text-sm mb-8">Contacto</h4>
              <ul className="space-y-4 font-bold text-tp-blue/60">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-tp-red shrink-0" />
                  <span>+34 633364373</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-tp-red shrink-0" />
                  <span>info@topaquete.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-tp-red shrink-0" />
                  <span>www.topaquete.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-tp-gray-soft pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-tp-blue/40 text-sm font-bold">
              © 2026 To Paquete Logística. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs font-black text-tp-blue/30 uppercase tracking-widest">
              <button onClick={() => navigate('/politica-privacidad')} className="hover:text-tp-red transition-colors">Privacidad</button>
              <button onClick={() => navigate('/politica-privacidad#cookies')} className="hover:text-tp-red transition-colors">Cookies</button>
              <button onClick={() => navigate('/terminos-condiciones')} className="hover:text-tp-red transition-colors">Legal</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
