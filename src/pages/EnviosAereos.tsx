import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plane, ShieldCheck, Clock, ArrowRight, CheckCircle2, 
  ChevronDown, MessageSquare, MapPin, Package, Zap
} from 'lucide-react';

export function EnviosAereos() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Cuánto tarda un envío aéreo?",
      answer: "Nuestros envíos aéreos suelen tardar entre 3 y 7 días laborables en llegar a los destinos clave en Cuba, dependiendo de la provincia."
    },
    {
      question: "¿Hay límites de peso para envíos aéreos?",
      answer: "Sí, el límite estándar es de hasta 100kg por paquete. Para pesos superiores, recomendamos nuestro servicio de carga marítima o consultar con un asesor."
    },
    {
      question: "¿Incluye seguro mi paquete?",
      answer: "Sí, todos nuestros envíos aéreos incluyen un seguro de cobertura total contra pérdida o daños comprobados durante el tránsito."
    }
  ];

  return (
    <div className="bg-white">
      {/* SEO Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Envíos Aéreos a Cuba desde España",
          "description": "Servicio de transporte aéreo rápido y seguro para paquetes y documentos a Cuba con entrega garantizada.",
          "provider": {
            "@type": "Organization",
            "name": "To Paquete"
          },
          "areaServed": "Cuba",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios de Envío Aéreo",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Envío Aéreo Urgente"
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
            <Plane className="w-4 h-4 text-tp-red" />
            <span className="text-xs font-bold uppercase tracking-wider">Servicio Express Aéreo</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Envíos Aéreos Rápidos y <br/>
            <span className="text-tp-red">Seguros desde España</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            ¿Necesitas enviar urgentemente? Ofrecemos envíos aéreos con seguimiento 24/7, seguros incluidos y sin complicaciones aduanales. Cotiza ahora en menos de 2 minutos.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              COTIZAR ENVÍO AÉREO <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Ventajas */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Ventajas de Nuestros Envíos Aéreos</h2>
          <p className="text-tp-blue/60 text-lg">La rapidez que necesitas con la seguridad que mereces.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Clock />, title: "Rapidez Total", desc: "Entregas en 3-7 días a destinos clave en toda la isla." },
            { icon: <Package />, title: "Hasta 100kg", desc: "Capacidad para paquetes grandes con embalaje profesional." },
            { icon: <ShieldCheck />, title: "Seguro Incluido", desc: "Tu carga protegida al 100% desde el origen al destino." },
            { icon: <Zap />, title: "Seguimiento Real", desc: "Controla tu envío en tiempo real a través de nuestra app." }
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
          <h2 className="text-4xl font-black mb-16 text-center">Cómo Enviamos Tu Carga Aérea</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { step: "01", title: "Cotización", desc: "Online y gratuita en 2 min." },
              { step: "02", title: "Recogida", desc: "Directo en tu domicilio." },
              { step: "03", title: "Inspección", desc: "Embalaje profesional seguro." },
              { step: "04", title: "Vuelo", desc: "Aerolínea certificada directa." },
              { step: "05", title: "Entrega", desc: "Servicio puerta a puerta." }
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

      {/* Cobertura y Requisitos */}
      <section className="py-24 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <MapPin className="text-tp-red" /> Cobertura de Envíos
          </h2>
          <p className="text-tp-blue/70 mb-6 leading-relaxed">
            Operamos desde los principales centros logísticos de **Madrid, Barcelona y Valencia**. Nuestra red aérea conecta directamente con Cuba, cubriendo todas las provincias. Ideal para documentos, muestras comerciales y mercancía urgente.
          </p>
          <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
            <p className="text-tp-blue font-bold italic">"Llegó perfecto en solo 4 días. El seguimiento por la web me dio mucha tranquilidad."</p>
            <p className="text-tp-blue/50 text-sm mt-2">— Cliente satisfecho, Madrid</p>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-tp-blue mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-tp-red" /> Requisitos Técnicos
          </h2>
          <ul className="space-y-4">
            {[
              "Peso máximo por bulto: 100kg.",
              "Dimensiones máximas: Hasta 2 metros de largo.",
              "Documentación: Factura comercial o declaración de contenido.",
              "Packing List detallado para aduanas."
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
          <p className="text-white/70 text-lg mb-10">Solicita tu cotización personalizada ahora y asegura tu espacio en el próximo vuelo.</p>
          <button 
            onClick={() => navigate('/login?mode=register')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20"
          >
            SOLICITAR COTIZACIÓN
          </button>
          <div className="mt-8 flex justify-center gap-6 text-sm font-bold text-white/40">
            <Link to="/envios-maritimos" className="hover:text-tp-red transition-colors">Envíos Marítimos</Link>
            <span>|</span>
            <Link to="/carga-miscelanea" className="hover:text-tp-red transition-colors">Carga Miscelánea</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
