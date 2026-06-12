import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Ship, ShieldCheck, Clock, ArrowRight, CheckCircle2, 
  ChevronDown, MessageSquare, MapPin, Package, TrendingDown
} from 'lucide-react';

export function EnviosMaritimos() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Cuánto demora un envío marítimo?",
      answer: "Nuestros envíos marítimos suelen demorar entre 20 y 40 días laborables, dependiendo del puerto de origen y destino final."
    },
    {
      question: "¿Qué es LCL (Carga Consolidada)?",
      answer: "LCL significa 'Less than Container Load'. Es un servicio donde compartes espacio en un contenedor con otros clientes, lo que reduce drásticamente el costo para envíos que no llenan un contenedor completo."
    },
    {
      question: "¿Manejan los trámites de aduanas?",
      answer: "Sí, ofrecemos un servicio integral que incluye el despacho aduanero tanto en España como en Cuba, asegurando que tu carga cumpla con toda la normativa vigente."
    }
  ];

  return (
    <div className="bg-white">
      {/* SEO Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Envíos Marítimos a Cuba desde España",
          "description": "Servicio de transporte marítimo económico y seguro para carga pesada, mudanzas y contenedores a Cuba.",
          "provider": {
            "@type": "Organization",
            "name": "To Paquete"
          },
          "areaServed": "Cuba",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios de Envío Marítimo",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Carga Consolidada LCL"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Contenedor Completo FCL"
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
            <Ship className="w-4 h-4 text-tp-red" />
            <span className="text-xs font-bold uppercase tracking-wider">Carga Marítima Económica</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Envíos Marítimos <br/>
            <span className="text-tp-red">Económicos y Voluminosos</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            ¿Carga pesada o mudanzas? Ofrecemos envíos marítimos LCL/FCL con el mejor precio del mercado. Cotiza tu contenedor hoy mismo.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              COTIZAR ENVÍO MARÍTIMO <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Beneficios */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Por Qué Elegir Envíos Marítimos</h2>
          <p className="text-tp-blue/60 text-lg">La solución ideal para grandes volúmenes al menor costo.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <TrendingDown />, title: "Ahorro del 70%", desc: "La opción más económica comparada con el envío aéreo." },
            { icon: <Package />, title: "Hasta 20 Toneladas", desc: "Capacidad ilimitada para carga industrial o mudanzas." },
            { icon: <ShieldCheck />, title: "Consolidación", desc: "Paga solo por el espacio que usas con nuestro servicio LCL." },
            { icon: <CheckCircle2 />, title: "Puerta a Puerta", desc: "Nos encargamos de todo el trayecto hasta el destino final." }
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
          <h2 className="text-4xl font-black mb-16 text-center">Proceso de Envío Marítimo</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { step: "01", title: "Evaluación", desc: "Medimos volumen y peso." },
              { step: "02", title: "Cotización", desc: "Precio final garantizado." },
              { step: "03", title: "Consolidación", desc: "Recogida y carga segura." },
              { step: "04", title: "Embarque", desc: "Salida desde puerto principal." },
              { step: "05", title: "Entrega", desc: "Despacho y entrega final." }
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

      {/* Cobertura y Documentos */}
      <section className="py-24 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <MapPin className="text-tp-red" /> Rutas Marítimas Cubiertas
          </h2>
          <p className="text-tp-blue/70 mb-6 leading-relaxed">
            Conectamos España con los principales puertos de Cuba y el Caribe. Salidas regulares desde los puertos de **Valencia y Barcelona**. Ofrecemos soluciones logísticas para carga general, vehículos y mudanzas internacionales.
          </p>
          <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <p className="text-tp-blue font-bold italic">"Mudanza completa sin problemas. El equipo de To Paquete se encargó de todo el papeleo aduanal."</p>
            <p className="text-tp-blue/50 text-sm mt-2">— Usuario satisfecho, Valencia</p>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-tp-red" /> Documentos Necesarios
          </h2>
          <ul className="space-y-4">
            {[
              "Bill of Lading (Conocimiento de embarque).",
              "Certificado de origen de la mercancía.",
              "Declaración jurada de contenido.",
              "Factura comercial o valoración de aduanas."
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
          <h2 className="text-4xl font-black text-tp-blue mb-12 text-center">Preguntas Frecuentes</h2>
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
          <p className="text-white/70 text-lg mb-10">Cotiza tu envío marítimo hoy mismo y aprovecha nuestras tarifas preferenciales.</p>
          <button 
            onClick={() => navigate('/login?mode=register')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20"
          >
            COTIZAR AHORA
          </button>
          <div className="mt-8 flex justify-center gap-6 text-sm font-bold text-white/40">
            <Link to="/envios-aereos" className="hover:text-tp-red transition-colors">Envíos Aéreos</Link>
            <span>|</span>
            <Link to="/envio-electrodomesticos" className="hover:text-tp-red transition-colors">Electrodomésticos</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
