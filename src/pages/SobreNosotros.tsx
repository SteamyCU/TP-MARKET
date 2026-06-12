import React from 'react';
import { ShieldCheck, Globe, Users, Clock, CheckCircle2, Award, Heart, Zap } from 'lucide-react';

export function SobreNosotros() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-24 px-6 bg-tp-blue overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
            <span className="w-2 h-2 bg-tp-red rounded-full animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider">Nuestra Historia</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight">
            Más que logística, <br/>
            un <span className="text-tp-red">puente</span> entre familias
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-3xl leading-relaxed">
            En To Paquete no solo movemos cajas, movemos soluciones para familias y empresas. Con más de 15 años de experiencia, nos hemos consolidado como el puente logístico más fiable entre España y todas las provincias de Cuba.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Kilos Enviados", value: "+500k" },
              { label: "Familias Felices", value: "+20k" },
              { label: "Años de Experiencia", value: "15+" },
              { label: "Provincias Cubiertas", value: "16/16" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-3xl font-black text-tp-red">{stat.value}</span>
                <span className="text-xs text-white/60 font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-tp-blue leading-tight">Nuestra Misión: <br/><span className="text-tp-red">Acortar distancias</span></h2>
            <p className="text-tp-blue/60 text-lg leading-relaxed">
              Nacimos con la convicción de que enviar un paquete a Cuba no debería ser un proceso estresante ni costoso. Nuestra misión es proporcionar un servicio de logística integral que garantice que cada envío llegue a su destino con la máxima seguridad y en el menor tiempo posible.
            </p>
            <div className="space-y-4">
              {[
                "Transparencia total en precios y procesos.",
                "Seguridad garantizada en cada bulto.",
                "Atención personalizada a través de nuestra red de agentes.",
                "Compromiso social con la comunidad cubana en España."
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-tp-blue">
                  <CheckCircle2 className="w-5 h-5 text-tp-red" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-tp-blue-light/30 rounded-[3rem] aspect-square p-8">
              <img 
                src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800" 
                alt="Logística To Paquete" 
                className="w-full h-full object-cover rounded-[2rem] shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-xl border border-tp-gray-soft max-w-xs hidden md:block">
              <Award className="w-10 h-10 text-tp-red mb-4" />
              <p className="text-tp-blue font-bold italic">"Líderes en el corredor logístico España-Cuba por 5 años consecutivos."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Nuestros Valores</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Lo que nos define y guía cada una de nuestras decisiones.</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <ShieldCheck />, title: "Confianza", desc: "Cumplimos lo que prometemos. Tu tranquilidad es nuestra prioridad." },
            { icon: <Heart />, title: "Empatía", desc: "Entendemos el valor sentimental de cada paquete que enviamos." },
            { icon: <Zap />, title: "Innovación", desc: "Usamos tecnología de punta para optimizar rutas y seguimientos." },
            { icon: <Globe />, title: "Alcance", desc: "Llegamos donde otros no llegan, en cada rincón de la isla." }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-tp-gray-soft hover:border-tp-red transition-all group">
              <div className="text-tp-red mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="text-xl font-black text-tp-blue mb-2">{item.title}</h4>
              <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* El Equipo */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-tp-blue mb-6">Un equipo <br/><span className="text-tp-red">comprometido</span></h2>
            <p className="text-tp-blue/60 text-lg leading-relaxed mb-8">
              Contamos con un equipo multidisciplinar de expertos en logística, aduanas y atención al cliente. Nuestra red de agentes en toda España es el corazón de To Paquete, permitiéndonos ofrecer un servicio cercano y humano.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-tp-blue-light/20 rounded-2xl border border-tp-blue/5">
                <Users className="w-8 h-8 text-tp-blue mb-4" />
                <h4 className="font-black text-tp-blue">Red de Agentes</h4>
                <p className="text-xs text-tp-blue/50 font-bold uppercase tracking-widest mt-1">+200 Agentes</p>
              </div>
              <div className="p-6 bg-tp-blue-light/20 rounded-2xl border border-tp-blue/5">
                <Clock className="w-8 h-8 text-tp-blue mb-4" />
                <h4 className="font-black text-tp-blue">Soporte 24/7</h4>
                <p className="text-xs text-tp-blue/50 font-bold uppercase tracking-widest mt-1">Atención Continua</p>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400" className="rounded-3xl aspect-square object-cover" referrerPolicy="no-referrer" />
            <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=400" className="rounded-3xl aspect-square object-cover mt-8" referrerPolicy="no-referrer" />
          </div>
        </div>
      </section>
    </div>
  );
}
