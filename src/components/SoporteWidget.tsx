import React, { useState, useEffect } from 'react';
import { Headphones, X, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

/** Abre el widget de soporte desde cualquier parte de la app. */
export function abrirSoporte() {
  window.dispatchEvent(new Event('tp-soporte-open'));
}

const CATEGORIAS = [
  'Problema con mi paquete',
  'Problema de acceso o contraseña',
  'Cobros y pagos',
  'Mi cuenta o perfil',
  'Agente o influencer',
  'Consulta general',
  'Otro',
];

type Estado = 'idle' | 'enviando' | 'ok' | 'error';

export function SoporteWidget() {
  const { user, profile } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [categoria, setCategoria] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');

  // Escucha el evento global para abrir el widget desde cualquier parte de la app
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener('tp-soporte-open', abrir);
    return () => window.removeEventListener('tp-soporte-open', abrir);
  }, []);

  // Pre-rellenar con datos del perfil cuando se abre
  useEffect(() => {
    if (abierto) {
      setNombre((profile?.name as string) || '');
      setEmail((user?.email as string) || (profile?.email as string) || '');
    }
  }, [abierto, profile, user]);

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setCategoria('');
    setMensaje('');
    setEstado('idle');
  };

  const handleClose = () => {
    setAbierto(false);
    if (estado === 'ok') resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !mensaje.trim()) return;
    setEstado('enviando');
    try {
      const { error } = await supabase.functions.invoke('soporte-email', {
        body: { nombre: nombre.trim(), email: email.trim(), categoria, mensaje: mensaje.trim() },
      });
      if (error) throw error;
      setEstado('ok');
    } catch (err) {
      console.error('Error enviando soporte:', err);
      setEstado('error');
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(true)}
        aria-label="Contactar soporte"
        className={cn(
          'fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-bold text-sm transition-all duration-200',
          'bg-tp-blue text-white hover:bg-[#004a78] hover:shadow-xl active:scale-95',
          abierto && 'hidden',
        )}
      >
        <Headphones className="w-5 h-5" />
        <span className="hidden sm:inline">Soporte</span>
      </button>

      {/* Panel modal */}
      {abierto && (
        <div className="fixed bottom-6 left-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-tp-gray-soft animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-tp-gray-soft">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-tp-blue rounded-xl flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-black text-tp-blue text-sm leading-none">Soporte Técnico</div>
                <div className="text-[10px] text-tp-blue/40 font-bold mt-0.5">Respuesta en &lt;24 h</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-tp-blue/40 hover:text-tp-blue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5">
            {estado === 'ok' ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <div className="font-black text-tp-blue text-lg">¡Mensaje enviado!</div>
                <p className="text-sm text-tp-blue/50 leading-relaxed">
                  Te hemos enviado un acuse de recibo a <strong>{email}</strong>.
                  Nuestro equipo te responderá en menos de 24 h.
                </p>
                <button
                  onClick={resetForm}
                  className="mt-2 text-xs font-bold text-tp-blue/40 hover:text-tp-red transition-colors underline"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {estado === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-tp-red font-bold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Error al enviar. Inténtalo de nuevo o escríbenos a soporte@topaquete.com
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-3 py-2 text-sm border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2 text-sm border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                  >
                    <option value="">Selecciona una categoría…</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-tp-blue/40 uppercase tracking-wider mb-1">Mensaje *</label>
                  <textarea
                    required
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Describe tu problema con el mayor detalle posible…"
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={estado === 'enviando'}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-tp-blue text-white rounded-2xl font-bold text-sm hover:bg-[#004a78] transition-colors disabled:opacity-60"
                >
                  {estado === 'enviando'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                    : <><Send className="w-4 h-4" /> Enviar mensaje</>}
                </button>

                <p className="text-[10px] text-center text-tp-blue/30">
                  También puedes escribirnos a{' '}
                  <a href="mailto:soporte@topaquete.com" className="underline hover:text-tp-blue transition-colors">
                    soporte@topaquete.com
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
