import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Users, TrendingUp, ShieldCheck, Zap, ArrowRight, 
  CheckCircle2, Star, Wallet, Globe, Smartphone,
  BarChart3, MessageSquare
} from 'lucide-react';

export function SerAgente() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      {/* Hero Section */}
      <header className="bg-tp-blue py-20 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
            <span className="w-2 h-2 bg-tp-red rounded-full animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider">Programa de Partners 2026</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Haz crecer tu negocio <br/>
            con <span className="text-tp-red">To Paquete</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            Únete a la plataforma logística líder para envíos a Cuba. No importa dónde estés: puedes trabajar con nosotros desde cualquier parte del mundo.
          </p>
          <div className="flex flex-wrap gap-4">
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
              >
                IR A MI DASHBOARD <ArrowRight className="w-6 h-6" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/unirse?tipo=agente')}
                className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
              >
                EMPEZAR AHORA <ArrowRight className="w-6 h-6" />
              </button>
            )}
            <a href="#modelos" className="bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all">
              VER COMISIONES
            </a>
          </div>
        </div>
      </header>

      {/* Modelos de Colaboración */}
      <section id="modelos" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Modelos de Negocio Diseñados para Ti</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Ya seas un emprendedor individual, un creador de contenido o una empresa establecida, tenemos una estructura de comisiones que maximiza tus ingresos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Agente Freelance",
              price: "Hasta 2.50€ por KG",
              desc: "Perfecto para quienes tienen una red de contactos en su ciudad. Gestionas la captación y nosotros la logística.",
              features: [
                "Panel de gestión de envíos",
                "App para la logística",
                "Soporte vía WhatsApp (opcional)",
                "Liquidación de comisiones semanal",
                "Herramientas de Marketing"
              ],
              color: "border-tp-blue",
              icon: <Users className="w-8 h-8 text-tp-blue" />
            },
            {
              title: "Influencer / Afiliado",
              price: "Comisión por Venta",
              desc: "Para quienes tienen presencia en redes sociales. Gana dinero recomendando To Paquete sin tocar un solo paquete.",
              features: [
                "Link de referido personalizado",
                "Código de descuento para fans",
                "Dashboard de Ganancia",
                "Pagos quincenales",
                "Cupon de envio"
              ],
              color: "border-tp-red",
              icon: <Star className="w-8 h-8 text-tp-red" />,
              popular: true
            },
            {
              title: "Paquete B2B para socios / Punto",
              price: "Tarifa Mayorista",
              desc: "Para negocios físicos (locutorios, agencias) que quieren convertirse en puntos oficiales de recogida.",
              features: [
                "Soporte técnico logístico",
                "Tarifas netas de mayorista",
                "Seguro de carga incluido",
                "Gestión de contenedores propios"
              ],
              color: "border-tp-blue",
              icon: <Globe className="w-8 h-8 text-tp-blue" />
            }
          ].map((plan, i) => (
            <div key={i} className={`bg-white p-8 rounded-[2.5rem] border-2 ${plan.color} relative shadow-sm hover:shadow-xl transition-all flex flex-col group`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-tp-red text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-bounce">
                  Más Popular
                </div>
              )}
              <div className="mb-6 transform group-hover:scale-110 transition-transform">{plan.icon}</div>
              <h3 className="text-2xl font-black text-tp-blue mb-2">{plan.title}</h3>
              <div className="text-tp-red font-black text-lg mb-4">{plan.price}</div>
              <p className="text-tp-blue/60 text-sm mb-8 leading-relaxed">{plan.desc}</p>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-bold text-tp-blue">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => {
                  if (plan.title === "Agente Freelance") navigate('/ser-agente-freelance');
                  else if (plan.title === "Influencer / Afiliado") navigate('/ser-influencer');
                  else if (plan.title === "Paquete B2B para socios / Punto") navigate('/ser-partner');
                  else navigate('/login?mode=register&role=agente');
                }}
                className={`w-full py-4 rounded-xl font-black transition-all shadow-lg ${plan.popular ? 'bg-tp-red text-white hover:bg-[#D91F33] shadow-tp-red/20' : 'bg-tp-blue text-white hover:bg-[#004a78] shadow-tp-blue/20'}`}
              >
                SABER MÁS
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="py-24 px-6 bg-tp-blue-light/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <ShieldCheck />, title: "Seguridad", desc: "Tus comisiones y los paquetes de tus clientes están 100% asegurados." },
              { icon: <Zap />, title: "Rapidez", desc: "Salidas semanales garantizadas. Los clientes más felices son los que repiten." },
              { icon: <Wallet />, title: "Rentabilidad", desc: "Las mejores tarifas del mercado para que tu margen sea el más alto." },
              { icon: <Globe />, title: "Alcance", desc: "Entregamos en todas las provincias de Cuba, sin excepción." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-tp-gray-soft hover:border-tp-red transition-colors">
                <div className="text-tp-red mb-4">{item.icon}</div>
                <h4 className="font-black text-tp-blue mb-2">{item.title}</h4>
                <p className="text-tp-blue/60 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Herramientas Tecnológicas */}
      <section className="py-24 px-6 bg-tp-blue text-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">
              Tecnología que <br/>
              <span className="text-tp-red">potencia tu trabajo</span>
            </h2>
            <div className="space-y-8">
              {[
                {
                  icon: <Smartphone className="w-6 h-6" />,
                  title: "App de Gestión",
                  desc: "Registra paquetes, escanea códigos y gestiona clientes desde tu móvil."
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Dashboard de Comisiones",
                  desc: "Control total de tus ganancias en tiempo real. Transparencia absoluta."
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Rastreo Automatizado",
                  desc: "Tus clientes reciben notificaciones automáticas de cada cambio de estado."
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
            <div className="bg-gradient-to-br from-tp-red to-tp-red/50 w-full aspect-square rounded-[3rem] p-1 shadow-2xl rotate-3">
              <div className="bg-tp-blue w-full h-full rounded-[2.8rem] overflow-hidden p-8">
                <div className="space-y-4">
                  <div className="h-8 w-3/4 bg-white/10 rounded-lg animate-pulse"></div>
                  <div className="h-32 w-full bg-white/5 rounded-2xl border border-white/10 p-4">
                    <div className="flex justify-between mb-4">
                      <div className="w-1/2 h-4 bg-white/20 rounded"></div>
                      <div className="w-1/4 h-4 bg-tp-red rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-white/10 rounded"></div>
                      <div className="w-full h-2 bg-white/10 rounded"></div>
                      <div className="w-2/3 h-2 bg-white/10 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white/5 rounded-xl border border-white/10"></div>
                    <div className="h-20 bg-white/5 rounded-xl border border-white/10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Agentes */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-tp-blue mb-12 text-center">Preguntas Frecuentes para Agentes</h2>
        <div className="space-y-6">
          {[
            {
              q: "¿Cómo recibo mis comisiones?",
              a: "Las comisiones se liquidan semanalmente a través de transferencia bancaria, Bizum o crédito en tu cuenta de agente para nuevos envíos."
            },
            {
              q: "¿Necesito una oficina física?",
              a: "No es obligatorio. Muchos de nuestros agentes freelance operan con recogida a domicilio. Los partners B2B sí suelen tener un punto de venta físico."
            },
            {
              q: "¿Quién pone los precios?",
              a: "To Paquete establece una tarifa base competitiva. Como agente, tienes margen para ajustar el precio final según el servicio adicional que ofrezcas (recogida, embalaje, etc.)."
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-tp-gray-soft">
              <h4 className="font-bold text-tp-blue mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-tp-red" />
                {item.q}
              </h4>
              <p className="text-tp-blue/60 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl">
          <h2 className="text-4xl font-black text-tp-blue mb-6">¿Listo para empezar?</h2>
          <p className="text-tp-blue/60 text-lg mb-10">Regístrate hoy y un asesor se pondrá en contacto contigo para activar tu cuenta de agente.</p>
          <button 
            onClick={() => navigate('/unirse?tipo=agente')}
            className="bg-tp-blue text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#004a78] transition-all shadow-xl shadow-tp-blue/20"
          >
            CREAR MI CUENTA DE AGENTE
          </button>
        </div>
      </section>
    </>
  );
}
