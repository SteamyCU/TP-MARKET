import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Recepcion } from './pages/Recepcion';
import { Seguimiento } from './pages/Seguimiento';
import { Perfil } from './pages/Perfil';
import { Usuarios } from './pages/Usuarios';
import { Reportes } from './pages/Reportes';
import { Pagos } from './pages/Pagos';
import { Contabilidad } from './pages/Contabilidad';
import { ConfiguracionAfiliados } from './pages/ConfiguracionAfiliados';
import { RedAfiliados } from './pages/RedAfiliados';
import { Clientes } from './pages/Clientes';
import { Logistica } from './pages/Logistica';
import { MisDestinatarios } from './pages/MisDestinatarios';
import { MisSolicitudes } from './pages/MisSolicitudes';
import { Solicitudes } from './pages/Solicitudes';
import { Calculadora } from './pages/Calculadora';
import { OfertasSalidas } from './pages/OfertasSalidas';
import { AdminB2B } from './pages/AdminB2B';
import { SerAgente } from './pages/SerAgente';
import { SerAgenteFreelance } from './pages/SerAgenteFreelance';
import { SerInfluencer } from './pages/SerInfluencer';
import { SerPartner } from './pages/SerPartner';
import { SobreNosotros } from './pages/SobreNosotros';
import { TerminosCondiciones } from './pages/TerminosCondiciones';
import { PoliticaPrivacidad } from './pages/PoliticaPrivacidad';
import { EnviosAereos } from './pages/EnviosAereos';
import { EnviosMaritimos } from './pages/EnviosMaritimos';
import { CargaMiscelanea } from './pages/CargaMiscelanea';
import { EnvioElectrodomesticos } from './pages/EnvioElectrodomesticos';
import { MedicinasExentas } from './pages/MedicinasExentas';
import { ComisionesAgente } from './pages/ComisionesAgente';
import { ProgramaAfiliados } from './pages/ProgramaAfiliados';
import { Unirse } from './pages/Unirse';
import { ScrollToTop } from './components/ScrollToTop';
import { db, auth, loginWithGoogle, logout, registerWithEmail, loginWithEmail } from './firebase';
import { cn } from './lib/utils';
import { AlertCircle, CheckCircle2, User as UserIcon, Phone, MapPin, Building2, CreditCard, LogOut, ArrowLeft, ChevronRight } from 'lucide-react';

