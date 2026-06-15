import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Send, Loader2, X,
  BadgeCheck, LayoutDashboard, Megaphone, Clapperboard, Share2, GraduationCap,
  Rocket, Store, Globe2,
} from 'lucide-react';
import { crearContactoPartner } from '../services/contactosPartners';

const FORM_INICIAL = {
  nombre: '',
  email: '',
  telefono: '',
  ciudad: '',
  local_disponible: '',
  experiencia: '',
  mensaje: '',
};

export function Franquicia() {
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
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        mensaje: form.mensaje.trim(),
        tipo_solicitud: 'franquicia',
        datos: {
          local_disponible: form.local_disponible || null,
          experiencia: form.experiencia === '' ? null : form.experiencia === 'si',
        },
      });
      setEnviado(true);
      setForm(FORM_INICIAL);
    } catch (err) {
      console.error('Error enviando solicitud de franquicia:', err);
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
              <span className="text-xs font-bold uppercase tracking-wider">Programa de Franquicia ToPaquete 2026</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
              Abre tu propio negocio de envíos a Cuba <span className="text-tp-red">bajo nuestra marca</span>
            </h1>
            <p className="text-white/80 text-xl mb-10 max-w-xl leading-relaxed">
              Todo el respaldo de ToPaquete — marca, plataforma, publicidad y soporte — para que tú te centres en crecer.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="bg-tp-red text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
              >
                QUIERO MI FRANQUICIA <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href="#incluye"
                className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                MÁS INFORMACIÓN
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-tp-red/20 to-transparent rounded-full blur-3xl"></div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl relative space-y-4">
              {[
                { icon: <BadgeCheck className="w-6 h-6 text-tp-red" />, label: "Marca registrada" },
                { icon: <GraduationCap className="w-6 h-6 text-blue-400" />, label: "Soporte completo" },
                { icon: <Megaphone className="w-6 h-6 text-green-400" />, label: "Material publicitario incluido" },
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

      {/* SECCIÓN 2 — Qué es la Franquicia */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Tú pones las ganas, nosotros ponemos todo lo demás</h2>
          <p className="text-tp-blue/60 text-lg max-w-3xl mx-auto">
            La franquicia es el nivel más completo: operas como una sucursal ToPaquete en tu zona, con nuestra marca, nuestra plataforma y nuestra publicidad. Así se diferencia de los otros modelos:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 rounded-[2rem] overflow-hidden shadow-sm border border-tp-gray-soft">
            <thead>
              <tr>
                <th className="bg-white p-5 text-left text-tp-blue/50 font-black uppercase text-xs tracking-widest"></th>
                <th className="bg-white p-5 text-center text-tp-blue font-black border-l border-tp-gray-soft">Punto de Entrega</th>
                <th className="bg-white p-5 text-center text-tp-blue font-black border-l border-tp-gray-soft">Partner</th>
                <th className="bg-tp-blue p-5 text-center text-white font-black border-l border-tp-blue">Franquicia</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Marca", values: ["ToPaquete", "La tuya", "ToPaquete"] },
                { label: "Plataforma", values: [true, true, true] },
                { label: "Material publicitario", values: [false, false, true] },
                { label: "Redes sociales", values: [false, false, true] },
                { label: "Soporte dedicado", values: [false, true, true] },
                { label: "Precio mayorista", values: [false, true, true] },
              ].map((row, i) => (
                <tr key={i} className="border-t border-tp-gray-soft">
                  <td className="bg-white p-5 font-bold text-tp-blue border-t border-tp-gray-soft">{row.label}</td>
                  {row.values.map((val, j) => (
                    <td
                      key={j}
                      className={`p-5 text-center border-t border-l border-tp-gray-soft font-bold ${j === 2 ? 'bg-tp-blue/5' : 'bg-white'}`}
                    >
                      {typeof val === 'boolean' ? (
                        val ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-tp-blue/20 mx-auto" />
                        )
                      ) : (
                        <span className={j === 2 ? 'text-tp-blue' : 'text-tp-blue/70'}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN 3 — Qué incluye la Franquicia */}
      <section id="incluye" className="py-24 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Qué incluye la Franquicia</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <BadgeCheck className="w-8 h-8 text-tp-red" />, title: "Marca ToPaquete", desc: "Operas bajo nuestro nombre y logo registrado." },
              { icon: <LayoutDashboard className="w-8 h-8 text-tp-blue" />, title: "Plataforma completa", desc: "Acceso total a nuestra plataforma de gestión." },
              { icon: <Megaphone className="w-8 h-8 text-tp-red" />, title: "Material publicitario", desc: "Carteles, flyers, roll-ups y material de marca." },
              { icon: <Clapperboard className="w-8 h-8 text-tp-blue" />, title: "Contenido para redes", desc: "Vídeos y publicaciones listas para usar en tus redes." },
              { icon: <Share2 className="w-8 h-8 text-tp-red" />, title: "Publicidad conjunta", desc: "Incluido en nuestras campañas publicitarias." },
              { icon: <GraduationCap className="w-8 h-8 text-tp-blue" />, title: "Soporte y formación", desc: "Formación inicial y gestor de cuenta exclusivo." },
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

      {/* SECCIÓN 4 — Para quién es */}
      <section className="py-24 px-6 bg-tp-blue text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">El modelo ideal si quieres lanzar un negocio propio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Rocket className="w-8 h-8" />, title: "Emprendedor sin experiencia en logística", desc: "Que quiere un negocio probado y listo para arrancar." },
              { icon: <Store className="w-8 h-8" />, title: "Negocio existente", desc: "Que quiere una segunda línea de ingresos con una marca fuerte." },
              { icon: <Globe2 className="w-8 h-8" />, title: "Emprendedor cubano en España", desc: "Que conoce el mercado y quiere capitalizarlo." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem]">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 5 — Proceso */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-tp-blue mb-16 text-center">Del interés a la operación en 4 pasos</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
          <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-tp-blue/10 z-0"></div>
          {[
            { step: "1", title: "Solicitas información", desc: "Rellenas el formulario y te contactamos." },
            { step: "2", title: "Reunión de presentación", desc: "Presentación y estudio de tu zona." },
            { step: "3", title: "Acuerdo y formación", desc: "Firmamos el acuerdo de franquicia y te formamos." },
            { step: "4", title: "Apertura", desc: "Apertura y primera operación bajo la marca ToPaquete." },
          ].map((item, i) => (
            <div key={i} className="relative z-10 text-center">
              <div className="w-16 h-16 bg-tp-red text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg shadow-tp-red/20">
                {item.step}
              </div>
              <h4 className="text-xl font-black text-tp-blue mb-2">{item.title}</h4>
              <p className="text-tp-blue/60 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 6 — Formulario */}
      <section id="contacto" className="py-24 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Solicita información sobre la franquicia</h2>
          </div>

          {enviado ? (
            <div className="bg-white p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-tp-blue mb-3">¡Solicitud recibida!</h3>
              <p className="text-tp-blue/60 mb-8">
                Gracias por tu interés en la franquicia ToPaquete. Nuestro equipo revisará tu información y te contactará para presentarte el modelo y estudiar tu zona.
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
                <div className="md:col-span-2">
                  <label className={labelClass}>Nombre completo *</label>
                  <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input type="tel" required value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Ciudad / Provincia *</label>
                  <input type="text" required value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>¿Tienes local físico disponible?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                    { value: 'en_busqueda', label: 'En búsqueda' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold cursor-pointer transition-all text-center ${
                        form.local_disponible === opt.value
                          ? 'bg-tp-blue text-white border-tp-blue'
                          : 'bg-white text-tp-blue border-tp-gray-soft hover:border-tp-blue/30'
                      }`}
                    >
                      <input type="radio" name="local_disponible" value={opt.value} checked={form.local_disponible === opt.value} onChange={e => setForm({ ...form, local_disponible: e.target.value })} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>¿Tienes experiencia en negocios?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold cursor-pointer transition-all ${
                        form.experiencia === opt.value
                          ? 'bg-tp-blue text-white border-tp-blue'
                          : 'bg-white text-tp-blue border-tp-gray-soft hover:border-tp-blue/30'
                      }`}
                    >
                      <input type="radio" name="experiencia" value={opt.value} checked={form.experiencia === opt.value} onChange={e => setForm({ ...form, experiencia: e.target.value })} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Cuéntanos tu situación *</label>
                <textarea rows={4} required value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} className={`${inputClass} resize-none`} placeholder="¿Por qué te interesa la franquicia? ¿Qué zona tienes en mente? ¿Cuál es tu situación actual?" />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-tp-red text-white py-5 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {enviando ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> ENVIANDO...</>
                ) : (
                  <>SOLICITAR INFORMACIÓN <Send className="w-5 h-5" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
