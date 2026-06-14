import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, ShieldCheck, Clock, ArrowRight, CheckCircle2, 
  ChevronDown, MessageSquare, MapPin, List, ShoppingBag
} from 'lucide-react';

export function CargaMiscelanea() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Cuántos items puedo incluir en un envío?",
      answer: "Puedes incluir tantos items como desees siempre que no excedan el peso máximo de 50kg por bulto consolidado y cumplan con las restricciones de aduanas."
    },
    {
      question: "¿Cuánto tiempo tarda en llegar?",
      answer: "Dependiendo de si eliges envío aéreo o marítimo, el tiempo puede variar entre 7 y 15 días laborables para carga miscelánea consolidada."
    },
    {
      question: "¿Está incluido el seguro?",
      answer: "Sí, todos nuestros envíos de miscelánea cuentan con un seguro base incluido que protege tu mercancía contra pérdida total o daños graves durante el transporte."
    }
  ];

  return (
    <div className="bg-white">
      {/* SEO Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Envío de Carga Miscelánea a Cuba",
          "description": "Servicio de consolidación de carga miscelánea (ropa, calzado, regalos) para envíos seguros y económicos a Cuba.",
          "provider": {
            "@type": "Organization",
            "name": "To Paquete"
          },
          "areaServed": "Cuba",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios de Carga Miscelánea",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Consolidación de Paquetes"
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
            <ShoppingBag className="w-4 h-4 text-tp-red" />
            <span className="text-xs font-bold uppercase tracking-wider">Todo en un solo envío</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Carga Miscelánea: <br/>
            <span className="text-tp-red">Todo en un Solo Envío</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            ¿Ropa, regalos, accesorios? Consolidamos tu carga miscelánea con total seguridad y al mejor precio por kilo. Cotiza fácil y rápido.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              COTIZAR MISCELÁNEA <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Beneficios */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Beneficios de Carga Miscelánea</h2>
          <p className="text-tp-blue/60 text-lg">La forma más sencilla de enviar pequeños bultos consolidados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Package />, title: "Precio por KG", desc: "Tarifas competitivas que se ajustan a tu presupuesto." },
            { icon: <CheckCircle2 />, title: "Hasta 50kg", desc: "Consolidamos tus bultos para optimizar el espacio." },
            { icon: <ShieldCheck />, title: "Empaque Individual", desc: "Cada item es tratado con el máximo cuidado." },
            { icon: <Clock />, title: "Sin Mínimos", desc: "Envía lo que necesites, sin restricciones de volumen mínimo." }
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
          <h2 className="text-4xl font-black mb-16 text-center">Cómo Funciona el Servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { step: "01", title: "Lista de Items", desc: "Envíanos el detalle de tu carga." },
              { step: "02", title: "Recogida", desc: "Pasamos por tu domicilio." },
              { step: "03", title: "Clasificación", desc: "Embalamos cada item de forma segura." },
              { step: "04", title: "Envío", desc: "Tú eliges: aéreo o marítimo." },
              { step: "05", title: "Seguimiento", desc: "Control total unificado." }
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
            <ShoppingBag className="text-tp-red" /> Items Permitidos
          </h2>
          <p className="text-tp-blue/70 mb-6 leading-relaxed">
            Aceptamos una amplia variedad de artículos de uso personal y del hogar: **ropa, calzado, libros, juguetes, artículos de aseo y pequeños accesorios**. 
          </p>
          <div className="bg-tp-red/5 p-6 rounded-2xl border border-tp-red/10">
            <p className="text-tp-red font-bold">⚠️ Prohibidos:</p>
            <p className="text-tp-blue/70 text-sm mt-1">Artículos perecederos, baterías sueltas, líquidos inflamables y mercancía peligrosa.</p>
          </div>
          <div className="mt-8 bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <p className="text-tp-blue font-bold italic">"Perfecto para enviar regalos a mi familia. El empaque llegó impecable."</p>
            <p className="text-tp-blue/50 text-sm mt-2">— Cliente satisfecha, Barcelona</p>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <List className="text-tp-red" /> Requisitos de Preparación
          </h2>
          <ul className="space-y-4">
            {[
              "Lista detallada de todos los items incluidos.",
              "Empaque original si es posible para mayor protección.",
              "Declaración de valor para el seguro.",
              "Identificación clara de bultos frágiles."
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
          <h2 className="text-4xl font-black text-tp-blue mb-12 text-center">Preguntas Comunes</h2>
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
          <h2 className="text-4xl font-black mb-6">¿Empezamos tu envío?</h2>
          <p className="text-white/70 text-lg mb-10">Consolida tus compras y regalos en un solo paquete y ahorra en costos de envío.</p>
          <button 
            onClick={() => navigate('/login?mode=register')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20"
          >
            EMPEZAR COTIZACIÓN
          </button>
          <div className="mt-8 flex justify-center gap-6 text-sm font-bold text-white/40">
            <Link to="/medicinas-exentas" className="hover:text-tp-red transition-colors">Medicinas Exentas</Link>
            <span>|</span>
            <Link to="/#faq" className="hover:text-tp-red transition-colors">Cómo Funciona</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
