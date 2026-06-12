import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft, 
  Upload, 
  Instagram, 
  Youtube, 
  Twitter, 
  Globe,
  Info,
  ShieldCheck,
  Zap,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db, loginWithGoogle } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

type Step = 'role' | 'auth' | 'form' | 'success';
type Role = 'agente' | 'influencer';

export function Unirse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    pais: '',
    ciudad: '',
    zonaCobertura: '',
    experiencia: 'No',
    redSocialPrincipal: '',
    usuarioRedSocial: '',
    linkPerfil: '',
    seguidores: '',
    comunidadRelacionada: 'No',
    referidor: searchParams.get('referidor') || ''
  });

  useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo === 'agente' || tipo === 'influencer') {
      setSelectedRole(tipo as Role);
      setStep('auth');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && step === 'auth') {
      setStep('form');
    }
  }, [user, step]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('auth');
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      // Step will change via useEffect
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'solicitudesAfiliado'), {
        uid: user.uid,
        email: user.email,
        role: selectedRole,
        ...formData,
        status: 'pendiente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setStep('success');
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-tp-blue-light/30 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Header */}
        {step !== 'success' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => step === 'role' ? navigate('/') : setStep(step === 'form' ? 'auth' : 'role')}
                className="flex items-center gap-2 text-tp-blue/60 hover:text-tp-blue font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 'role' ? 'Volver al inicio' : 'Atrás'}
              </button>
              <div className="flex gap-2">
                {(['role', 'auth', 'form'] as Step[]).map((s, i) => (
                  <div 
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      step === s ? "w-8 bg-tp-blue" : i < ['role', 'auth', 'form'].indexOf(step) ? "w-4 bg-tp-blue/40" : "w-4 bg-tp-blue/10"
                    )}
                  />
                ))}
              </div>
            </div>
            <h1 className="text-3xl font-black text-tp-blue tracking-tight">
              {step === 'role' && 'Únete a la Red To Paquete'}
              {step === 'auth' && 'Identifícate'}
              {step === 'form' && `Solicitud de ${selectedRole === 'agente' ? 'Agente' : 'Influencer'}`}
            </h1>
            <p className="text-tp-blue/60 mt-2 font-medium">
              {step === 'role' && 'No importa dónde estés: puedes trabajar con nosotros desde cualquier parte del mundo.'}
              {step === 'auth' && 'Necesitamos vincular tu solicitud a una cuenta segura.'}
              {step === 'form' && 'Cuéntanos un poco más sobre ti para procesar tu alta.'}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: ROLE SELECTION */}
          {step === 'role' && (
            <motion.div 
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* AGENTE CARD */}
              <div 
                onClick={() => handleRoleSelect('agente')}
                className="group bg-white rounded-3xl border-2 border-tp-gray-soft p-8 cursor-pointer hover:border-tp-blue hover:shadow-2xl hover:shadow-tp-blue/10 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-tp-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                
                <div className="w-14 h-14 bg-tp-blue/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-tp-blue group-hover:text-white transition-colors">
                  <UserPlus className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl font-black text-tp-blue mb-4">Ser Agente</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-sm font-bold text-tp-blue/70">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Atención directa a clientes</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-bold text-tp-blue/70">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Comisión alta por kilo (€1.50)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-bold text-tp-blue/70">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Soporte WhatsApp Business</span>
                  </li>
                </ul>
                
                <div className="flex items-center justify-between pt-6 border-t border-tp-gray-soft">
                  <span className="text-tp-blue font-black uppercase tracking-wider text-xs">Empezar ahora</span>
                  <ChevronRight className="w-5 h-5 text-tp-blue group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* INFLUENCER CARD */}
              <div 
                onClick={() => handleRoleSelect('influencer')}
                className="group bg-white rounded-3xl border-2 border-tp-gray-soft p-8 cursor-pointer hover:border-tp-red hover:shadow-2xl hover:shadow-tp-red/10 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-tp-red/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                
                <div className="w-14 h-14 bg-tp-red/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-tp-red group-hover:text-white transition-colors">
                  <Zap className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl font-black text-tp-red mb-4">Ser Influencer</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-sm font-bold text-tp-blue/70">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Ingresos pasivos (sin atender)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-bold text-tp-blue/70">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Comisión por kilo (€0.50)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-bold text-tp-blue/70">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Ideal para creadores de contenido</span>
                  </li>
                </ul>
                
                <div className="flex items-center justify-between pt-6 border-t border-tp-gray-soft">
                  <span className="text-tp-red font-black uppercase tracking-wider text-xs">Empezar ahora</span>
                  <ChevronRight className="w-5 h-5 text-tp-red group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Comparison Link */}
              <div className="md:col-span-2 flex justify-center mt-8">
                <button 
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-2 text-tp-blue font-bold hover:underline"
                >
                  <Info className="w-4 h-4" />
                  Ver tabla comparativa detallada
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AUTHENTICATION */}
          {step === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto bg-white rounded-3xl border border-tp-gray-soft p-10 shadow-xl"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-tp-blue/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-tp-blue" />
                </div>
                <h3 className="text-2xl font-black text-tp-blue">Crea tu cuenta</h3>
                <p className="text-tp-blue/60 mt-2 font-medium">Para ser {selectedRole}, primero necesitamos identificarte.</p>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-4 bg-white border-2 border-tp-gray-soft py-4 rounded-2xl font-black text-tp-blue hover:bg-gray-50 transition-all mb-4"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continuar con Google
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-tp-gray-soft"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                  <span className="bg-white px-4 text-tp-blue/30">O usa tu email</span>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico"
                  className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                />
                <button className="w-full bg-tp-blue text-white py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20">
                  Continuar con Email
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: FORM */}
          {step === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-tp-gray-soft p-10 shadow-xl"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Common Fields */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Nombre Completo / Alias Público *</label>
                    <input 
                      required
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">WhatsApp de contacto *</label>
                    <input 
                      required
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                    />
                  </div>

                  {/* Anywhere in the world */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">País de residencia *</label>
                    <input 
                      required
                      type="text"
                      placeholder="Ej: España, Cuba, USA, etc."
                      value={formData.pais}
                      onChange={(e) => setFormData({...formData, pais: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                    />
                  </div>

                  {/* Agent Specific */}
                  {selectedRole === 'agente' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Ciudad donde operarás *</label>
                        <input 
                          required
                          type="text"
                          value={formData.ciudad}
                          onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Zonas de cobertura (Barrios, localidades) *</label>
                        <input 
                          required
                          type="text"
                          value={formData.zonaCobertura}
                          onChange={(e) => setFormData({...formData, zonaCobertura: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">¿Tienes experiencia en logística o mensajería? *</label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="experiencia" 
                              value="Sí" 
                              checked={formData.experiencia === 'Sí'}
                              onChange={(e) => setFormData({...formData, experiencia: e.target.value})}
                              className="w-5 h-5 text-tp-blue" 
                            />
                            <span className="font-bold text-tp-blue">Sí</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="experiencia" 
                              value="No" 
                              checked={formData.experiencia === 'No'}
                              onChange={(e) => setFormData({...formData, experiencia: e.target.value})}
                              className="w-5 h-5 text-tp-blue" 
                            />
                            <span className="font-bold text-tp-blue">No</span>
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="p-6 bg-tp-blue/5 rounded-2xl border-2 border-dashed border-tp-blue/20 flex flex-col items-center justify-center text-center">
                          <Upload className="w-8 h-8 text-tp-blue mb-2" />
                          <p className="text-sm font-bold text-tp-blue">Sube una foto de tu ID / Pasaporte (Frontal) *</p>
                          <p className="text-xs text-tp-blue/50 mt-1">Necesario para verificar tu identidad como agente oficial.</p>
                          <input type="file" className="hidden" />
                          <button type="button" className="mt-4 px-6 py-2 bg-tp-blue text-white rounded-xl font-bold text-xs">Seleccionar Archivo</button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Influencer Specific */}
                  {selectedRole === 'influencer' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Red Social Principal *</label>
                        <select 
                          required
                          value={formData.redSocialPrincipal}
                          onChange={(e) => setFormData({...formData, redSocialPrincipal: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                        >
                          <option value="">Selecciona...</option>
                          <option value="Instagram">Instagram</option>
                          <option value="TikTok">TikTok</option>
                          <option value="Facebook">Facebook</option>
                          <option value="YouTube">YouTube</option>
                          <option value="WhatsApp">WhatsApp / Grupos</option>
                          <option value="Otra">Otra</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Usuario / Nombre de Canal *</label>
                        <input 
                          required
                          type="text"
                          placeholder="Ej: @miusuario o Mi Canal"
                          value={formData.usuarioRedSocial}
                          onChange={(e) => setFormData({...formData, usuarioRedSocial: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Link de tu perfil o canal *</label>
                        <input 
                          required
                          type="url"
                          placeholder="https://instagram.com/miusuario"
                          value={formData.linkPerfil}
                          onChange={(e) => setFormData({...formData, linkPerfil: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">Seguidores / Miembros *</label>
                        <select 
                          required
                          value={formData.seguidores}
                          onChange={(e) => setFormData({...formData, seguidores: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                        >
                          <option value="">Selecciona...</option>
                          <option value="<1k">&lt; 1k</option>
                          <option value="1k-10k">1k - 10k</option>
                          <option value="10k-50k">10k - 50k</option>
                          <option value="+50k">+50k</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-tp-blue/40 uppercase tracking-widest ml-1">¿Tienes comunidad relacionada con Cuba o España-Cuba? *</label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="comunidadRelacionada" 
                              value="Sí" 
                              checked={formData.comunidadRelacionada === 'Sí'}
                              onChange={(e) => setFormData({...formData, comunidadRelacionada: e.target.value})}
                              className="w-5 h-5 text-tp-blue" 
                            />
                            <span className="font-bold text-tp-blue">Sí</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="comunidadRelacionada" 
                              value="No" 
                              checked={formData.comunidadRelacionada === 'No'}
                              onChange={(e) => setFormData({...formData, comunidadRelacionada: e.target.value})}
                              className="w-5 h-5 text-tp-blue" 
                            />
                            <span className="font-bold text-tp-blue">No</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 bg-tp-blue/5 rounded-2xl">
                  <input type="checkbox" required className="w-5 h-5 rounded border-tp-gray-soft text-tp-blue focus:ring-tp-blue" />
                  <p className="text-xs font-bold text-tp-blue/70">
                    Acepto los términos y condiciones del programa de {selectedRole === 'agente' ? 'agentes' : 'influencers'} y la política de privacidad. *
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-tp-blue text-white py-5 rounded-2xl font-black text-lg hover:bg-[#004a78] transition-all shadow-xl shadow-tp-blue/20 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Enviar Solicitud
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto bg-white rounded-[40px] border border-tp-gray-soft p-12 text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-4xl font-black text-tp-blue mb-4 tracking-tight">¡Solicitud Recibida!</h2>
              <p className="text-xl text-tp-blue/60 font-medium mb-10">
                Gracias por querer formar parte de To Paquete. Nuestro equipo revisará tu perfil y te contactará por WhatsApp en las próximas 24-48 horas.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div className="p-6 bg-tp-blue/5 rounded-3xl border border-tp-blue/10">
                  <MessageCircle className="w-8 h-8 text-tp-blue mx-auto mb-3" />
                  <h4 className="font-black text-tp-blue text-sm uppercase mb-1">Paso Siguiente</h4>
                  <p className="text-xs text-tp-blue/60 font-bold">Atento a tu WhatsApp</p>
                </div>
                <div className="p-6 bg-tp-blue/5 rounded-3xl border border-tp-blue/10">
                  <ShieldCheck className="w-8 h-8 text-tp-blue mx-auto mb-3" />
                  <h4 className="font-black text-tp-blue text-sm uppercase mb-1">Validación</h4>
                  <p className="text-xs text-tp-blue/60 font-bold">Verificamos cada perfil</p>
                </div>
              </div>

              <button 
                onClick={() => navigate('/')}
                className="bg-tp-blue text-white px-10 py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20"
              >
                Volver a la web principal
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Comparison Modal */}
        <AnimatePresence>
          {showComparison && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-tp-blue/60 backdrop-blur-sm"
              onClick={() => setShowComparison(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-tp-blue">Agente vs Influencer</h3>
                  <button onClick={() => setShowComparison(false)} className="text-tp-blue/40 hover:text-tp-blue font-black">Cerrar</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-bold border-collapse">
                    <thead>
                      <tr className="bg-tp-blue text-white">
                        <th className="p-4 text-left border border-white/10">Característica</th>
                        <th className="p-4 text-center border border-white/10">AGENTE</th>
                        <th className="p-4 text-center border border-white/10">INFLUENCER</th>
                      </tr>
                    </thead>
                    <tbody className="text-tp-blue">
                      <tr className="bg-gray-50">
                        <td className="p-4 border border-tp-gray-soft">Atención al cliente</td>
                        <td className="p-4 text-center border border-tp-gray-soft">✅ Sí, diaria</td>
                        <td className="p-4 text-center border border-tp-gray-soft">❌ No</td>
                      </tr>
                      <tr>
                        <td className="p-4 border border-tp-gray-soft">Trabajo constante</td>
                        <td className="p-4 text-center border border-tp-gray-soft">✅ Necesario</td>
                        <td className="p-4 text-center border border-tp-gray-soft">🔄 Opcional</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="p-4 border border-tp-gray-soft">Herramienta WA Biz</td>
                        <td className="p-4 text-center border border-tp-gray-soft">✅ Incluida</td>
                        <td className="p-4 text-center border border-tp-gray-soft">❌ No aplica</td>
                      </tr>
                      <tr>
                        <td className="p-4 border border-tp-gray-soft">Tipo de ingreso</td>
                        <td className="p-4 text-center border border-tp-gray-soft">Activo</td>
                        <td className="p-4 text-center border border-tp-gray-soft">Pasivo</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="p-4 border border-tp-gray-soft">Comisión por kg</td>
                        <td className="p-4 text-center border border-tp-gray-soft">€1.50</td>
                        <td className="p-4 text-center border border-tp-gray-soft">€0.50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 p-6 bg-tp-blue/5 rounded-2xl">
                  <p className="text-sm text-tp-blue/80 leading-relaxed font-medium">
                    <span className="font-black text-tp-blue">¿Cuál elegir?</span> Si tienes tiempo para atender personas y quieres ganar más por cada kilo, elige <span className="text-tp-blue font-black">Agente</span>. Si tienes una audiencia en redes y prefieres ingresos pasivos sin gestionar envíos, elige <span className="text-tp-red font-black">Influencer</span>.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
