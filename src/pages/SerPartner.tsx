import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, ShieldCheck, Zap, ArrowRight, ArrowLeft,
  CheckCircle2, Globe, Building2,
  BarChart3, MessageSquare, Briefcase, PackageCheck, MapPin
} from 'lucide-react';

export function SerPartner() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero Section */}
      <header className="bg-tp-blue py-20 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <button 
            onClick={() => navigate('/ser-agente')}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver a Modelos de Negocio
          </button>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
            <span className="w-2 h-2 bg-tp-red rounded-full animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider">Programa Partner B2B 2026</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Convierte tu negocio <br/>
            en un <span className="text-tp-red">Punto Pack</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            Si tienes un local físico o una empresa de servicios, únete a nuestra red logística. Ofrece envíos a Cuba con tarifas de mayorista y soporte técnico especializado.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register&role=partner')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              SOLICITAR ALTA B2B <ArrowRight className="w-6 h-6" />
            </button>
            <a href="#ventajas" className="bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all">
              VER VENTAJAS
            </a>
          </div>
        </div>
      </header>

      {/* Tipos de Partner */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Dos Formas de Colaborar</h2>
            <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Elige el modelo que mejor se adapte a tu estructura actual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-tp-gray-soft shadow-sm hover:border-tp-blue/30 transition-all">
              <div className="w-16 h-16 bg-tp-blue/10 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-tp-blue" />
              </div>
              <h3 className="text-2xl font-black text-tp-blue mb-4 text-center">Empresa B2B / Mayorista</h3>
              <p className="text-tp-blue/60 mb-6 text-center">Ideal para agencias de viajes, tiendas online o empresas con gran volumen de carga propia.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-tp-blue/70"><CheckCircle2 className="w-4 h-4 text-green-500" /> Integración vía API</li>
                <li className="flex items-center gap-2 text-sm text-tp-blue/70"><CheckCircle2 className="w-4 h-4 text-green-500" /> Facturación mensual</li>
                <li className="flex items-center gap-2 text-sm text-tp-blue/70"><CheckCircle2 className="w-4 h-4 text-green-500" /> Gestión de contenedores</li>
              </ul>
              <button 
                onClick={() => navigate('/login?mode=register&role=partner')}
                className="w-full bg-tp-blue text-white py-4 rounded-2xl font-bold hover:bg-[#004a78] transition-all"
              >
                ALTA B2B MAYORISTA
              </button>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-tp-gray-soft shadow-sm hover:border-tp-red/30 transition-all">
              <div className="w-16 h-16 bg-tp-red/10 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-tp-red" />
              </div>
              <h3 className="text-2xl font-black text-tp-blue mb-4 text-center">Punto Pack / Entrega</h3>
              <p className="text-tp-blue/60 mb-6 text-center">Para locales físicos que quieren ser punto de recepción y entrega de paquetes.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-tp-blue/70"><CheckCircle2 className="w-4 h-4 text-green-500" /> Gana por paquete gestionado</li>
                <li className="flex items-center gap-2 text-sm text-tp-blue/70"><CheckCircle2 className="w-4 h-4 text-green-500" /> Atrae nuevos clientes a tu local</li>
                <li className="flex items-center gap-2 text-sm text-tp-blue/70"><CheckCircle2 className="w-4 h-4 text-green-500" /> App de escaneo incluida</li>
              </ul>
              <button 
                onClick={() => navigate('/login?mode=register&role=partner')}
                className="w-full bg-tp-red text-white py-4 rounded-2xl font-bold hover:bg-[#D91F33] transition-all"
              >
                SER PUNTO PACK OFICIAL
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ventajas Partner */}
      <section id="ventajas" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Ventajas de ser Partner B2B</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Infraestructura y tarifas diseñadas para el crecimiento de tu negocio físico o agencia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Tarifas Netas",
              desc: "Accede a precios de mayorista para que puedas ofrecer el mejor precio final a tus clientes.",
              icon: <Briefcase className="w-8 h-8 text-tp-red" />
            },
            {
              title: "Seguro de Carga",
              desc: "Toda tu carga está 100% asegurada desde la recepción hasta la entrega final en Cuba.",
              icon: <ShieldCheck className="w-8 h-8 text-tp-blue" />
            },
            {
              title: "Gestión de Lotes",
              desc: "Herramientas avanzadas para gestionar grandes volúmenes de carga y contenedores propios.",
              icon: <PackageCheck className="w-8 h-8 text-tp-red" />
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-sm hover:shadow-xl transition-all group">
              <div className="mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-2xl font-black text-tp-blue mb-2">{item.title}</h3>
              <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Soporte Logístico */}
      <section className="py-24 px-6 bg-tp-blue text-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">
              Soporte técnico <br/>
              <span className="text-tp-red">y logístico 24/7</span>
            </h2>
            <div className="space-y-8">
              {[
                {
                  icon: <Truck className="w-6 h-6" />,
                  title: "Recogida Prioritaria",
                  desc: "Servicio de recogida de carga pesada para partners con grandes volúmenes."
                },
                {
                  icon: <Globe className="w-6 h-6" />,
                  title: "Gestión Aduanal",
                  desc: "Nos encargamos de toda la documentación y trámites aduanales en origen y destino."
                },
                {
                  icon: <Building2 className="w-6 h-6" />,
                  title: "Material de Tienda",
                  desc: "Te enviamos cartelería, pegatinas y material corporativo para tu local físico."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-tp-blue to-tp-blue/50 w-full aspect-square rounded-[3rem] p-1 shadow-2xl rotate-3">
              <div className="bg-white w-full h-full rounded-[2.8rem] overflow-hidden p-8 flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="w-32 h-32 text-tp-blue mb-6 mx-auto" />
                  <div className="text-tp-blue font-black text-2xl">PUNTO OFICIAL</div>
                  <div className="text-tp-red font-bold">TO PAQUETE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl">
          <h2 className="text-4xl font-black text-tp-blue mb-6">¿Hablamos de Negocios?</h2>
          <p className="text-tp-blue/60 text-lg mb-10">Regístrate como Partner B2B y un gestor de cuentas corporativas te contactará.</p>
          <button 
            onClick={() => navigate('/login?mode=register&role=partner')}
            className="bg-tp-blue text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#004a78] transition-all shadow-xl shadow-tp-blue/20"
          >
            SOLICITAR ALTA PARTNER B2B
          </button>
        </div>
      </section>
    </>
  );
}
