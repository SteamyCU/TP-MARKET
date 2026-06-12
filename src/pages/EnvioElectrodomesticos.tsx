import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Tv, ShieldCheck, Clock, ArrowRight, CheckCircle2, 
  ChevronDown, MessageSquare, MapPin, Package, Zap, Wrench
} from 'lucide-react';

export function EnvioElectrodomesticos() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Qué protección ofrecen contra el voltaje?",
      answer: "Nuestros expertos te asesoran sobre la compatibilidad de voltaje en el destino y te recomiendan los mejores reguladores o transformadores si fueran necesarios."
    },
    {
      question: "¿Cuál es el tiempo estimado de entrega?",
      answer: "Para electrodomésticos grandes, solemos utilizar envío marítimo prioritario, con un tiempo estimado de entre 25 y 35 días laborables."
    },
    {
      question: "¿Están cubiertos los daños al 100%?",
      answer: "Sí, contamos con un seguro especializado para electrodomésticos que cubre el valor total declarado del equipo en caso de daños accidentales durante el transporte."
    }
  ];

  return (
    <div className="bg-white">
      {/* SEO Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Envío de Electrodomésticos a Cuba desde España",
          "description": "Transporte especializado de electrodomésticos (televisores, neveras, lavadoras) con protección anti-golpes y seguro total.",
          "provider": {
            "@type": "Organization",
            "name": "To Paquete"
          },
          "areaServed": "Cuba",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios de Envío de Electrodomésticos",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Transporte de Línea Blanca"
                }
              }
            ]
          }
        })}
      </script>

      {/* Hero Section */}
      <header className="bg-tp-blue py-24 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
            <Tv className="w-4 h-4 text-tp-red" />
            <span className="text-xs font-bold uppercase tracking-wider">Transporte Especializado</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Envío Seguro de <br/>
            <span className="text-tp-red">Electrodomésticos</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            ¿Televisores, lavadoras, neveras? Ofrecemos transporte especializado con protección anti-golpes y seguro total. Cotiza tu envío ahora.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              COTIZAR ELECTRODOMÉSTICOS <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Beneficios */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Por Qué Somos Expertos</h2>
          <p className="text-tp-blue/60 text-lg">Cuidamos tus equipos como si fueran nuestros.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <ShieldCheck />, title: "Embalaje Pro", desc: "Cajas reforzadas y protección interna anti-impacto." },
            { icon: <CheckCircle2 />, title: "Seguro Total", desc: "Cobertura del 100% contra daños accidentales." },
            { icon: <Package />, title: "Hasta 200kg", desc: "Capacidad para equipos industriales o de gran tamaño." },
            { icon: <Zap />, title: "Manejo Cuidadoso", desc: "Personal capacitado en manipulación de carga frágil." }
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-8 rounded-3xl border border-tp-gray-soft hover:border-tp-red transition-colors group">
              <div className="text-tp-red mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="font-black text-tp-blue mb-2">{item.title}</h4>
              <p className="text-tp-blue/60 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proceso */}
      <section className="py-24 px-6 bg-tp-blue text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-16 text-center">Paso a Paso del Envío</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { step: "01", title: "Inspección", desc: "Revisamos el estado del equipo." },
              { step: "02", title: "Desmontaje", desc: "Si es necesario para el transporte." },
              { step: "03", title: "Embalaje", desc: "Caja reforzada y protección." },
              { step: "04", title: "Embarque", desc: "Salida marítima prioritaria." },
              { step: "05", title: "Instalación", desc: "Opcional en el destino final." }
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="text-5xl font-black text-white/10 mb-4">{item.step}</div>
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qué Aceptamos y Requisitos */}
      <section className="py-24 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <Tv className="text-tp-red" /> Electrodomésticos Aceptados
          </h2>
          <p className="text-tp-blue/70 mb-6 leading-relaxed">
            Transportamos todo tipo de equipos para el hogar y negocio: **Línea blanca (neveras, lavadoras, aires acondicionados), equipos de audio/video (TVs, sistemas de sonido) y pequeños electrodomésticos**.
          </p>
          <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <p className="text-tp-blue font-bold italic">"Mi nevera llegó impecable y funcionando perfectamente. El embalaje era realmente profesional."</p>
            <p className="text-tp-blue/50 text-sm mt-2">— Usuario satisfecho, Madrid</p>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <ShieldCheck className="text-tp-red" /> Lo Que Necesitas Preparar
          </h2>
          <ul className="space-y-4">
            {[
              "Manual de usuario y garantía del fabricante.",
              "Verificación de voltaje compatible con el destino.",
              "Limpieza y vaciado total de equipos de refrigeración.",
              "Protección de partes móviles internas."
            ].map((req, i) => (
              <li key={i} className="flex items-center gap-3 font-bold text-tp-blue/80">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-gray-50 border-t border-tp-gray-soft">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-tp-blue mb-12 text-center">Dudas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-tp-gray-soft rounded-3xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className="font-black text-tp-blue">{faq.question}</h3>
                  <ChevronDown className={`w-6 h-6 text-tp-blue/30 transition-transform ${openFaq === index ? 'rotate-180 text-tp-red' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="p-8 border-t border-tp-gray-soft animate-in slide-in-from-top-2">
                    <p className="text-tp-blue/70 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-tp-blue p-12 rounded-[3rem] text-white shadow-2xl">
          <h2 className="text-4xl font-black mb-6">¿Listo para enviar?</h2>
          <p className="text-white/70 text-lg mb-10">Asegura el transporte de tus equipos con los expertos. Cotiza ahora sin compromiso.</p>
          <button 
            onClick={() => navigate('/login?mode=register')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20"
          >
            COTIZAR AHORA
          </button>
          <div className="mt-8 flex justify-center gap-6 text-sm font-bold text-white/40">
            <Link to="/envios-maritimos" className="hover:text-tp-red transition-colors">Envíos Marítimos</Link>
            <span>|</span>
            <Link to="/cobertura" className="hover:text-tp-red transition-colors">Cobertura</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
