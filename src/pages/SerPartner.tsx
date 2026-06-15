import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Send, Loader2,
  Plane, Globe, Phone, Boxes, Users, Briefcase,
  Wallet, Truck, LayoutDashboard, Code2, FileCheck, Headphones,
  Package, CalendarClock, Zap, MapPin,
} from 'lucide-react';
import { crearContactoPartner } from '../services/contactosPartners';

const FORM_INICIAL = {
  nombre: '',
  empresa: '',
  email: '',
  telefono: '',
  tipo_negocio: '',
  volumen_estimado: '',
  tiene_local: '',
  mensaje: '',
};

export function SerPartner() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await crearContactoPartner({
        nombre: form.nombre.trim(),
        empresa: form.empresa.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        tipo_negocio: form.tipo_negocio || undefined,
        volumen_estimado: form.volumen_estimado || undefined,
        tiene_local: form.tiene_local === '' ? null : form.tiene_local === 'si',
        mensaje: form.mensaje.trim() || undefined,
      });
      setEnviado(true);
      setForm(FORM_INICIAL);
    } catch (err) {
      console.error('Error enviando solicitud de partner:', err);
      setError('No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.');
    } finally {
      setEnviando(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-medium text-tp-blue";
  const labelClass = "block text-xs font-black text-tp-blue/50 uppercase tracking-widest mb-2";

  return (
    <>
      {/* SECCIÓN 1 — Hero */}
      <header className="bg-tp-blue pt-32 pb-20 px-6 relative overflow-hidden text-white">
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
              <span className="text-xs font-bold uppercase tracking-wider">Programa Partner Logístico 2026</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
              Usa nuestra logística. <br/>
              <span className="text-tp-red">Mantén tu marca.</span>
            </h1>
            <p className="text-white/80 text-xl mb-10 max-w-xl leading-relaxed">
              Accede a la infraestructura de envíos a Cuba más sólida del mercado. Tú gestionas tus clientes, nosotros nos encargamos de todo lo demás.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="bg-tp-red text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
              >
                SOLICITAR INFORMACIÓN <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href="#incluye"
                className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                VER VENTAJAS
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-tp-red/20 to-transparent rounded-full blur-3xl"></div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl relative space-y-4">
              {[
                { icon: <Boxes className="w-6 h-6 text-tp-red" />, label: "+15.000 kg gestionados/mes" },
                { icon: <Truck className="w-6 h-6 text-blue-400" />, label: "Recogida en tu local incluida" },
                { icon: <MapPin className="w-6 h-6 text-green-400" />, label: "14 provincias cubanas" },
                { icon: <Wallet className="w-6 h-6 text-purple-400" />, label: "Precio mayorista garantizado" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                    {stat.icon}
                  </div>
                  <span className="text-white font-bold text-lg">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* SECCIÓN 2 — ¿Para quién es? */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Pensado para negocios con volumen</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">
            Si ya tienes clientes que envían a Cuba y quieres gestionar esos envíos sin montar tu propia logística, esto es para ti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: <Plane className="w-8 h-8 text-tp-red" />, title: "Agencias de viajes y remesas" },
            { icon: <Globe className="w-8 h-8 text-tp-blue" />, title: "Tiendas online con clientela cubana" },
            { icon: <Phone className="w-8 h-8 text-tp-red" />, title: "Locutorios y centros de llamadas" },
            { icon: <Boxes className="w-8 h-8 text-tp-blue" />, title: "Distribuidores y mayoristas" },
            { icon: <Users className="w-8 h-8 text-tp-red" />, title: "Empresas con empleados en Cuba" },
            { icon: <Briefcase className="w-8 h-8 text-tp-blue" />, title: "Emprendedores con cartera de clientes cubana" },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-sm hover:shadow-xl transition-all group flex items-center gap-5">
              <div className="shrink-0 w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-tp-blue leading-snug">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 3 — Qué incluye */}
      <section id="incluye" className="py-24 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Todo lo que necesitas para operar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Wallet className="w-8 h-8 text-tp-red" />, title: "Precio mayorista", desc: "Tarifas netas para que tú fijes tu propio margen." },
              { icon: <Truck className="w-8 h-8 text-tp-blue" />, title: "Recogida en tu local", desc: "En función del volumen mensual, vamos nosotros a recogerte." },
              { icon: <LayoutDashboard className="w-8 h-8 text-tp-red" />, title: "Panel de gestión propio", desc: "Gestiona todos tus envíos desde nuestra plataforma." },
              { icon: <Code2 className="w-8 h-8 text-tp-blue" />, title: "Acceso API", desc: "Conecta tu sistema directamente con nuestra infraestructura." },
              { icon: <FileCheck className="w-8 h-8 text-tp-red" />, title: "Gestión aduanal completa", desc: "Nos encargamos de toda la documentación." },
              { icon: <Headphones className="w-8 h-8 text-tp-blue" />, title: "Soporte dedicado", desc: "Un gestor de cuenta exclusivo para tu negocio." },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-sm hover:shadow-xl transition-all group">
                <div className="mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-2xl font-black text-tp-blue mb-2">{item.title}</h3>
                <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 4 — Cómo funciona */}
      <section className="py-24 px-6 bg-tp-blue text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-16 text-center">Así de simple</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-white/10 z-0"></div>
            {[
              { step: "1", title: "Solicitas información", desc: "Rellenas el formulario y te contactamos en 24h." },
              { step: "2", title: "Acordamos condiciones", desc: "Precio por kilo según tu volumen estimado." },
              { step: "3", title: "Accedes a la plataforma", desc: "Panel listo, formación incluida." },
              { step: "4", title: "Empiezas a operar", desc: "Registras envíos, nosotros recogemos y entregamos." },
            ].map((item, i) => (
              <div key={i} className="relative z-10 text-center">
                <div className="w-16 h-16 bg-tp-red text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg shadow-tp-red/20">
                  {item.step}
                </div>
                <h4 className="text-xl font-black mb-2">{item.title}</h4>
                <p className="text-white/60 text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 5 — La recogida */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Nos adaptamos a tu volumen</h2>
          <p className="text-tp-blue/60 text-lg max-w-3xl mx-auto">
            Dependiendo de la cantidad de kilos que gestiones mensualmente, organizamos la recogida directamente en tu local, sin que tengas que desplazarte ni preocuparte por la logística interna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Package className="w-8 h-8 text-tp-blue" />, tag: "Volumen bajo", desc: "Llevas los paquetes a nuestro punto de consolidación más cercano." },
            { icon: <CalendarClock className="w-8 h-8 text-tp-red" />, tag: "Volumen medio", desc: "Recogida programada semanal en tu local." },
            { icon: <Zap className="w-8 h-8 text-tp-blue" />, tag: "Volumen alto", desc: "Recogida a demanda, cuando lo necesites." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-tp-gray-soft shadow-sm hover:border-tp-blue/30 transition-all text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                {item.icon}
              </div>
              <h3 className="text-xl font-black text-tp-blue mb-3">{item.tag}</h3>
              <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 6 — Formulario de contacto */}
      <section id="contacto" className="py-24 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Hablemos de tu negocio</h2>
            <p className="text-tp-blue/60 text-lg">
              Cuéntanos tu situación y te preparamos una propuesta de precio personalizada.
            </p>
          </div>

          {enviado ? (
            <div className="bg-white p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-tp-blue mb-3">¡Solicitud recibida!</h3>
              <p className="text-tp-blue/60 mb-8">
                Gracias por tu interés. Nuestro equipo revisará tu información y te contactará en menos de 24 horas con una propuesta personalizada.
              </p>
              <button
                onClick={() => setEnviado(false)}
                className="bg-tp-blue text-white px-8 py-3 rounded-2xl font-black hover:bg-[#004a78] transition-all"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-tp-red text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Nombre completo *</label>
                  <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nombre del negocio / empresa *</label>
                  <input type="text" required value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input type="tel" required value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tipo de negocio</label>
                  <select value={form.tipo_negocio} onChange={e => setForm({ ...form, tipo_negocio: e.target.value })} className={inputClass}>
                    <option value="">Selecciona una opción</option>
                    <option value="Agencia de viajes">Agencia de viajes</option>
                    <option value="Tienda online">Tienda online</option>
                    <option value="Locutorio">Locutorio</option>
                    <option value="Distribuidor/Mayorista">Distribuidor/Mayorista</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Volumen estimado mensual</label>
                  <select value={form.volumen_estimado} onChange={e => setForm({ ...form, volumen_estimado: e.target.value })} className={inputClass}>
                    <option value="">Selecciona una opción</option>
                    <option value="Menos de 50kg">Menos de 50kg</option>
                    <option value="50-200kg">50-200kg</option>
                    <option value="200-500kg">200-500kg</option>
                    <option value="Más de 500kg">Más de 500kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>¿Tienes local físico?</label>
                <div className="flex gap-4">
                  {[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold cursor-pointer transition-all ${
                        form.tiene_local === opt.value
                          ? 'bg-tp-blue text-white border-tp-blue'
                          : 'bg-white text-tp-blue border-tp-gray-soft hover:border-tp-blue/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tiene_local"
                        value={opt.value}
                        checked={form.tiene_local === opt.value}
                        onChange={e => setForm({ ...form, tiene_local: e.target.value })}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Cuéntanos tu caso</label>
                <textarea rows={4} value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} className={`${inputClass} resize-none`} placeholder="¿Cuántos clientes envían a Cuba? ¿Qué tipo de mercancía? ¿Desde dónde operas?" />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-tp-red text-white py-5 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {enviando ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> ENVIANDO...</>
                ) : (
                  <>ENVIAR SOLICITUD <Send className="w-5 h-5" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
