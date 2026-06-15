import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Send, Loader2,
  Wallet, Truck, LayoutDashboard, Users, Banknote,
  Phone, Plane, ShoppingBasket, Scissors, FileText, Store,
  Building2, ClipboardList, Scale, PackageCheck, Wifi, Clock,
} from 'lucide-react';
import { crearContactoPartner } from '../services/contactosPartners';

const FORM_INICIAL = {
  nombre: '',
  empresa: '',
  tipo_negocio: '',
  email: '',
  telefono: '',
  ciudad: '',
  bascula: '',
  mensaje: '',
};

export function PuntoDeEntrega() {
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
        tipo_negocio: form.tipo_negocio || undefined,
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        mensaje: form.mensaje.trim() || undefined,
        tipo_solicitud: 'punto_de_entrega',
        datos: {
          bascula: form.bascula === '' ? null : form.bascula === 'si',
        },
      });
      setEnviado(true);
      setForm(FORM_INICIAL);
    } catch (err) {
      console.error('Error enviando solicitud de punto de entrega:', err);
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
              <span className="text-xs font-bold uppercase tracking-wider">Red de Puntos de Entrega ToPaquete</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
              Convierte tu negocio en un <span className="text-tp-red">Punto de Entrega</span> ToPaquete
            </h1>
            <p className="text-white/80 text-xl mb-10 max-w-xl leading-relaxed">
              Ofrece un servicio más a tus clientes sin cambiar lo que haces. Recibe paquetes, regístralos en nuestra plataforma y nosotros nos encargamos del resto.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="bg-tp-red text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
              >
                QUIERO SER PUNTO DE ENTREGA <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href="#como-funciona"
                className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                CÓMO FUNCIONA
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-tp-red/20 to-transparent rounded-full blur-3xl"></div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl relative space-y-4">
              {[
                { icon: <Wallet className="w-6 h-6 text-tp-red" />, label: "Sin inversión inicial" },
                { icon: <Banknote className="w-6 h-6 text-green-400" />, label: "Comisión por cada paquete" },
                { icon: <Truck className="w-6 h-6 text-blue-400" />, label: "Nosotros recogemos" },
                { icon: <LayoutDashboard className="w-6 h-6 text-purple-400" />, label: "Plataforma gratuita" },
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

      {/* SECCIÓN 2 — ¿Qué es un Punto de Entrega? */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Como los puntos Correos, pero para Cuba</h2>
          <p className="text-tp-blue/60 text-lg max-w-3xl mx-auto">
            Un Punto de Entrega es un negocio que ya existe y que añade la recepción de paquetes a Cuba como un servicio más. El cliente trae su paquete, tú lo registras en nuestra plataforma y cobras. Nosotros nos encargamos de todo lo demás.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Store className="w-8 h-8 text-tp-red" />, title: "Tu negocio sigue siendo tuyo", desc: "No cambias lo que haces. Simplemente añades un servicio más que tus clientes valoran." },
            { icon: <PackageCheck className="w-8 h-8 text-tp-blue" />, title: "Tú recibes, nosotros gestionamos", desc: "El cliente trae su paquete, tú lo registras en nuestra app y cobras. Nosotros hacemos todo lo demás." },
            { icon: <Banknote className="w-8 h-8 text-tp-red" />, title: "Ganas por cada paquete", desc: "Cobras una comisión por cada paquete que pasa por tu punto, sin riesgo ni inversión." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-sm hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-2xl font-black text-tp-blue mb-2">{item.title}</h3>
              <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 3 — ¿Para qué tipo de negocio? */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Ideal si tienes uno de estos negocios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Phone className="w-8 h-8 text-tp-red" />, title: "Locutorio o centro de llamadas" },
              { icon: <Plane className="w-8 h-8 text-tp-blue" />, title: "Agencia de viajes" },
              { icon: <ShoppingBasket className="w-8 h-8 text-tp-red" />, title: "Tienda de alimentación o bazar" },
              { icon: <Scissors className="w-8 h-8 text-tp-blue" />, title: "Peluquería o salón de belleza" },
              { icon: <FileText className="w-8 h-8 text-tp-red" />, title: "Oficina de trámites y gestiones" },
              { icon: <Building2 className="w-8 h-8 text-tp-blue" />, title: "Cualquier local con atención al público" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft shadow-sm hover:shadow-xl transition-all group flex items-center gap-5">
                <div className="shrink-0 w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-black text-tp-blue leading-snug">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 4 — Cómo funciona */}
      <section id="como-funciona" className="py-24 px-6 bg-tp-blue text-white scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black mb-16 text-center">Más fácil de lo que crees</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "El cliente llega a tu local con su paquete" },
              { step: "2", title: "Rellenas el formulario: datos del remitente y del beneficiario en Cuba" },
              { step: "3", title: "Si tienes báscula, pesas el paquete. Si no, no pasa nada — nosotros lo pesamos al recoger" },
              { step: "4", title: "Cobras al cliente en el momento" },
              { step: "5", title: "ToPaquete recoge los paquetes acumulados en tu local. Tú no te mueves." },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem]">
                <div className="w-14 h-14 bg-tp-red text-white rounded-full flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-tp-red/20">
                  {item.step}
                </div>
                <p className="text-lg font-bold text-white/90">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 5 — Qué necesitas */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Los requisitos son mínimos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-tp-gray-soft shadow-sm">
            <h3 className="text-2xl font-black text-tp-blue mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-green-500" /> Imprescindible
            </h3>
            <ul className="space-y-4">
              {[
                { icon: <Store className="w-5 h-5 text-tp-blue" />, text: "Local físico con atención al cliente" },
                { icon: <Wifi className="w-5 h-5 text-tp-blue" />, text: "Acceso a internet (móvil o ordenador)" },
                { icon: <Clock className="w-5 h-5 text-tp-blue" />, text: "Disponibilidad para recibir a los clientes" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-tp-blue/80 font-bold">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-tp-gray-soft shadow-sm">
            <h3 className="text-2xl font-black text-tp-blue mb-6 flex items-center gap-3">
              <ClipboardList className="w-7 h-7 text-tp-red" /> Recomendable
              <span className="text-xs font-bold text-tp-blue/40 normal-case">(no obligatorio)</span>
            </h3>
            <ul className="space-y-4">
              {[
                { icon: <Scale className="w-5 h-5 text-tp-red" />, text: "Báscula para pesar paquetes" },
                { icon: <PackageCheck className="w-5 h-5 text-tp-red" />, text: "Espacio para almacenar paquetes hasta la recogida" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-tp-blue/80 font-bold">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECCIÓN 6 — Qué ganas */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-tp-blue mb-4">Tus beneficios como Punto de Entrega</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: <Banknote className="w-8 h-8 text-tp-red" />, title: "Comisión por paquete", desc: "Ganas por cada envío registrado en tu punto." },
              { icon: <Users className="w-8 h-8 text-tp-blue" />, title: "Nuevos clientes", desc: "Atraes personas que antes no conocían tu negocio." },
              { icon: <LayoutDashboard className="w-8 h-8 text-tp-red" />, title: "Plataforma gratuita", desc: "Acceso sin coste a la app de gestión ToPaquete." },
              { icon: <Truck className="w-8 h-8 text-tp-blue" />, title: "Nosotros recogemos", desc: "No tienes que hacer nada más que registrar y cobrar." },
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-tp-gray-soft shadow-sm hover:shadow-xl transition-all group flex items-start gap-6">
                <div className="shrink-0 w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-tp-blue mb-2">{item.title}</h3>
                  <p className="text-tp-blue/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 7 — Formulario */}
      <section id="contacto" className="py-24 px-6 max-w-3xl mx-auto scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Apúntate a la red de Puntos de Entrega</h2>
          <p className="text-tp-blue/60 text-lg">Te contactamos en 24h para explicarte todos los detalles.</p>
        </div>

        {enviado ? (
          <div className="bg-white p-12 rounded-[3rem] border border-tp-gray-soft shadow-xl text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-tp-blue mb-3">¡Solicitud recibida!</h3>
            <p className="text-tp-blue/60 mb-8">
              Gracias por tu interés. Nuestro equipo te contactará en menos de 24 horas para explicarte cómo convertir tu negocio en un Punto de Entrega ToPaquete.
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
                <label className={labelClass}>Nombre del negocio *</label>
                <input type="text" required value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Tipo de negocio</label>
                <select value={form.tipo_negocio} onChange={e => setForm({ ...form, tipo_negocio: e.target.value })} className={inputClass}>
                  <option value="">Selecciona una opción</option>
                  <option value="Locutorio">Locutorio</option>
                  <option value="Agencia de viajes">Agencia de viajes</option>
                  <option value="Tienda/Bazar">Tienda/Bazar</option>
                  <option value="Peluquería/Estética">Peluquería/Estética</option>
                  <option value="Oficina de trámites">Oficina de trámites</option>
                  <option value="Otro">Otro</option>
                </select>
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
                <label className={labelClass}>Ciudad / Localidad *</label>
                <input type="text" required value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>¿Tienes báscula?</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'si', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold cursor-pointer transition-all ${
                      form.bascula === opt.value
                        ? 'bg-tp-blue text-white border-tp-blue'
                        : 'bg-white text-tp-blue border-tp-gray-soft hover:border-tp-blue/30'
                    }`}
                  >
                    <input type="radio" name="bascula" value={opt.value} checked={form.bascula === opt.value} onChange={e => setForm({ ...form, bascula: e.target.value })} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Mensaje</label>
              <textarea rows={4} value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} className={`${inputClass} resize-none`} placeholder="Cuéntanos lo que quieras sobre tu negocio (opcional)." />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-tp-red text-white py-5 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {enviando ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> ENVIANDO...</>
              ) : (
                <>SOLICITAR ALTA COMO PUNTO DE ENTREGA <Send className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
