import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, Package, ArrowRight, Plane, ShieldCheck, Clock, 
  Ship, HelpCircle, ChevronDown, CheckCircle2, Users, 
  TrendingUp, Star, Quote, Facebook, Instagram, Twitter, 
  Mail, Phone, MapPin, Globe, UserPlus, Newspaper, Zap
} from 'lucide-react';

const faqs = [
  {
    question: "¿Cuánto tarda en llegar un paquete a Cuba?",
    answer: "Los envíos aéreos suelen tardar entre 7 y 15 días hábiles. Los envíos marítimos tienen un tiempo estimado de entrega de 30 a 45 días, dependiendo de la provincia de destino."
  },
  {
    question: "¿Hay un límite de kilos para enviar?",
    answer: "No, en To Paquete no tenemos límites de envío. Puedes enviar la cantidad de kilos que necesites, independientemente del volumen, nosotros gestionamos toda la logística."
  },
  {
    question: "¿Tengo que pagar algo extra al recibir en Cuba?",
    answer: "No. A diferencia de otras agencias, en To Paquete cubrimos los gastos de gestión en Cuba para que tus familiares no tengan que pagar costos extra al recibir su paquete."
  },
  {
    question: "¿Qué artículos están prohibidos enviar a Cuba?",
    answer: "Está prohibido enviar armas, drogas, material pornográfico, dinero en efectivo, explosivos, y ciertos equipos de comunicación satelital. Consulta nuestra lista detallada antes de enviar."
  },
  {
    question: "¿Cómo se calcula el costo del envío?",
    answer: "El costo se calcula en base al peso (por kilogramo) y el tipo de artículo. El rango de precios varía según el agente asignado, pero siempre garantizamos las tarifas más competitivas del mercado."
  },
  {
    question: "¿Puedo enviar medicinas a Cuba?",
    answer: "Sí, puedes enviar medicinas. Actualmente, los envíos de medicamentos, aseo y alimentos están exentos de aranceles aduanales hasta cierto límite de peso."
  },
  {
    question: "¿Ofrecen servicio de recogida a domicilio?",
    answer: "Sí, contamos con una amplia red de agentes que pueden recoger tus paquetes directamente en tu domicilio. Contáctanos para verificar la disponibilidad en tu área."
  },
  {
    question: "¿Cómo puedo rastrear mi envío?",
    answer: "Una vez registrado tu paquete, recibirás un número de seguimiento. Puedes ingresarlo en nuestra plataforma web en la sección 'Seguimiento' para ver su estado 24/7."
  },
  {
    question: "¿Qué pasa si mi paquete se pierde o daña?",
    answer: "Todos nuestros envíos viajan asegurados. En el raro caso de pérdida o daño comprobado, ofrecemos una compensación basada en el valor declarado del paquete."
  },
  {
    question: "¿Cómo puedo convertirme en agente de To Paquete?",
    answer: "Estamos en constante crecimiento y buscamos nuevos agentes. Si tienes experiencia en logística o quieres emprender con nosotros, regístrate como 'Agente' o contáctanos directamente."
  }
];

const testimonials = [
  {
    name: "María Rodríguez",
    location: "Madrid",
    text: "Excelente servicio. Mis medicinas llegaron a La Habana en solo 10 días y mi familia no tuvo que pagar nada extra al recogerlas. Muy recomendado.",
    stars: 5
  },
  {
    name: "Juan Carlos Pérez",
    location: "Barcelona",
    text: "He enviado varios bultos grandes por vía marítima y todo llegó perfecto. Lo mejor es que no hay límite de kilos, pude enviar todo lo que necesitaba de una vez.",
    stars: 5
  },
  {
    name: "Elena García",
    location: "Valencia",
    text: "Como agente, la plataforma de To Paquete me facilita mucho el trabajo. Los clientes están felices con el rastreo en tiempo real y la seguridad de sus envíos.",
    stars: 5
  }
];

