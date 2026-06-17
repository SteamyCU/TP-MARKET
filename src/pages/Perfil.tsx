import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { User as UserIcon, Phone, MapPin, Building2, CreditCard, CheckCircle2, AlertCircle, Banknote, ShieldCheck, Upload, FileCheck2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { subirDocumentoIdentidad } from '../services/afiliados';

export function Perfil() {
  const { user, profile, updateProfile } = useAuth();
  const identidadVerificada = Boolean(profile?.documentoIdentidadUrl);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docSuccess, setDocSuccess] = useState(false);

  const handleUploadDocumento = async () => {
    if (!idFile || !user?.uid) return;
    setUploadingDoc(true);
    setDocError(null);
    setDocSuccess(false);
    try {
      const path = await subirDocumentoIdentidad(user.uid, idFile);
      await updateProfile({ documentoIdentidadUrl: path });
      setDocSuccess(true);
      setIdFile(null);
      setTimeout(() => setDocSuccess(false), 4000);
    } catch (err) {
      console.error('Error subiendo documento de identidad:', err);
      setDocError('No se pudo subir el documento. Verifica el archivo (imagen o PDF) e intenta de nuevo.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    telefono: profile?.telefono || '',
    dni: profile?.dni || '',
    direccion: profile?.direccion || '',
    oficina: profile?.oficina || '',
    precioPorKilo: profile?.precioPorKilo || 0,
    tipoInfluencer: profile?.tipoInfluencer || '',
    redesSociales: profile?.redesSociales || '',
    metodoCobro: profile?.metodoCobro || '',
    datosCobro: profile?.datosCobro || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError('Error al actualizar el perfil. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tp-blue mb-2">Mi Perfil</h1>
        <p className="text-tp-blue/60">Gestiona tu información personal y de contacto</p>
      </div>

      <div className="bg-white rounded-2xl border border-tp-gray-soft p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8 p-4 bg-tp-blue-light/30 rounded-xl border border-tp-blue/10">
          <div className="w-16 h-16 bg-tp-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.charAt(0) || profile?.email?.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-tp-blue text-lg">{profile?.name || 'Usuario'}</h2>
            <p className="text-tp-blue/60 text-sm">{profile?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-tp-red/10 text-tp-red text-[10px] font-bold uppercase tracking-wider rounded">
              {profile?.role}
            </span>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Perfil actualizado correctamente</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-tp-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">DNI / NIE / Pasaporte</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                  <input 
                    type="text" 
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                  <input 
                    type="tel" 
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                  />
                </div>
              </div>
            </div>

            {profile?.role === 'cliente' && (
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Dirección de Recogida habitual</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                  <input 
                    type="text" 
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                  />
                </div>
              </div>
            )}

            {profile?.role === 'influencer' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Tipo de Afiliado</label>
                    <select 
                      required
                      value={formData.tipoInfluencer}
                      onChange={(e) => setFormData({...formData, tipoInfluencer: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                    >
                      <option value="">Selecciona un tipo...</option>
                      <option value="Influencer RRSS">Influencer RRSS (Volumen variable, audiencia masiva)</option>
                      <option value="Blogger / youtuber">Blogger / youtuber (SEO, tráfico orgánico)</option>
                      <option value="Newsletter">Newsletter (Audiencia fidelizada, alta conversión)</option>
                      <option value="Podcast / podcast">Podcast / podcast (Código promo, sin link directo)</option>
                      <option value="Sub-afiliado">Sub-afiliado (Refiere a otro afiliado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Método de Cobro</label>
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
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Enlaces de Redes Sociales / Plataformas</label>
                  <textarea 
                    required
                    placeholder="Pega aquí los enlaces a tus perfiles de Instagram, TikTok, YouTube, Blog, etc."
                    value={formData.redesSociales}
                    onChange={(e) => setFormData({...formData, redesSociales: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Datos para el Cobro</label>
                  <textarea 
                    required
                    placeholder={formData.metodoCobro === 'Efectivo (Cuba)' ? 'Indica la dirección y persona que recibirá el efectivo en Cuba...' : 'Indica tu IBAN, cuenta de PayPal, o detalles bancarios...'}
                    value={formData.datosCobro}
                    onChange={(e) => setFormData({...formData, datosCobro: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium min-h-[100px]"
                  />
                  <p className="text-xs text-tp-blue/50 mt-1 ml-1">
                    Esta información es necesaria para hacerte llegar el dinero de tus comisiones.
                  </p>
                </div>
              </>
            )}
            {profile?.role === 'agente' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Oficina / Sucursal</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                    <input 
                      type="text" 
                      required
                      value={formData.oficina}
                      onChange={(e) => setFormData({...formData, oficina: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase tracking-wider mb-2 ml-1">Precio por Kilo (€) - Cobro a Clientes</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.precioPorKilo}
                      onChange={(e) => setFormData({...formData, precioPorKilo: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-tp-blue font-medium"
                    />
                  </div>
                  <p className="text-xs text-tp-blue/50 mt-1 ml-1">Este precio será visible para tus clientes en su calculadora de envíos.</p>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-tp-gray-soft flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-tp-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-[#004a78] transition-all disabled:opacity-50 shadow-lg shadow-tp-blue/20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Verificación de identidad (necesaria para el Programa de Viajeros) */}
      <div className="mt-8 bg-white rounded-2xl border border-tp-gray-soft p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            identidadVerificada ? 'bg-green-100 text-green-600' : 'bg-tp-blue-light/40 text-tp-blue',
          )}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-tp-blue text-lg flex items-center gap-2">
              Verificación de identidad
              {identidadVerificada && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Verificada
                </span>
              )}
            </h2>
            <p className="text-sm text-tp-blue/60 mt-1 leading-relaxed">
              Sube tu DNI, NIE o pasaporte para verificar tu identidad. Es necesario para
              publicar viajes en el <strong>Programa de Viajeros</strong>. Tu documento se
              guarda de forma privada y solo lo revisa el equipo de ToPaquete.
            </p>

            {docSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-600 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Documento subido correctamente. Tu identidad ya está verificada.
              </div>
            )}
            {docError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-tp-red text-sm font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" /> {docError}
              </div>
            )}

            {identidadVerificada ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-tp-blue/70 font-medium">
                <FileCheck2 className="w-4 h-4 text-green-600" />
                Documento registrado. Puedes subir uno nuevo si necesitas actualizarlo.
              </div>
            ) : null}

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => { setIdFile(e.target.files?.[0] || null); setDocError(null); }}
                  className="hidden"
                />
                <div className="px-4 py-2.5 bg-gray-50 border border-dashed border-tp-gray-soft rounded-xl text-sm font-medium text-tp-blue/70 flex items-center gap-2 hover:border-tp-blue/40 transition-colors">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="truncate">{idFile ? idFile.name : 'Seleccionar archivo (imagen o PDF)'}</span>
                </div>
              </label>
              <button
                type="button"
                onClick={handleUploadDocumento}
                disabled={!idFile || uploadingDoc}
                className="px-6 py-2.5 bg-tp-blue text-white rounded-xl font-bold hover:bg-[#004a78] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                {uploadingDoc ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploadingDoc ? 'Subiendo…' : (identidadVerificada ? 'Actualizar documento' : 'Subir documento')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Cards Section */}
      {(profile?.role === 'agente' || profile?.role === 'influencer') && (
        <div className="mt-12 space-y-8">
          <div className="bg-white rounded-2xl border border-tp-gray-soft p-8 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tp-blue/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-xl font-black text-tp-blue mb-6">
              {profile?.role === 'agente' ? '¿En qué te diferencias de un Influencer?' : '¿Cómo funciona tu trabajo?'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className={cn(
                  "p-6 rounded-2xl border-2 transition-all",
                  profile?.role === 'agente' ? "border-tp-blue bg-tp-blue/5" : "border-tp-gray-soft opacity-60"
                )}>
                  <h3 className="font-black text-tp-blue uppercase tracking-wider mb-3">AGENTE TO PAQUETE</h3>
                  <p className="text-sm text-tp-blue/80 leading-relaxed">
                    Como agente, tu trabajo es atender directamente a tus clientes. Tú eres su punto de contacto, resuelves sus dudas, gestionas sus envíos y mantienes la relación con ellos.
                  </p>
                  <p className="text-sm text-tp-blue/80 leading-relaxed mt-3">
                    A cambio de ese trabajo activo, tu comisión por kilo es mayor.
                  </p>
                  <p className="text-sm text-tp-blue/80 leading-relaxed mt-3 font-bold">
                    Por eso To Paquete te proporciona soporte WhatsApp Business: porque tú sí atiendes, y necesitas herramientas para hacerlo bien.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={cn(
                  "p-6 rounded-2xl border-2 transition-all",
                  profile?.role === 'influencer' ? "border-tp-red bg-tp-red/5" : "border-tp-gray-soft opacity-60"
                )}>
                  <h3 className="font-black text-tp-red uppercase tracking-wider mb-3">INFLUENCER TO PAQUETE</h3>
                  <p className="text-sm text-tp-blue/80 leading-relaxed">
                    El influencer no atiende clientes directamente. Su trabajo es crear contenido en redes sociales, compartir su código, y dejar que el sistema trabaje por él.
                  </p>
                  <p className="text-sm text-tp-blue/80 leading-relaxed mt-3">
                    Una publicación puede traer clientes durante meses. Por eso su ingreso es pasivo.
                  </p>
                  <p className="text-sm text-tp-blue/80 leading-relaxed mt-3 font-bold">
                    A cambio, su comisión por kilo es menor, porque el esfuerzo diario también lo es.
                  </p>
                </div>
              </div>
            </div>

            {profile?.role === 'influencer' && (
              <div className="mb-8 p-6 bg-tp-blue-light/30 rounded-2xl border border-tp-blue/10">
                <h3 className="font-black text-tp-blue uppercase tracking-wider mb-3">¿Y quién atiende a los clientes que traes?</h3>
                <p className="text-sm text-tp-blue/80 leading-relaxed">
                  El equipo de To Paquete y los agentes de la red. Tú captaste al cliente. Nosotros lo atendemos. Tú sigues cobrando comisión por cada envío que ese cliente realice, para siempre.
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-tp-blue text-white">
                    <th className="p-3 text-left border border-white/10"></th>
                    <th className={cn("p-3 text-center border border-white/10", profile?.role === 'agente' && "bg-tp-blue-light text-tp-blue")}>AGENTE</th>
                    <th className={cn("p-3 text-center border border-white/10", profile?.role === 'influencer' && "bg-tp-red text-white")}>INFLUENCER</th>
                  </tr>
                </thead>
                <tbody className="text-tp-blue">
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-tp-gray-soft">Atención al cliente</td>
                    <td className="p-3 text-center border border-tp-gray-soft">✅ Sí, diaria</td>
                    <td className="p-3 text-center border border-tp-gray-soft">❌ No</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-tp-gray-soft">Trabajo constante</td>
                    <td className="p-3 text-center border border-tp-gray-soft">✅ Necesario</td>
                    <td className="p-3 text-center border border-tp-gray-soft">🔄 Opcional</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-tp-gray-soft">Herramienta WA Biz</td>
                    <td className="p-3 text-center border border-tp-gray-soft">✅ Incluida</td>
                    <td className="p-3 text-center border border-tp-gray-soft">❌ No aplica</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-tp-gray-soft">Tipo de ingreso</td>
                    <td className="p-3 text-center border border-tp-gray-soft">Activo</td>
                    <td className="p-3 text-center border border-tp-gray-soft">Pasivo</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-tp-gray-soft">Comisión por kg</td>
                    <td className="p-3 text-center border border-tp-gray-soft">€1.50</td>
                    <td className="p-3 text-center border border-tp-gray-soft">€0.50</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-tp-gray-soft">Canal de captación</td>
                    <td className="p-3 text-center border border-tp-gray-soft">Presencial</td>
                    <td className="p-3 text-center border border-tp-gray-soft">Redes soc.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-[10px] text-tp-blue/40 font-bold italic text-center">
              "Ambos perfiles son compatibles con el servicio de compras online para clientes. La diferencia está en cómo captas y atiendes, no en lo que ofreces."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
