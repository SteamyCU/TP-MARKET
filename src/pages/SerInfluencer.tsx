import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Zap, ArrowRight, ArrowLeft,
  CheckCircle2, Star, Wallet, Globe, Smartphone,
  BarChart3, MessageSquare, Share2, Users, Gift, Shield, Crown, Trophy
} from 'lucide-react';

export function SerInfluencer() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero Section */}
      <header className="bg-tp-blue pt-32 pb-20 px-6 relative overflow-hidden text-white min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/10 blur-[100px] rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <button 
              onClick={() => navigate('/ser-agente')}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Volver a Modelos de Negocio
            </button>
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
              <span className="w-2 h-2 bg-tp-red rounded-full animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Programa de Afiliados 2026</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
              Monetiza tu audiencia <br/>
              con <span className="text-tp-red">To Paquete</span>
            </h1>
            <p className="text-white/80 text-xl mb-10 max-w-xl leading-relaxed">
              Gana comisiones recurrentes recomendando el servicio de envíos a Cuba más confiable. No importa dónde estés: puedes trabajar con nosotros desde cualquier parte del mundo.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/unirse?tipo=influencer')}
                className="bg-tp-red text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
              >
                UNIRME AL PROGRAMA <ArrowRight className="w-6 h-6" />
              </button>
              <a href="#beneficios" className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all">
                VER BENEFICIOS
              </a>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-tp-red/20 to-transparent rounded-full blur-3xl"></div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl relative">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider mb-1">Ganancias Estimadas</div>
                  <div className="text-4xl font-black text-white">€1,250<span className="text-xl text-white/50">/mes</span></div>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: "Comisiones directas", value: "€850", color: "bg-tp-red" },
                  { label: "Bono por volumen", value: "€150", color: "bg-blue-400" },
                  { label: "Red de sub-afiliados", value: "€250", color: "bg-purple-400" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                      <span className="text-white/80 font-medium">{stat.label}</span>
                    </div>
                    <span className="text-white font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Beneficios Influencer */}
      <section id="beneficios" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">¿Por qué ser Influencer de To Paquete?</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Te damos todas las herramientas para que recomiendes con éxito y ganes dinero de forma recurrente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Comisión Directa",
              desc: "Gana un porcentaje de cada envío realizado a través de tu enlace o código de referido.",
              icon: <Wallet className="w-8 h-8 text-tp-red" />
            },
            {
              title: "Cupones Exclusivos",
              desc: "Ofrece descuentos especiales a tus seguidores para aumentar tu tasa de conversión.",
              icon: <Gift className="w-8 h-8 text-tp-blue" />
            },
            {
              title: "Dashboard Real-time",
              desc: "Controla tus clics, registros y ganancias acumuladas en tiempo real desde tu panel.",
              icon: <BarChart3 className="w-8 h-8 text-tp-red" />
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

      {/* Educational Diagram Section */}
      <section className="py-24 px-6 bg-tp-blue-light/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-tp-blue mb-4">¿Cómo funciona la red de sub-afiliados?</h2>
            <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Entiende cómo puedes multiplicar tus ganancias invitando a otros a unirse al programa.</p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-tp-gray-soft overflow-hidden relative">
            {/* Diagram Container */}
            <div className="max-w-4xl mx-auto relative">
              
              {/* Top Node */}
              <div className="flex justify-center mb-16 relative z-10">
                <div className="bg-tp-blue text-white px-8 py-4 rounded-xl text-center shadow-lg">
                  <h4 className="font-bold text-lg">Empresa logística</h4>
                  <p className="text-sm text-white/70">Gestiona todo el sistema</p>
                </div>
              </div>

              {/* Lines from Top to Affiliates */}
              <svg className="absolute top-16 left-0 w-full h-32 z-0 hidden md:block" preserveAspectRatio="none">
                <path d="M 50% 0 L 25% 100%" stroke="#D91F33" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                <path d="M 50% 0 L 75% 100%" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              </svg>

              {/* Affiliates Level */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 mb-16 relative z-10">
                {/* María */}
                <div className="bg-tp-red text-white px-8 py-4 rounded-xl text-center shadow-lg w-full md:w-72 relative">
                  <h4 className="font-bold text-lg">María — Élite</h4>
                  <p className="text-sm text-white/80">Afiliada principal</p>
                  <p className="text-sm font-bold mt-1 bg-white/20 py-1 rounded-lg">Comisión 10% + 2% sub</p>
                  
                  {/* Arrow down to clients */}
                  <div className="hidden md:block absolute -bottom-16 left-1/2 w-0.5 h-16 bg-tp-red"></div>
                  <div className="hidden md:block absolute -bottom-16 left-1/2 w-2 h-2 border-b-2 border-r-2 border-tp-red transform rotate-45 -translate-x-[3px]"></div>
                </div>

                {/* Text between */}
                <div className="text-tp-blue/60 text-sm text-center px-4 py-4 md:py-0 font-medium">
                  Carlos se registró usando el link de María
                </div>

                {/* Carlos */}
                <div className="bg-white border-2 border-tp-blue/20 text-tp-blue px-8 py-4 rounded-xl text-center shadow-lg w-full md:w-72 relative">
                  <h4 className="font-bold text-lg">Carlos — Bronce</h4>
                  <p className="text-sm text-tp-blue/60">Sub-afiliado de María</p>
                  <p className="text-sm font-bold mt-1 bg-tp-blue/5 py-1 rounded-lg">Comisión propia 3%</p>

                  {/* Arrow down to clients */}
                  <div className="hidden md:block absolute -bottom-16 left-1/2 w-0.5 h-16 bg-tp-blue/20"></div>
                  <div className="hidden md:block absolute -bottom-16 left-1/2 w-2 h-2 border-b-2 border-r-2 border-tp-blue/20 transform rotate-45 -translate-x-[3px]"></div>
                </div>
              </div>

              {/* Clients Level */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 mb-16 relative z-10">
                {/* Clientes de María */}
                <div className="bg-gray-50 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-center shadow-sm w-full md:w-72">
                  <h4 className="font-bold text-lg text-tp-blue">Clientes de María</h4>
                  <p className="text-sm text-gray-500">Captados directamente</p>
                </div>

                {/* Arrow from Carlos's clients to María */}
                <div className="hidden md:flex items-center justify-center flex-1 relative">
                  <div className="w-full h-0.5 bg-tp-red relative">
                    <div className="absolute -top-1 left-0 w-2 h-2 border-b-2 border-l-2 border-tp-red transform rotate-45"></div>
                  </div>
                  <div className="absolute -top-6 text-tp-red text-sm font-bold bg-white px-3 py-1 rounded-full border border-tp-red/20 shadow-sm">2% a María</div>
                </div>

                {/* Clientes de Carlos */}
                <div className="bg-gray-50 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-center shadow-sm w-full md:w-72">
                  <h4 className="font-bold text-lg text-tp-blue">Clientes de Carlos</h4>
                  <p className="text-sm text-gray-500">Captados por el sub</p>
                </div>
              </div>

              {/* Example Box */}
              <div className="border border-tp-blue/10 rounded-2xl p-6 md:p-8 relative z-10 bg-tp-blue-light/5">
                <h5 className="text-tp-blue text-center mb-6 font-bold">Ejemplo con un envío de 10€ del cliente de Carlos</h5>
                
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
                  <div className="bg-white border border-gray-200 text-gray-700 px-6 py-4 rounded-xl text-center w-full md:w-auto shadow-sm">
                    <h4 className="font-bold text-tp-blue">Cliente envía</h4>
                    <p className="text-sm text-gray-500">Paga 10€<br/>a la empresa</p>
                  </div>

                  <div className="hidden md:block text-gray-400">→</div>

                  <div className="bg-white border-2 border-tp-blue/20 text-tp-blue px-6 py-4 rounded-xl text-center w-full md:w-auto shadow-sm">
                    <h4 className="font-bold">Carlos recibe</h4>
                    <p className="text-sm text-tp-blue/60">3% → 0,30€<br/>su comisión</p>
                  </div>

                  <div className="hidden md:block text-tp-red font-bold">→</div>

                  <div className="bg-tp-red text-white px-6 py-4 rounded-xl text-center w-full md:w-auto shadow-md">
                    <h4 className="font-bold">María recibe</h4>
                    <p className="text-sm text-white/90">2% sobre los 0,30€<br/>de Carlos = 0,006€<br/>por cada envío</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Tiers de Influencer */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Niveles de Crecimiento</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">A medida que tu comunidad crece y genera más volumen, tus beneficios se multiplican.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              tier: "Bronce",
              range: "0 - 50 kg/mes",
              commission: "3%",
              bono: "5€",
              sub: "0%",
              benefits: ["Link de referido", "Dashboard básico", "Retiro min. 30€"],
              color: "bg-orange-100 text-orange-800 border-orange-200",
              icon: <Star className="w-6 h-6 text-orange-500" />
            },
            {
              tier: "Plata",
              range: "51 - 200 kg/mes",
              commission: "5%",
              bono: "20€",
              sub: "1%",
              benefits: ["Cupones personalizados", "Comisión por sub-afiliados", "Retiro min. 50€"],
              color: "bg-gray-100 text-gray-800 border-gray-200",
              icon: <Shield className="w-6 h-6 text-gray-500" />
            },
            {
              tier: "Oro",
              range: "201 - 500 kg/mes",
              commission: "7%",
              bono: "60€",
              sub: "1.5%",
              benefits: ["Soporte prioritario", "Material de marca", "Retiro min. 100€"],
              color: "bg-yellow-100 text-yellow-800 border-yellow-200",
              popular: true,
              icon: <Trophy className="w-6 h-6 text-yellow-500" />
            },
            {
              tier: "Élite",
              range: "+501 kg/mes",
              commission: "10%",
              bono: "150€",
              sub: "2%",
              benefits: ["Gestor personal", "Acceso a eventos VIP", "Retiros sin mínimo"],
              color: "bg-tp-red/10 text-tp-red border-tp-red/20",
              icon: <Crown className="w-6 h-6 text-tp-red" />
            }
          ].map((item, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border-2 flex flex-col ${item.popular ? 'border-tp-red shadow-xl scale-105 relative z-10 bg-white' : 'border-tp-gray-soft bg-white hover:border-tp-blue/30 transition-all'}`}>
              {item.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-tp-red text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  MÁS POPULAR
                </div>
              )}
              <div className="flex justify-between items-start mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${item.color}`}>
                  {item.icon}
                  {item.tier}
                </div>
              </div>
              
              <div className="mb-6 space-y-2">
                <div className="text-xs text-tp-blue/50 font-bold uppercase tracking-wider">Volumen requerido</div>
                <div className="text-xl font-black text-tp-blue">{item.range}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                <div>
                  <div className="text-[10px] text-tp-blue/50 font-bold uppercase">Comisión</div>
                  <div className="text-2xl font-black text-tp-blue">{item.commission}</div>
                </div>
                <div>
                  <div className="text-[10px] text-tp-blue/50 font-bold uppercase">Bono Fijo</div>
                  <div className="text-2xl font-black text-tp-red">{item.bono}</div>
                </div>
                <div className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                  <div className="text-[10px] text-tp-blue/50 font-bold uppercase">Sub-afiliados</div>
                  <div className="text-lg font-black text-tp-blue">{item.sub}</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {item.benefits.map((benefit, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-tp-blue/70 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/login?mode=register&role=influencer')}
                className={`w-full py-3.5 rounded-xl font-black text-sm transition-all ${item.popular ? 'bg-tp-red text-white hover:bg-[#D91F33]' : 'bg-tp-blue-light/20 text-tp-blue hover:bg-tp-blue hover:text-white'}`}
              >
                EMPEZAR EN {item.tier.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-24 px-6 bg-tp-blue-light/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-tp-blue mb-16 text-center">Cómo Funciona el Programa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-tp-blue/10 -translate-y-1/2 z-0"></div>
            {[
              { step: "1", title: "Regístrate", desc: "Crea tu cuenta de influencer en menos de 2 minutos." },
              { step: "2", title: "Comparte", desc: "Usa tu link o código en tus redes (Instagram, TikTok, YouTube)." },
              { step: "3", title: "Gana", desc: "Recibe tus comisiones automáticamente cada quincena." }
            ].map((item, i) => (
              <div key={i} className="relative z-10 text-center">
                <div className="w-16 h-16 bg-tp-red text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg shadow-tp-red/20">
                  {item.step}
                </div>
                <h4 className="text-xl font-black text-tp-blue mb-2">{item.title}</h4>
                <p className="text-tp-blue/60 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Preguntas Frecuentes</h2>
          <p className="text-tp-blue/60 text-lg">Todo lo que necesitas saber sobre nuestro programa de afiliados.</p>
        </div>
        
        <div className="space-y-4">
          {[
            {
              q: "¿Tiene algún costo unirse al programa?",
              a: "No, unirse al programa de influencers de To Paquete es 100% gratuito. No hay cuotas mensuales ni costos ocultos."
            },
            {
              q: "¿Cómo y cuándo recibo mis pagos?",
              a: "Los pagos se realizan mediante transferencia bancaria, Zelle o saldo en la plataforma. Dependiendo de tu nivel, puedes retirar tus ganancias de forma mensual, quincenal o semanal, siempre que alcances el mínimo de retiro de tu nivel."
            },
            {
              q: "¿Qué pasa si un cliente que invité hace un envío meses después?",
              a: "¡Sigues ganando! Nuestro sistema guarda la relación. Si un cliente se registró con tu enlace, ganarás comisión por TODOS los envíos que realice en el futuro, no solo el primero."
            },
            {
              q: "¿Cómo funciona exactamente la comisión por sub-afiliados?",
              a: "Si invitas a otro influencer a unirse al programa usando tu enlace, tú ganarás un porcentaje adicional sobre las comisiones que él genere, sin afectar sus ganancias. Es una forma excelente de crear ingresos pasivos."
            }
          ].map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm hover:border-tp-blue/20 transition-colors">
              <h4 className="text-lg font-bold text-tp-blue mb-2 flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-tp-red shrink-0 mt-0.5" />
                {faq.q}
              </h4>
              <p className="text-tp-blue/70 text-sm leading-relaxed pl-8">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl">
          <h2 className="text-4xl font-black text-tp-blue mb-6">¿Listo para monetizar?</h2>
          <p className="text-tp-blue/60 text-lg mb-10">Únete a la red de influencers que ya están ganando con To Paquete.</p>
          <button 
            onClick={() => navigate('/unirse?tipo=influencer')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20"
          >
            ACTIVAR MI CUENTA DE INFLUENCER
          </button>
        </div>
      </section>
    </>
  );
}
