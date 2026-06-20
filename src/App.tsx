import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import { registrarReferido } from './services/afiliados';
import { buscarCupon } from './services/cupones';
import { updateCliente, getClienteByEmail } from './services/clientes';
import { abrirSoporte } from './components/SoporteWidget';
import { auth, loginWithGoogle, logout, registerWithEmail, loginWithEmail, resetPasswordForEmail, updatePassword } from './supabase';
import { cn } from './lib/utils';
import { PAISES_RESIDENCIA } from './constants/estados';
import { AlertCircle, CheckCircle2, User as UserIcon, Phone, MapPin, Building2, CreditCard, LogOut, ArrowLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

const PREFIJOS_TELEFONO = [
  { code: '+34', flag: '🇪🇸', label: 'España' },
  { code: '+33', flag: '🇫🇷', label: 'Francia' },
  { code: '+39', flag: '🇮🇹', label: 'Italia' },
  { code: '+49', flag: '🇩🇪', label: 'Alemania' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal' },
  { code: '+44', flag: '🇬🇧', label: 'Reino Unido' },
  { code: '+41', flag: '🇨🇭', label: 'Suiza' },
  { code: '+32', flag: '🇧🇪', label: 'Bélgica' },
  { code: '+31', flag: '🇳🇱', label: 'Países Bajos' },
  { code: '+1', flag: '🇺🇸', label: 'EE.UU. / Canadá' },
];

// Separa un teléfono ya guardado (con prefijo) en { prefijo, numero } para
// poder editarlo con el selector de país. Si no reconoce ningún prefijo,
// asume España y deja el valor completo en el número.
function splitTelefono(value: string): { prefijo: string; numero: string } {
  if (!value) return { prefijo: '+34', numero: '' };
  const prefijo = [...PREFIJOS_TELEFONO]
    .sort((a, b) => b.code.length - a.code.length)
    .find((p) => value.startsWith(p.code));
  if (!prefijo) return { prefijo: '+34', numero: value };
  return { prefijo: prefijo.code, numero: value.slice(prefijo.code.length).trim() };
}

function isValidDniNieOPasaporte(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (!v) return false;
  const dni = /^\d{8}[A-Z]$/;
  const nie = /^[XYZ]\d{7}[A-Z]$/;
  const pasaporte = /^[A-Z0-9]{6,}$/;
  return dni.test(v) || nie.test(v) || pasaporte.test(v);
}

function isValidDireccion(value: string): boolean {
  const v = value.trim();
  return /[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/.test(v) && /\d/.test(v);
}

function ProfileCompletion({ onComplete }: { onComplete: () => void }) {
  const { profile, updateProfile } = useAuth();
  const esCliente = profile?.role === 'cliente';
  // El selector de prefijo de país solo aplica al rol cliente; el resto de
  // roles mantienen el campo de teléfono como texto libre, igual que antes.
  const telefonoInicial = esCliente
    ? splitTelefono(profile?.telefono || '')
    : { prefijo: '', numero: profile?.telefono || '' };
  const [formData, setFormData] = useState<any>({
    name: profile?.name || '',
    telefono: telefonoInicial.numero,
    telefonoPrefijo: telefonoInicial.prefijo,
    dni: profile?.dni || '',
    direccion: profile?.direccion || '',
    pais: profile?.pais || '',
    canalVenta: profile?.canalVenta || '',
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
  const [tocado, setTocado] = useState<{ dni: boolean; telefono: boolean; direccion: boolean }>({
    dni: false,
    telefono: false,
    direccion: false,
  });

  const dniValido = isValidDniNieOPasaporte(formData.dni);
  const telefonoValido = formData.telefono.replace(/\D/g, '').length >= 7;
  const direccionValida = isValidDireccion(formData.direccion);
  const nombreValido = formData.name.trim().length >= 3;
  const paisValido = Boolean(formData.pais);
  const formularioClienteValido = !esCliente || (nombreValido && dniValido && telefonoValido && direccionValida && paisValido);

  const validateReferralCode = async (code: string) => {
    if (!code) return;
    setIsValidatingCode(true);
    setReferralInfo({ valid: false, message: '', type: 'info' });
    
    try {
      const cupon = await buscarCupon(code);

      if (!cupon) {
        setReferralInfo({ valid: false, message: '❌ Código no encontrado', type: 'error' });
      } else {
        const unidad = cupon.descuento_tipo === 'porcentaje' ? '%' : '€';
        setReferralInfo({
          valid: true,
          message: `✅ Código ${code.toUpperCase()} aplicado — Obtienes ${cupon.descuento_valor}${unidad} de beneficio`,
          type: 'success'
        });
        setFormData({ ...formData, referido_por: code.toUpperCase(), beneficio_aplicado: cupon });
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
    if (esCliente && !formularioClienteValido) {
      setTocado({ dni: true, telefono: true, direccion: true });
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const finalData = {
        ...formData,
        telefono: esCliente
          ? `${formData.telefonoPrefijo}${formData.telefono.replace(/\s+/g, '')}`
          : formData.telefono,
        beneficio_usado: false
      };
      delete finalData.telefonoPrefijo;

      if (profile?.role === 'partner') {
        finalData.role = 'partner';
      }

      // Solo registrar referido si el código corresponde a un influencer (no a un cupón general)
      const cuponAplicado = formData.beneficio_aplicado;
      if (referralInfo.valid && cuponAplicado?.tipo === 'influencer' && cuponAplicado.influencer_id) {
        await registrarReferido(cuponAplicado.influencer_id, profile.uid || auth.currentUser?.uid || null);
      }

      await updateProfile(finalData);

      // 'profiles' es la fuente de verdad del portal, pero "Gestión de
      // Clientes" (admin) lee de la tabla 'clientes' — hay que mantenerla
      // sincronizada con los mismos datos.
      if (esCliente && profile?.email) {
        try {
          const clienteExistente = await getClienteByEmail(profile.email);
          if (clienteExistente) {
            await updateCliente(clienteExistente.id, {
              documentoIdentidad: finalData.dni,
              telefonoEspana: finalData.telefono,
              direccion: finalData.direccion,
              pais: finalData.pais,
            });
          }
        } catch (err) {
          console.error('Error sincronizando datos con clientes:', err);
        }
      }

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
                  onBlur={() => setTocado(t => ({ ...t, dni: true }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
              {esCliente && tocado.dni && formData.dni && !dniValido && (
                <p className="text-xs text-tp-red font-bold mt-1 ml-1">Introduce un DNI, NIE o pasaporte válido</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">Teléfono de Contacto</label>
              <div className="relative flex gap-2">
                {esCliente && (
                  <select
                    value={formData.telefonoPrefijo}
                    onChange={(e) => setFormData({...formData, telefonoPrefijo: e.target.value})}
                    className="px-2 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium text-sm"
                  >
                    {PREFIJOS_TELEFONO.map((p) => (
                      <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
                    ))}
                  </select>
                )}
                <div className="relative flex-1">
                  {!esCliente && <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />}
                  <input
                    type="tel"
                    required
                    placeholder={esCliente ? '600 000 000' : '+34 600 000 000'}
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    onBlur={() => setTocado(t => ({ ...t, telefono: true }))}
                    className={cn(
                      "w-full py-2.5 pr-4 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium",
                      esCliente ? "pl-4" : "pl-10"
                    )}
                  />
                </div>
              </div>
              {esCliente && tocado.telefono && formData.telefono && !telefonoValido && (
                <p className="text-xs text-tp-red font-bold mt-1 ml-1">El teléfono debe tener al menos 7 dígitos</p>
              )}
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
                  onBlur={() => setTocado(t => ({ ...t, direccion: true }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
              {esCliente && tocado.direccion && formData.direccion && !direccionValida && (
                <p className="text-xs text-tp-red font-bold mt-1 ml-1">Incluye el nombre de la calle y el número</p>
              )}
            </div>
          )}

          {esCliente && (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">País de Residencia</label>
              <select
                required
                value={formData.pais}
                onChange={(e) => setFormData({...formData, pais: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
              >
                <option value="">Selecciona tu país...</option>
                {PAISES_RESIDENCIA.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {profile?.role === 'agente' && (
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-1.5 ml-1">¿Por dónde sueles vender? (opcional)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <select
                  value={formData.canalVenta}
                  onChange={(e) => setFormData({...formData, canalVenta: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                >
                  <option value="">Selecciona un canal…</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Boca a boca">Boca a boca</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Otro">Otro</option>
                </select>
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
            disabled={isSubmitting || (esCliente && !formularioClienteValido)}
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
                        (profile.role !== 'cliente' || (profile.direccion && profile.pais)) &&
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
    return (
      <div className="p-8 bg-red-50 rounded-2xl border border-red-100 space-y-3">
        <p className="text-tp-red font-bold">Acceso denegado. No tienes permisos para ver este módulo.</p>
        <button
          onClick={abrirSoporte}
          className="text-sm font-bold text-tp-blue/60 hover:text-tp-red transition-colors underline"
        >
          ¿Crees que es un error? Contacta con soporte
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function Login() {
  const { user, loading, error: authError, clearError } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'login';
  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('pending_ref', refCode);
    }
    const roleParam = searchParams.get('role');
    if (roleParam && ['agente', 'influencer', 'partner', 'cliente'].includes(roleParam)) {
      localStorage.setItem('pending_role', roleParam);
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
      const { error: oauthError } = await loginWithGoogle();
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error("Login error:", err);
      setError('No se pudo iniciar el acceso con Google. Por favor, inténtalo de nuevo o usa tu correo y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, escribe tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    setError(null);
    clearError();

    try {
      const { error: resetError } = await resetPasswordForEmail(email);
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError('Ocurrió un error al enviar el correo. Verifica el correo e intenta de nuevo.');
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

    if (!isLogin) {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden. Vuelve a escribirlas.');
        return;
      }
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
      const msg: string = err?.message || '';
      if (msg.includes('already registered') || msg.includes('already in use')) {
        setError('Este correo ya está registrado. Por favor, inicia sesión.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else if (msg.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (msg.includes('security purposes') || msg.includes('after')) {
        setError('Por seguridad, espera un minuto antes de volver a intentarlo.');
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
            {isForgot ? '¿Olvidaste tu contraseña?' : isLogin ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
          </h1>
          <p className="text-tp-blue/60 font-medium">
            {isForgot
              ? 'Escribe tu correo y te enviaremos un enlace para restablecerla.'
              : isLogin ? 'Accede a tu panel de control de To Paquete.' : 'Empieza a enviar paquetes a Cuba hoy mismo.'}
          </p>
        </div>

        {(error || authError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-tp-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error || authError}</p>
          </div>
        )}

        {isForgot ? (
          resetSent ? (
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold">
                Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam).
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-tp-blue text-white py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )
        ) : (
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Tu contraseña" : "Crea una contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 pr-14 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-tp-blue/40 hover:text-tp-blue transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isLogin && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-6 py-4 pr-14 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-tp-blue/40 hover:text-tp-blue transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate('/login?mode=forgot')}
                  className="text-sm font-bold text-tp-blue/40 hover:text-tp-red transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-tp-blue text-white py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20 disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarme')}
            </button>
          </form>
        </div>
        )}

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm font-bold text-tp-blue/40">
            {isForgot ? (
              <button
                onClick={() => navigate('/login?mode=login')}
                className="text-tp-red hover:underline"
              >
                Volver a iniciar sesión
              </button>
            ) : (
              <>
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => navigate(`/login?mode=${isLogin ? 'register' : 'login'}`)}
                  className="ml-2 text-tp-red hover:underline"
                >
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </>
            )}
          </p>

          {!isForgot && (
            <div className="pt-6 border-t border-tp-gray-soft space-y-4">
              <div>
                <p className="text-xs font-black text-tp-blue/30 uppercase tracking-widest mb-3">¿Eres Agente o Influencer?</p>
                <button
                  onClick={() => navigate('/unirse')}
                  className="inline-flex items-center gap-2 text-tp-blue font-black hover:text-tp-red transition-colors group"
                >
                  ÚNETE AL PROGRAMA DE AFILIADOS
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="pt-2 border-t border-tp-gray-soft/50">
                <p className="text-xs text-tp-blue/30 font-bold mb-2">¿Tienes algún problema técnico?</p>
                <button
                  onClick={abrirSoporte}
                  className="text-xs font-black text-tp-blue/40 hover:text-tp-red transition-colors underline"
                >
                  Contactar con soporte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Vuelve a escribirlas.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      console.error("Update password error:", err);
      setError('Ocurrió un error al actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-blue-light/30 p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] border border-tp-gray-soft p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
          <div className="text-5xl font-black italic tracking-tighter flex justify-center mb-6">
            <span className="text-tp-blue">T</span>
            <span className="text-tp-red">P</span>
          </div>
          <h1 className="text-3xl font-black text-tp-blue tracking-tight mb-2">Nueva contraseña</h1>
          <p className="text-tp-blue/60 font-medium">Escribe tu nueva contraseña para continuar.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-tp-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">¡Contraseña actualizada! Te llevamos a tu panel...</p>
          </div>
        ) : loading ? (
          <p className="text-center text-tp-blue/40 font-bold">Cargando...</p>
        ) : !user ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-tp-red">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold">Este enlace no es válido o ha expirado. Solicita uno nuevo.</p>
            </div>
            <button
              onClick={() => navigate('/login?mode=forgot')}
              className="w-full bg-tp-blue text-white py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20"
            >
              Solicitar nuevo enlace
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 pr-14 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-tp-blue/40 hover:text-tp-blue transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-6 py-4 pr-14 bg-gray-50 border border-tp-gray-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-tp-blue/40 hover:text-tp-blue transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-tp-blue text-white py-4 rounded-2xl font-black hover:bg-[#004a78] transition-all shadow-lg shadow-tp-blue/20 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { PublicLayout } from './components/PublicLayout';

const lazyPage = <T extends Record<string, React.ComponentType<any>>>(
  importFn: () => Promise<T>,
  name: keyof T,
) => React.lazy(() => importFn().then((m) => ({ default: m[name] })));

const Landing = lazyPage(() => import('./pages/Landing'), 'Landing');
const Dashboard = lazyPage(() => import('./pages/Dashboard'), 'Dashboard');
const Recepcion = lazyPage(() => import('./pages/Recepcion'), 'Recepcion');
const Seguimiento = lazyPage(() => import('./pages/Seguimiento'), 'Seguimiento');
const Perfil = lazyPage(() => import('./pages/Perfil'), 'Perfil');
const Usuarios = lazyPage(() => import('./pages/Usuarios'), 'Usuarios');
const Reportes = lazyPage(() => import('./pages/Reportes'), 'Reportes');
const Pagos = lazyPage(() => import('./pages/Pagos'), 'Pagos');
const Contabilidad = lazyPage(() => import('./pages/Contabilidad'), 'Contabilidad');
const ConfiguracionAfiliados = lazyPage(() => import('./pages/ConfiguracionAfiliados'), 'ConfiguracionAfiliados');
const RedAfiliados = lazyPage(() => import('./pages/RedAfiliados'), 'RedAfiliados');
const Clientes = lazyPage(() => import('./pages/Clientes'), 'Clientes');
const Logistica = lazyPage(() => import('./pages/Logistica'), 'Logistica');
const MisDestinatarios = lazyPage(() => import('./pages/MisDestinatarios'), 'MisDestinatarios');
const MisSolicitudes = lazyPage(() => import('./pages/MisSolicitudes'), 'MisSolicitudes');
const Solicitudes = lazyPage(() => import('./pages/Solicitudes'), 'Solicitudes');
const MarketingClientes = lazyPage(() => import('./pages/MarketingClientes'), 'MarketingClientes');
const Configuracion = lazyPage(() => import('./pages/Configuracion'), 'Configuracion');
const Auditoria = lazyPage(() => import('./pages/Auditoria'), 'Auditoria');
const Calculadora = lazyPage(() => import('./pages/Calculadora'), 'Calculadora');
const OfertasSalidas = lazyPage(() => import('./pages/OfertasSalidas'), 'OfertasSalidas');
const AdminB2B = lazyPage(() => import('./pages/AdminB2B'), 'AdminB2B');
const SerAgente = lazyPage(() => import('./pages/SerAgente'), 'SerAgente');
const SerAgenteFreelance = lazyPage(() => import('./pages/SerAgenteFreelance'), 'SerAgenteFreelance');
const SerInfluencer = lazyPage(() => import('./pages/SerInfluencer'), 'SerInfluencer');
const SerPartner = lazyPage(() => import('./pages/SerPartner'), 'SerPartner');
const Franquicia = lazyPage(() => import('./pages/Franquicia'), 'Franquicia');
const PuntoDeEntrega = lazyPage(() => import('./pages/PuntoDeEntrega'), 'PuntoDeEntrega');
const SobreNosotros = lazyPage(() => import('./pages/SobreNosotros'), 'SobreNosotros');
const TerminosCondiciones = lazyPage(() => import('./pages/TerminosCondiciones'), 'TerminosCondiciones');
const PoliticaPrivacidad = lazyPage(() => import('./pages/PoliticaPrivacidad'), 'PoliticaPrivacidad');
const EnviosAereos = lazyPage(() => import('./pages/EnviosAereos'), 'EnviosAereos');
const EnviosMaritimos = lazyPage(() => import('./pages/EnviosMaritimos'), 'EnviosMaritimos');
const CargaMiscelanea = lazyPage(() => import('./pages/CargaMiscelanea'), 'CargaMiscelanea');
const EnvioElectrodomesticos = lazyPage(() => import('./pages/EnvioElectrodomesticos'), 'EnvioElectrodomesticos');
const MedicinasExentas = lazyPage(() => import('./pages/MedicinasExentas'), 'MedicinasExentas');
const ComisionesAgente = lazyPage(() => import('./pages/ComisionesAgente'), 'ComisionesAgente');
const Unirse = lazyPage(() => import('./pages/Unirse'), 'Unirse');
const Negocios = lazyPage(() => import('./pages/Negocios'), 'Negocios');
const SolicitudesAfiliados = lazyPage(() => import('./pages/SolicitudesAfiliados'), 'SolicitudesAfiliados');
const Incidencias = lazyPage(() => import('./pages/Incidencias'), 'Incidencias');
const Cupones = lazyPage(() => import('./pages/Cupones'), 'Cupones');
const KilosDisponibles = lazyPage(() => import('./pages/KilosDisponibles'), 'KilosDisponibles');
const AdminViajeros = lazyPage(() => import('./pages/AdminViajeros'), 'AdminViajeros');
const Layout = lazyPage(() => import('./components/Layout'), 'Layout');

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-tp-blue-light/30">
    <div className="w-10 h-10 border-4 border-tp-blue/20 border-t-tp-blue rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/ser-agente" element={<PublicLayout><SerAgente /></PublicLayout>} />
          <Route path="/ser-agente-freelance" element={<PublicLayout><SerAgenteFreelance /></PublicLayout>} />
          <Route path="/ser-influencer" element={<PublicLayout><SerInfluencer /></PublicLayout>} />
          <Route path="/ser-partner" element={<PublicLayout><SerPartner /></PublicLayout>} />
          <Route path="/franquicia" element={<PublicLayout><Franquicia /></PublicLayout>} />
          <Route path="/punto-de-entrega" element={<PublicLayout><PuntoDeEntrega /></PublicLayout>} />
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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="recepcion" element={<RoleRoute allowedRoles={['admin', 'agente', 'partner', 'logistica']}><Recepcion /></RoleRoute>} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="negocios" element={<RoleRoute allowedRoles={['admin']}><Negocios /></RoleRoute>} />
            <Route path="solicitudes-afiliados" element={<RoleRoute allowedRoles={['admin']}><SolicitudesAfiliados /></RoleRoute>} />
            <Route path="usuarios" element={<RoleRoute allowedRoles={['admin']}><Usuarios /></RoleRoute>} />
            <Route path="b2b" element={<RoleRoute allowedRoles={['admin']}><AdminB2B /></RoleRoute>} />
            <Route path="clientes" element={<RoleRoute allowedRoles={['admin', 'agente']}><Clientes /></RoleRoute>} />
            <Route path="mis-destinatarios" element={<MisDestinatarios />} />
            <Route path="mis-solicitudes" element={<MisSolicitudes />} />
            <Route path="solicitudes" element={<RoleRoute allowedRoles={['admin', 'agente']}><Solicitudes /></RoleRoute>} />
            <Route path="marketing" element={<RoleRoute allowedRoles={['admin', 'agente']}><MarketingClientes /></RoleRoute>} />
            <Route path="calculadora" element={<Calculadora />} />
            <Route path="ofertas" element={<OfertasSalidas />} />
            <Route path="red" element={<RedAfiliados />} />
            <Route path="logistica" element={<RoleRoute allowedRoles={['admin', 'agente', 'partner', 'logistica']}><Logistica /></RoleRoute>} />
            <Route path="comisiones" element={<ComisionesAgente />} />
            <Route path="reportes" element={<RoleRoute allowedRoles={['admin', 'contabilidad']}><Reportes /></RoleRoute>} />
            <Route path="contabilidad" element={<RoleRoute allowedRoles={['admin', 'agente', 'partner', 'contabilidad']}><Contabilidad /></RoleRoute>} />
            <Route path="configuracion-afiliados" element={<RoleRoute allowedRoles={['admin']}><ConfiguracionAfiliados /></RoleRoute>} />
            <Route path="configuracion" element={<RoleRoute allowedRoles={['admin']}><Configuracion /></RoleRoute>} />
            <Route path="auditoria" element={<RoleRoute allowedRoles={['admin']}><Auditoria /></RoleRoute>} />
            <Route path="pagos" element={<RoleRoute allowedRoles={['admin', 'agente', 'contabilidad']}><Pagos /></RoleRoute>} />
            <Route path="incidencias" element={<RoleRoute allowedRoles={['admin', 'agente', 'logistica']}><Incidencias /></RoleRoute>} />
            <Route path="cupones" element={<RoleRoute allowedRoles={['admin']}><Cupones /></RoleRoute>} />
            <Route path="kilos-disponibles" element={<RoleRoute allowedRoles={['cliente']}><KilosDisponibles /></RoleRoute>} />
            <Route path="admin/viajeros" element={<RoleRoute allowedRoles={['admin']}><AdminViajeros /></RoleRoute>} />
            <Route path="seguimiento" element={<Seguimiento />} />
            <Route path="*" element={<div className="p-8 text-tp-blue font-medium">Módulo en desarrollo...</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
