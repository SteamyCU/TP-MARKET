import React, { useState, useEffect } from 'react';
import { Share2, Copy, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { normalizarCodigo } from '../../services/influencers';
import { actualizarCodigoPropioInfluencer } from '../../services/cupones';
import { cn } from '../../lib/utils';

function validarCodigo(cod: string): string | null {
  if (cod.length === 0) return null;
  if (cod.length < 4) return 'Mínimo 4 caracteres';
  if (/[^A-Z0-9-]/.test(cod)) return 'Solo letras, números y guiones';
  return null;
}

export function CodigoReferidoCard() {
  const { user, profile, updateProfile } = useAuth();

  const codigoActual = (profile?.codigoReferido as string) || '';
  const [codigoInput, setCodigoInput] = useState(codigoActual);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync if profile changes (e.g. after save)
  useEffect(() => {
    setCodigoInput((profile?.codigoReferido as string) || '');
  }, [profile?.codigoReferido]);

  const referralLink = `${window.location.origin}/login?mode=register&ref=${codigoInput || codigoActual}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalizado = normalizarCodigo(e.target.value);
    setCodigoInput(normalizado);
    setFeedback(null);
  };

  const errorValidacion = validarCodigo(codigoInput);
  const sinCambios = codigoInput === codigoActual;
  const puedeGuardar = !errorValidacion && !sinCambios && codigoInput.length >= 4;

  const guardar = async () => {
    if (!user?.uid || !puedeGuardar) return;
    setGuardando(true);
    setFeedback(null);
    try {
      const normalizado = await actualizarCodigoPropioInfluencer(user.uid, codigoInput);
      await updateProfile({ codigoReferido: normalizado });
      setCodigoInput(normalizado);
      setFeedback({ tipo: 'ok', msg: '✅ Código actualizado' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar el código';
      setFeedback({ tipo: 'error', msg });
    } finally {
      setGuardando(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tp-gray-soft shadow-sm">
      <h2 className="text-xl font-bold text-tp-blue mb-1 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-tp-red" />
        Tu enlace de promoción
      </h2>
      <p className="text-sm text-tp-blue/50 mb-5">
        Comparte este enlace en tus redes. Solo cuentan los clientes nuevos.
      </p>

      {/* Enlace completo + copiar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 bg-gray-50 border border-tp-gray-soft rounded-2xl px-4 py-4 font-mono text-sm text-tp-blue/70 break-all flex items-center">
          {referralLink}
        </div>
        <button
          onClick={copyLink}
          className={cn(
            'px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shrink-0',
            copied ? 'bg-green-500 text-white' : 'bg-tp-blue text-white hover:bg-[#004a78]',
          )}
        >
          {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? '¡COPIADO!' : 'COPIAR LINK'}
        </button>
      </div>

      {/* Editor de código */}
      <div className="border border-tp-gray-soft rounded-2xl p-4 bg-tp-blue-light/10 space-y-3">
        <div className="text-xs font-bold text-tp-blue/50 uppercase tracking-wider">
          Tu código personalizable
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={codigoInput}
            onChange={handleChange}
            maxLength={20}
            placeholder="MICODIGO"
            className={cn(
              'flex-1 px-4 py-3 rounded-xl border font-mono font-black text-lg text-tp-blue tracking-widest uppercase bg-white focus:outline-none focus:ring-2 transition-all',
              errorValidacion
                ? 'border-tp-red/50 focus:ring-tp-red/20'
                : 'border-tp-gray-soft focus:ring-tp-blue/20',
            )}
          />
          <button
            onClick={guardar}
            disabled={!puedeGuardar || guardando}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-tp-blue text-white hover:bg-[#004a78]"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando…' : 'Guardar código'}
          </button>
        </div>

        {/* Validación en tiempo real */}
        {errorValidacion && (
          <p className="flex items-center gap-1.5 text-xs text-tp-red font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorValidacion}
          </p>
        )}
        {!errorValidacion && sinCambios && codigoInput && (
          <p className="text-xs text-tp-blue/40">Este es tu código actual. Escribe uno nuevo para cambiarlo.</p>
        )}

        {/* Feedback guardado */}
        {feedback && (
          <p className={cn(
            'text-sm font-bold',
            feedback.tipo === 'ok' ? 'text-green-600' : 'text-tp-red',
          )}>
            {feedback.msg}
          </p>
        )}

        <p className="text-xs text-tp-blue/40 leading-relaxed">
          Puedes personalizar tu código para que sea más fácil de recordar y compartir.
          Ej: tu nombre, el de tu campaña o promoción. Solo letras, números y guiones, máx. 20 caracteres.
        </p>
      </div>
    </div>
  );
}
