import React, { useEffect, useState } from 'react';
import { Gift, Users, Wallet, Trophy, Copy, Check, MessageCircle, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import {
  getMiCodigoYEstadisticas, type MiCodigoYEstadisticas, type EstadoReferido,
} from '../services/referidos';

const ESTADO_LABEL: Record<EstadoReferido, { label: string; clase: string }> = {
  pendiente: { label: 'Pendiente', clase: 'bg-amber-100 text-amber-700' },
  premiado: { label: 'Premiado', clase: 'bg-green-100 text-green-700' },
  sin_premio: { label: 'Sin premio', clase: 'bg-gray-100 text-gray-500' },
  sospechoso: { label: 'En revisión', clase: 'bg-blue-100 text-blue-700' },
};

export function InvitaYGana() {
  const { profile } = useAuth();
  const [datos, setDatos] = useState<MiCodigoYEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const profileId = (profile?.id as string) || '';
    const nombre = (profile?.name as string) || profile?.email || 'Cliente';
    if (!profileId) return;
    let activo = true;
    getMiCodigoYEstadisticas(profileId, nombre)
      .then((d) => { if (activo) setDatos(d); })
      .catch((err) => {
        console.error('Error cargando Invita y Gana:', err);
        if (activo) setError('No se pudo cargar tu código. Inténtalo de nuevo más tarde.');
      })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [profile?.id, profile?.name, profile?.email]);

  const copiarEnlace = async () => {
    if (!datos) return;
    try {
      await navigator.clipboard.writeText(datos.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setError('No se pudo copiar el enlace.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-10 h-10 border-4 border-tp-blue/20 border-t-tp-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tp-blue to-[#004a78] text-white p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-tp-red/20 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-7 h-7 text-tp-red" />
            <h1 className="text-2xl md:text-3xl font-black">Invita y Gana</h1>
          </div>
          <p className="text-white/80 max-w-2xl leading-relaxed">
            Invita a tus amigos y familiares a ToPaquete. Por cada amigo que invites,
            ganas <strong className="text-white">5 € por cada 10 kg</strong> de su
            primer envío. Y tu amigo recibe <strong className="text-white">10% de
            descuento + domicilio gratis</strong> en su primer envío.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-sm">
            <Sparkles className="w-4 h-4 text-tp-red shrink-0" />
            <span>
              Ejemplo: si el primer envío de tu amigo es de <strong>30 kg</strong>,
              tú ganas <strong>15 €</strong> (3 × 5 €). ¡Puedes invitar a cuantos quieras!
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-tp-red text-sm font-medium">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Amigos invitados', value: datos?.totalInvitados ?? 0, icon: Users, color: 'text-tp-blue' },
          { label: 'Premios ganados', value: datos?.totalPremiados ?? 0, icon: Trophy, color: 'text-tp-red' },
          { label: 'Crédito disponible', value: `${(datos?.creditoDisponible ?? 0).toFixed(2)} €`, icon: Wallet, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-tp-gray-soft p-5 shadow-sm">
            <s.icon className={cn('w-5 h-5 mb-2', s.color)} />
            <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
            <div className="text-xs font-bold text-tp-blue/40 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Código y compartir */}
      <div className="bg-white rounded-3xl border border-tp-gray-soft p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-black text-tp-blue mb-1">Tu código de invitación</h2>
        <p className="text-sm text-tp-blue/50 mb-5">Compártelo con quien quieras. El descuento se aplica solo, sin que tengan que hacer nada más.</p>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5">
          <div className="flex-1 flex items-center justify-center bg-tp-blue-light/40 border-2 border-dashed border-tp-blue/30 rounded-2xl py-4">
            <span className="font-mono font-black text-2xl text-tp-blue tracking-widest">{datos?.codigo || '—'}</span>
          </div>
          <button
            onClick={copiarEnlace}
            className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-tp-blue text-white font-bold hover:bg-[#004a78] transition-colors"
          >
            {copiado ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiado ? 'Copiado' : '🔗 Copiar enlace'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={datos?.whatsappUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-5 h-5" />
            📱 Compartir por WhatsApp
          </a>
          <a
            href={datos?.emailUrl || '#'}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-tp-red text-white font-bold hover:bg-[#D91F33] transition-colors"
          >
            <Mail className="w-5 h-5" />
            ✉️ Enviar por correo
          </a>
        </div>
      </div>

      {/* Tabla de referidos */}
      <div className="bg-white rounded-3xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="p-6 border-b border-tp-gray-soft">
          <h2 className="text-lg font-black text-tp-blue">Mis invitados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-3">Amigo</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Premio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {(datos?.referidos || []).map((r) => {
                const estado = ESTADO_LABEL[r.estado];
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-tp-blue">{r.referido_nombre}</td>
                    <td className="px-6 py-4 text-tp-blue/50">
                      {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', estado.clase)}>
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {r.estado === 'premiado' && r.monto_premio ? `+${Number(r.monto_premio).toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                );
              })}
              {(datos?.referidos || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-tp-blue/30 italic">
                    Aún no has invitado a nadie. ¡Comparte tu código y empieza a ganar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InvitaYGana;