function ProfileCompletion({ onComplete }: { onComplete: () => void }) {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState<any>({
    name: profile?.name || '',
    telefono: profile?.telefono || '',
    dni: profile?.dni || '',
    direccion: profile?.direccion || '',
    oficina: profile?.oficina || '',
    socialHandle: profile?.socialHandle || '',
    businessName: profile?.businessName || '',
    tipoColaborador: profile?.tipoColaborador || (profile?.role === 'partner' ? 'empresa_b2b' : 'none'),
    tipoInfluencer: profile?.tipoInfluencer || '',
    redesSociales: profile?.redesSociales || '',
    metodoCobro: profile?.metodoCobro || '',
    datosCobro: profile?.datosCobro || '',
    referido_por: profile?.referido_por || localStorage.getItem('pending_ref') || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralInfo, setReferralInfo] = useState<{ valid: boolean; message: string; type: 'success' | 'error' | 'info' | null }>({
    valid: false,
    message: '',
    type: null
  });
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const validateReferralCode = async (code: string) => {
    if (!code) return;
    setIsValidatingCode(true);
    setReferralInfo({ valid: false, message: '', type: 'info' });
    
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const influencersRef = collection(db, 'influencers');
      const q = query(influencersRef, where('codigo', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setReferralInfo({ valid: false, message: '❌ Código no encontrado', type: 'error' });
      } else {
        const influencerData = querySnapshot.docs[0].data();
        if (influencerData.activo === false) {
          setReferralInfo({ valid: false, message: 'Este código no está disponible', type: 'error' });
        } else {
          const beneficio = influencerData.beneficio || { tipo: 'descuento', valor: 5 };
          setReferralInfo({ 
            valid: true, 
            message: `✅ Código ${code.toUpperCase()} aplicado — Obtienes ${beneficio.valor}${beneficio.tipo === 'descuento' ? '€' : '%'} de beneficio`, 
            type: 'success' 
          });
          setFormData({ ...formData, referido_por: code.toUpperCase(), beneficio_aplicado: beneficio });
        }
      }
    } catch (err) {
      console.error("Error validating code:", err);
      setReferralInfo({ valid: false, message: 'Error al validar el código', type: 'error' });
    } finally {
      setIsValidatingCode(false);
    }
  };

  React.useEffect(() => {
    const pendingRef = localStorage.getItem('pending_ref');
    if (pendingRef && !formData.referido_por) {
      setFormData(prev => ({ ...prev, referido_por: pendingRef }));
      validateReferralCode(pendingRef);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const finalData = { 
        ...formData,
        beneficio_usado: false
      };
      
      if (profile?.role === 'partner') {
        finalData.role = 'partner';
      }

      // If there's a valid referral, update influencer stats
      if (referralInfo.valid && formData.referido_por) {
        const { collection, query, where, getDocs, updateDoc, increment, addDoc, serverTimestamp } = await import('firebase/firestore');
        const influencersRef = collection(db, 'influencers');
        const q = query(influencersRef, where('codigo', '==', formData.referido_por));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const influencerDoc = querySnapshot.docs[0];
          await updateDoc(influencerDoc.ref, {
            total_referidos: increment(1)
          });
          
          await addDoc(collection(db, `influencers/${influencerDoc.id}/referidos`), {
            cliente_uid: profile.uid || auth.currentUser?.uid,
            fecha: serverTimestamp(),
            estado: "registrado"
          });
        }
      }

      await updateProfile(finalData);
      localStorage.removeItem('pending_ref');
      onComplete();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Error al guardar el perfil. Por favor, verifica tus datos y permisos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-tp-gray-soft animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="text-4xl font-black italic tracking-tighter flex">
            <span className="text-tp-blue">T</span>
            <span className="text-tp-red">P</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-tp-blue/40 hover:text-tp-red text-xs font-bold transition-colors group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            CERRAR SESIÓN / VOLVER
          </button>
        </div>
        <h1 className="text-2xl font-bold text-tp-blue mb-2 text-center">Completa tu Perfil</h1>
        <p className="text-tp-blue/60 mb-8 text-center text-sm">Necesitamos algunos datos adicionales para tu cuenta de <span className="font-bold text-tp-red uppercase">{profile?.role === 'partner' ? 'Socio / Punto Pack' : profile?.role}</span></p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-tp-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {profile?.role === 'partner' && (
            <div className="bg-tp-blue-light/30 p-4 rounded-xl border border-tp-blue/10 mb-4">
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-3 ml-1">Tipo de Asociación</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tipoColaborador: 'empresa_b2b'})}
                  className={cn(
                    "p-3 rounded-xl border-2 text-xs font-bold transition-all",
                    formData.tipoColaborador === 'empresa_b2b' 
                      ? "border-tp-blue bg-tp-blue text-white shadow-md" 
                      : "border-tp-gray-soft bg-white text-tp-blue/60 hover:border-tp-blue/30"
                  )}
                >
                  SOCIO B2B (EMPRESA)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tipoColaborador: 'punto_pack'})}
                  className={cn(
                    "p-3 rounded-xl border-2 text-xs font-bold transition-all",
                    formData.tipoColaborador === 'punto_pack' 
                      ? "border-tp-red bg-tp-red text-white shadow-md" 
                      : "border-tp-gray-soft bg-white text-tp-blue/60 hover:border-tp-red/30"
                  )}
                >
                  PUNTO PACK (TIENDA)
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">
              {profile?.role === 'partner' ? 'Nombre Comercial / Empresa' : 'Nombre Completo'}
            </label>
            <div className="relative">
              {profile?.role === 'partner' ? (
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
              ) : (
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
              )}
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">
                {profile?.role === 'partner' ? 'CIF / NIF' : 'DNI / NIE / Pasaporte'}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="text" 
                  required
                  placeholder={profile?.role === 'partner' ? 'B12345678' : '12345678X'}
                  value={formData.dni}
                  onChange={(e) => setFormData({...formData, dni: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Teléfono de Contacto</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="tel" 
                  required
                  placeholder="+34 600 000 000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
            </div>
          </div>

          {(profile?.role === 'cliente' || profile?.role === 'partner') && (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">
                {formData.tipoColaborador === 'punto_pack' ? 'Dirección del Local' : 'Dirección Fiscal / Recogida'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="text" 
                  required
                  placeholder="Calle, Número, Ciudad..."
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
            </div>
          )}

          {profile?.role === 'agente' && (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Oficina / Sucursal</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="text" 
                  required
                  placeholder="Nombre de la oficina..."
                  value={formData.oficina}
                  onChange={(e) => setFormData({...formData, oficina: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
            </div>
          )}

          {profile?.role === 'influencer' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Tipo de Afiliado</label>
                  <select 
                    required
                    value={formData.tipoInfluencer}
                    onChange={(e) => setFormData({...formData, tipoInfluencer: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                  >
                    <option value="">Selecciona un tipo...</option>
                    <option value="Influencer RRSS">Influencer RRSS</option>
                    <option value="Blogger / youtuber">Blogger / youtuber</option>
                    <option value="Newsletter">Newsletter</option>
                    <option value="Podcast / podcast">Podcast / podcast</option>
                    <option value="Sub-afiliado">Sub-afiliado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Método de Cobro</label>
                  <select 
                    required
                    value={formData.metodoCobro}
                    onChange={(e) => setFormData({...formData, metodoCobro: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                  >
                    <option value="">Selecciona un método...</option>
                    <option value="Transferencia Bancaria (España)">Transferencia Bancaria (España)</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Efectivo (Cuba)">Efectivo (Cuba)</option>
                    <option value="Transferencia (Cuba)">Transferencia (Cuba)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Enlaces de Redes Sociales / Plataformas</label>
                <textarea 
                  required
                  placeholder="Pega aquí los enlaces a tus perfiles de Instagram, TikTok, YouTube, Blog, etc."
                  value={formData.redesSociales}
                  onChange={(e) => setFormData({...formData, redesSociales: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Datos para el Cobro</label>
                <textarea 
                  required
                  placeholder={formData.metodoCobro === 'Efectivo (Cuba)' ? 'Indica la dirección y persona que recibirá el efectivo en Cuba...' : 'Indica tu IBAN, cuenta de PayPal, o detalles bancarios...'}
                  value={formData.datosCobro}
                  onChange={(e) => setFormData({...formData, datosCobro: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium min-h-[80px]"
                />
                <p className="text-[10px] text-tp-blue/50 mt-1 ml-1 leading-tight">
                  Esta información es necesaria para hacerte llegar el dinero de tus comisiones.
                </p>
              </div>
            </>
          )}

          {profile?.role === 'partner' && (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Nombre del Negocio / B2B</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="text" 
                  required
                  placeholder="Nombre de tu empresa..."
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
            </div>
          )}

          {profile?.role === 'cliente' && (
            <div className="pt-4 border-t border-tp-gray-soft">
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">¿Tienes un código de descuento o fuiste referido?</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ej: MARIA20"
                  value={formData.referido_por}
                  onChange={(e) => setFormData({...formData, referido_por: e.target.value.toUpperCase()})}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-bold"
                />
                <button 
                  type="button"
                  onClick={() => validateReferralCode(formData.referido_por)}
                  disabled={isValidatingCode || !formData.referido_por}
                  className="px-4 py-2.5 bg-tp-blue text-white rounded-xl font-bold text-xs hover:bg-[#004a78] transition-all disabled:opacity-50"
                >
                  {isValidatingCode ? '...' : 'APLICAR'}
                </button>
              </div>
              {referralInfo.type && (
                <div className={cn(
                  "mt-2 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
                  referralInfo.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : 
                  referralInfo.type === 'error' ? "bg-red-50 text-tp-red border border-red-100" : 
                  "bg-blue-50 text-tp-blue border border-blue-100"
                )}>
                  {referralInfo.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {referralInfo.type === 'error' && <AlertCircle className="w-4 h-4" />}
                  {referralInfo.message}
                </div>
              )}
              {localStorage.getItem('pending_ref') && !referralInfo.valid && (
                <p className="text-[10px] text-tp-blue/40 mt-1 ml-1">Llegaste referido por un creador de contenido</p>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-tp-blue text-white py-4 rounded-xl font-bold hover:bg-[#004a78] transition-all mt-6 disabled:opacity-50 shadow-lg shadow-tp-blue/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : null}
            {isSubmitting ? 'Guardando...' : 'Finalizar Registro y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  const [showProfileCompletion, setShowProfileCompletion] = React.useState(false);

  React.useEffect(() => {
    if (!loading && profile) {
      const isComplete = profile.dni && profile.telefono && 
                        (profile.role !== 'cliente' || profile.direccion) &&
                        (profile.role !== 'agente' || profile.oficina) &&
                        (profile.role !== 'influencer' || (profile.redesSociales && profile.metodoCobro && profile.datosCobro && profile.tipoInfluencer)) &&
                        (profile.role !== 'partner' || profile.businessName);
      if (!isComplete) {
        setShowProfileCompletion(true);
      }
    }
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tp-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (showProfileCompletion) {
    return <ProfileCompletion onComplete={() => setShowProfileCompletion(false)} />;
  }

  return <>{children}</>;
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (!role || !allowedRoles.includes(role)) {
    return <div className="p-8 text-tp-red font-bold bg-red-50 rounded-2xl border border-red-100">
      Acceso Denegado. No tienes permisos para ver este módulo.
    </div>;
  }

  return <>{children}</>;
}

function Login() {
  const { user, loading, error: authError, clearError } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'login';
  const isLogin = mode === 'login';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  React.useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('pending_ref', refCode);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (user && !authError && !loading) {
      navigate('/dashboard');
    }
  }, [user, authError, loading, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    clearError();
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!isLogin && !password)) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    clearError();
    
    try {
      if (isLogin) {
        await loginWithEmail(email, password || 'dummy_password_for_now'); // In a real app, password is required for login too
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Por favor, inicia sesión.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El registro con correo y contraseña no está habilitado en Firebase. Por favor, habilítalo en la consola de Firebase (Authentication -> Sign-in method -> Email/Password).');
      } else {
        setError('Ocurrió un error. Verifica tus datos e intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-blue-light/30 p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] border border-tp-gray-soft p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-tp-blue/40 hover:text-tp-red text-xs font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          VOLVER AL INICIO
        </button>
        <div className="text-center mb-10">
          <div className="text-5xl font-black italic tracking-tighter flex justify-center mb-6">
            <span className="text-tp-blue">T</span>
            <span className="text-tp-red">P</span>
          </div>
          <h1 className="text-3xl font-black text-tp-blue tracking-tight mb-2">
            {isLogin ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
          </h1>
          <p className="text-tp-blue/60 font-medium">
            {isLogin ? 'Accede a tu panel de control de To Paquete.' : 'Empieza a enviar paquetes a Cuba hoy mismo.'}
          </p>
        </div>

        {(error || authError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-tp-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error || authError}</p>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-tp-gray-soft py-4 rounded-2xl font-black text-tp-blue hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            {isLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-tp-gray-soft"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-tp-blue/30">O usa tu email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input 
              type="email" 
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
            />
            <input 
              type="password" 
              placeholder={isLogin ? "Tu contraseña" : "Crea una contraseña"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-tp-blue text-white py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20 disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarme')}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm font-bold text-tp-blue/40">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button 
              onClick={() => navigate(`/login?mode=${isLogin ? 'register' : 'login'}`)}
              className="ml-2 text-tp-red hover:underline"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
          
          <div className="pt-6 border-t border-tp-gray-soft">
            <p className="text-xs font-black text-tp-blue/30 uppercase tracking-widest mb-3">¿Eres Agente o Influencer?</p>
            <button 
              onClick={() => navigate('/unirse')}
              className="inline-flex items-center gap-2 text-tp-blue font-black hover:text-tp-red transition-colors group"
            >
              ÚNETE AL PROGRAMA DE AFILIADOS
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { PublicLayout } from './components/PublicLayout';

import { Negocios } from './pages/Negocios';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/ser-agente" element={<PublicLayout><SerAgente /></PublicLayout>} />
          <Route path="/ser-agente-freelance" element={<PublicLayout><SerAgenteFreelance /></PublicLayout>} />
          <Route path="/ser-influencer" element={<PublicLayout><SerInfluencer /></PublicLayout>} />
          <Route path="/ser-partner" element={<PublicLayout><SerPartner /></PublicLayout>} />
          <Route path="/sobre-nosotros" element={<PublicLayout><SobreNosotros /></PublicLayout>} />
          <Route path="/terminos-condiciones" element={<PublicLayout><TerminosCondiciones /></PublicLayout>} />
          <Route path="/politica-privacidad" element={<PublicLayout><PoliticaPrivacidad /></PublicLayout>} />
          <Route path="/envios-aereos" element={<PublicLayout><EnviosAereos /></PublicLayout>} />
          <Route path="/envios-maritimos" element={<PublicLayout><EnviosMaritimos /></PublicLayout>} />
          <Route path="/carga-miscelanea" element={<PublicLayout><CargaMiscelanea /></PublicLayout>} />
          <Route path="/envio-electrodomesticos" element={<PublicLayout><EnvioElectrodomesticos /></PublicLayout>} />
          <Route path="/medicinas-exentas" element={<PublicLayout><MedicinasExentas /></PublicLayout>} />
          <Route path="/unirse" element={<Unirse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="recepcion" element={<RoleRoute allowedRoles={['admin', 'agente', 'partner']}><Recepcion /></RoleRoute>} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="negocios" element={<RoleRoute allowedRoles={['admin']}><Negocios /></RoleRoute>} />
            <Route path="usuarios" element={<RoleRoute allowedRoles={['admin']}><Usuarios /></RoleRoute>} />
            <Route path="b2b" element={<RoleRoute allowedRoles={['admin']}><AdminB2B /></RoleRoute>} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="mis-destinatarios" element={<MisDestinatarios />} />
            <Route path="mis-solicitudes" element={<MisSolicitudes />} />
            <Route path="solicitudes" element={<RoleRoute allowedRoles={['admin', 'agente']}><Solicitudes /></RoleRoute>} />
            <Route path="calculadora" element={<Calculadora />} />
            <Route path="ofertas" element={<OfertasSalidas />} />
            <Route path="red" element={<RedAfiliados />} />
            <Route path="logistica" element={<Logistica />} />
            <Route path="comisiones" element={<ComisionesAgente />} />
            <Route path="reportes" element={<RoleRoute allowedRoles={['admin']}><Reportes /></RoleRoute>} />
            <Route path="contabilidad" element={<RoleRoute allowedRoles={['admin', 'agente', 'partner']}><Contabilidad /></RoleRoute>} />
            <Route path="configuracion-afiliados" element={<RoleRoute allowedRoles={['admin']}><ConfiguracionAfiliados /></RoleRoute>} />
            <Route path="pagos" element={<RoleRoute allowedRoles={['admin', 'agente']}><Pagos /></RoleRoute>} />
            <Route path="seguimiento" element={<Seguimiento />} />
            <Route path="*" element={<div className="p-8 text-tp-blue font-medium">Módulo en desarrollo...</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