export function Landing() {
  const navigate = useNavigate();
  const [calcPeso, setCalcPeso] = useState(5);
  const [calcDestino, setCalcDestino] = useState('La Habana');
  const [calcTipo, setCalcTipo] = useState('Normal');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const precioPorKilo = 5.00; // Default public price

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Envíos a Cuba - To Paquete Logística",
    "serviceType": "Logística y Paquetería",
    "provider": {
      "@type": "Organization",
      "name": "To Paquete Logística"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Cuba"
    },
    "description": "Servicios de envío marítimo y aéreo a Cuba con entregas seguras, sin límites de peso y sin costos extra en destino."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      {/* Hero Section with Calculator */}
      <header id="calculadora" className="bg-gradient-to-br from-tp-blue to-[#003355] py-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-tp-red rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
              <span className="w-2 h-2 bg-tp-red rounded-full animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Próxima salida: Viernes 10 de Abril</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-[1.1]">
              Envíos a Cuba <br/>
              <span className="text-tp-red">Sin Límites</span>
            </h1>
            <p className="text-white/80 text-xl mb-10 max-w-lg leading-relaxed">
              Envía todos los kilos que necesites. <span className="text-white font-bold underline decoration-tp-red decoration-2 underline-offset-4">Sin costos extra en Cuba</span> y con entrega garantizada en todas las provincias.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-tp-red">+15,000</span>
                <span className="text-sm text-white/60 font-bold uppercase tracking-tighter">Kilos enviados/mes</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-tp-red">100%</span>
                <span className="text-sm text-white/60 font-bold uppercase tracking-tighter">Gastos cubiertos en Cuba</span>
              </div>
            </div>
          </div>

          {/* Calculator Card */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-2xl relative border border-white/20">
            <div className="absolute -top-6 -right-6 bg-tp-red text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl rotate-12">
              <Calculator className="w-8 h-8" />
            </div>
            <h3 className="font-black text-3xl text-tp-blue mb-2">Calculadora</h3>
            <p className="text-tp-blue/50 text-sm mb-8">Obtén un presupuesto estimado al instante.</p>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest">Peso del Envío</label>
                  <span className="text-tp-blue font-black text-lg">{calcPeso} kg</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="100" step="0.5"
                  value={calcPeso}
                  onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                  className="w-full h-2 bg-tp-gray-soft rounded-lg appearance-none cursor-pointer accent-tp-red"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-tp-blue/30 uppercase">
                  <span>1 kg</span>
                  <span>50 kg</span>
                  <span>Sin límite</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-tp-blue/40 uppercase tracking-widest mb-2">Provincia Destino</label>
                  <select 
                    value={calcDestino}
                    onChange={(e) => setCalcDestino(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold text-tp-blue appearance-none"
                  >
                    <option value="La Habana">La Habana</option>
                    <option value="Santiago de Cuba">Santiago de Cuba</option>
                    <option value="Matanzas">Matanzas</option>
                    <option value="Holguín">Holguín</option>
                    <option value="Otras Provincias">Otras Provincias</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-tp-blue/40 uppercase tracking-widest mb-2">Tipo de Carga</label>
                  <select 
                    value={calcTipo}
                    onChange={(e) => setCalcTipo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold text-tp-blue appearance-none"
                  >
                    <option value="Normal">Miscelánea</option>
                    <option value="Bateria">Baterías / Motores</option>
                    <option value="Movil">Equipos Electrónicos</option>
                    <option value="Medicinas">Medicinas (Exento)</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 border-t border-tp-gray-soft">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-tp-blue/40 text-xs font-black uppercase tracking-widest">Costo Estimado</span>
                    <span className="text-tp-blue/60 text-[10px] font-bold">*Sujeto a tarifa de agente</span>
                  </div>
                  <div className="text-5xl font-black text-tp-blue tracking-tighter">
                    €{(calcPeso * precioPorKilo).toFixed(2)}
                  </div>
                </div>
                <button onClick={() => navigate('/login?mode=register')} className="w-full bg-tp-red text-white py-5 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-lg shadow-tp-red/20 flex items-center justify-center gap-3 group">
                  CREAR MI ENVÍO <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Banner */}
      <div className="bg-white border-y border-tp-gray-soft py-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic"><span className="text-tp-blue">ADUANA</span><span className="text-tp-red">CUBA</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic"><span className="text-tp-blue">CARGO</span><span className="text-tp-red">LOGISTICS</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic"><span className="text-tp-blue">TRANS</span><span className="text-tp-red">CARIBE</span></div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic"><span className="text-tp-blue">MAR</span><span className="text-tp-red">EXPRESS</span></div>
          </div>
        </div>
      </div>


      {/* Testimonials */}
      <section className="py-24 px-6 bg-tp-blue text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-tp-red/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black mb-4">Lo que dicen <br/>nuestros clientes</h2>
              <p className="text-white/60 text-lg">Más de 5,000 familias confían en nosotros mensualmente.</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
              <Star className="w-6 h-6 text-tp-red fill-tp-red" />
              <span className="text-2xl font-black">4.9/5</span>
              <span className="text-white/40 font-bold text-sm ml-2">Calificación media</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 flex flex-col">
                <Quote className="w-10 h-10 text-tp-red mb-6 opacity-50" />
                <p className="text-lg italic mb-8 flex-1 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tp-red rounded-full flex items-center justify-center font-black text-xl">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Recruitment */}
      <section id="agentes" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="bg-tp-blue rounded-[3rem] p-10 lg:p-20 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Oportunidad de Negocio</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">Emprende con <br/><span className="text-tp-red">To Paquete</span></h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Únete a la red de logística con mayor crecimiento. Ya seas un emprendedor individual, un influencer o una empresa establecida, tenemos un modelo de negocio para ti.
            </p>
            <button 
              onClick={() => navigate('/ser-agente')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2 w-fit"
            >
              EMPEZAR AHORA <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          {/* Image side removed for better grid space or kept if layout allows */}
          <div className="hidden lg:block flex-1 relative z-10">
            <div className="bg-white/5 backdrop-blur-md w-full aspect-square rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800" 
                alt="Agente To Paquete" 
                className="w-full h-full object-cover opacity-40"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tp-blue via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-tp-red fill-tp-red" />
                  <span className="text-xs font-bold uppercase tracking-widest">Agente Destacado</span>
                </div>
                <p className="text-xl font-black italic">"Empecé con 5 clientes y hoy gestiono más de 200 envíos mensuales. To Paquete cambió mi vida."</p>
                <p className="mt-4 font-bold text-white/60">— Carlos M., Agente en Miami</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate CTA Section */}
      <section className="py-24 px-6 bg-tp-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tp-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-md border border-white/10">
            <Zap className="w-4 h-4 text-tp-red" />
            Oportunidad de Negocio
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Gana dinero con <span className="text-tp-red italic">To Paquete</span>
          </h2>
          <p className="text-xl text-white/70 mb-12 font-medium max-w-2xl mx-auto">
            Únete a nuestra red como Agente o Influencer y empieza a generar ingresos por cada kilo que envíen tus clientes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/unirse')}
              className="w-full sm:w-auto bg-tp-red text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-[#d42a2a] transition-all shadow-xl shadow-tp-red/20 flex items-center justify-center gap-3 group"
            >
              Quiero ser Agente o Influencer
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/unirse')}
              className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all backdrop-blur-md"
            >
              Saber más
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-white border-t border-tp-gray-soft">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-tp-blue-light rounded-3xl flex items-center justify-center mx-auto mb-6 text-tp-blue rotate-3">
              <HelpCircle className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-tp-blue mb-4">Preguntas Frecuentes</h2>
            <p className="text-tp-blue/60 text-lg">Resolvemos todas tus dudas sobre envíos, aduanas y pagos.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-tp-gray-soft rounded-3xl overflow-hidden transition-all hover:border-tp-blue/20">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
                >
                  <h3 className="font-black text-tp-blue pr-8">{faq.question}</h3>
                  <ChevronDown className={`w-6 h-6 text-tp-blue/30 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-tp-red' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="p-8 bg-white border-t border-tp-gray-soft animate-in slide-in-from-top-4 duration-300">
                    <p className="text-tp-blue/70 leading-relaxed text-lg">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
