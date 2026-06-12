import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, ShieldCheck, Clock, ArrowRight, CheckCircle2, 
  ChevronDown, MessageSquare, MapPin, FileText, Activity
} from 'lucide-react';

export function MedicinasExentas() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Qué medicinas se pueden enviar?",
      answer: "Se pueden enviar medicamentos autorizados que estén exentos de aranceles según la normativa aduanera vigente. No se permiten narcóticos ni sustancias controladas."
    },
    {
      question: "¿Ofrecen cadena de frío?",
      answer: "Sí, disponemos de servicios especializados con cadena de frío para medicamentos que requieran refrigeración constante durante todo el trayecto."
    },
    {
      question: "¿Cuánto tiempo tarda la entrega?",
      answer: "Al ser una carga prioritaria, los envíos de medicinas suelen tardar entre 5 y 10 días laborables, dependiendo de la urgencia y el destino."
    }
  ];

  return (
    <div className="bg-white">
      {/* SEO Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Envío de Medicinas Exentas a Cuba",
          "description": "Servicio de transporte seguro y legal de medicamentos exentos a Cuba con cumplimiento total de normativa aduanera.",
          "provider": {
            "@type": "Organization",
            "name": "To Paquete"
          },
          "areaServed": "Cuba",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios de Envío de Medicinas",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Transporte de Medicamentos"
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
            <Heart className="w-4 h-4 text-tp-red" />
            <span className="text-xs font-bold uppercase tracking-wider">Carga Prioritaria Médica</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Envío de Medicinas Exentas y <br/>
            <span className="text-tp-red">Cumplimiento Total</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            ¿Medicamentos autorizados? Ofrecemos envíos seguros con toda la documentación aduanera necesaria. Confía en los expertos en logística médica.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              COTIZAR MEDICINAS <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Beneficios */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Ventajas Especializadas</h2>
          <p className="text-tp-blue/60 text-lg">Seguridad y legalidad en cada envío de salud.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <ShieldCheck />, title: "Cumplimiento", desc: "Aseguramos que tu envío cumpla con toda la normativa legal." },
            { icon: <Activity />, title: "Cadena de Frío", desc: "Equipamiento especial para medicamentos refrigerados." },
            { icon: <FileText />, title: "Documentos Listos", desc: "Nos encargamos de toda la gestión aduanera médica." },
            { icon: <Clock />, title: "Trazabilidad", desc: "Seguimiento constante de tu envío prioritario." }
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
          <h2 className="text-4xl font-black mb-16 text-center">Procedimiento Seguro</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Verificación", desc: "Comprobamos la exención del medicamento." },
              { step: "02", title: "Empaque", desc: "Embalaje farmacéutico especializado." },
              { step: "03", title: "Envío Aéreo", desc: "Transporte prioritario de alta velocidad." },
              { step: "04", title: "Despacho", desc: "Trámite aduanero especializado." }
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
            <Activity className="text-tp-red" /> Medicinas Aceptadas
          </h2>
          <p className="text-tp-blue/70 mb-6 leading-relaxed">
            Aceptamos medicamentos recetados que estén exentos de aranceles por la aduana, suplementos vitamínicos y productos de farmacia de venta libre autorizados. 
          </p>
          <div className="bg-tp-red/5 p-6 rounded-2xl border border-tp-red/10">
            <p className="text-tp-red font-bold">⚠️ Importante:</p>
            <p className="text-tp-blue/70 text-sm mt-1">No se permite el envío de narcóticos, psicotrópicos o sustancias controladas sin permisos especiales.</p>
          </div>
          <div className="mt-8 bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <p className="text-tp-blue font-bold italic">"Proceso impecable y rápido. Mi madre recibió sus medicinas en menos de una semana."</p>
            <p className="text-tp-blue/50 text-sm mt-2">— Cliente satisfecho, Farmacéutico</p>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <FileText className="text-tp-red" /> Documentación Obligatoria
          </h2>
          <ul className="space-y-4">
            {[
              "Prescripción médica original o copia legible.",
              "Certificado de exención si aplica.",
              "Etiquetado original y claro de los medicamentos.",
              "Declaración de contenido para aduanas."
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
          <h2 className="text-4xl font-black text-tp-blue mb-12 text-center">Preguntas Clave</h2>
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
          <h2 className="text-4xl font-black mb-6">¿Necesitas asesoría?</h2>
          <p className="text-white/70 text-lg mb-10">Consulta con nuestros expertos sobre el envío de tus medicamentos y asegura su llegada.</p>
          <button 
            onClick={() => navigate('/login?mode=register')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20"
          >
            CONSULTAR AHORA
          </button>
          <div className="mt-8 flex justify-center gap-6 text-sm font-bold text-white/40">
            <Link to="/envios-aereos" className="hover:text-tp-red transition-colors">Envíos Aéreos</Link>
            <span>|</span>
            <Link to="/sobre-nosotros" className="hover:text-tp-red transition-colors">Sobre Nosotros</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
