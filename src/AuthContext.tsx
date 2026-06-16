import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, toAuthUser, type AuthUser } from './supabase';

type RolUsuario = 'admin' | 'agente' | 'influencer' | 'partner' | 'cliente' | 'contabilidad' | 'logistica';

interface AuthContextType {
  user: AuthUser | null;
  role: RolUsuario | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: any) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  error: null,
  updateProfile: async () => {},
  clearError: () => {}
});

const ROLE_LABELS: Record<string, string> = {
  agente: 'Agente',
  influencer: 'Influencer',
  partner: 'Partner B2B',
  cliente: 'Cliente',
  admin: 'Administrador',
  contabilidad: 'Contabilidad',
  logistica: 'Logística',
};

function buildProfile(row: { id: string; email: string; role: string; extra: Record<string, unknown> }) {
  return { ...row.extra, id: row.id, email: row.email, role: row.role };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<RolUsuario | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const updateProfile = async (data: any) => {
    if (!user) return;
    const { role: newRole, email: newEmail, id: _id, ...rest } = data;
    const mergedExtra = { ...(profile || {}), ...rest };
    delete mergedExtra.role;
    delete mergedExtra.email;
    delete mergedExtra.id;

    const update: Record<string, unknown> = { extra: mergedExtra };
    if (newRole) update.role = newRole;
    if (newEmail) update.email = newEmail;

    const { error: updateError } = await supabase.from('profiles').update(update).eq('id', user.uid);
    if (updateError) {
      console.error('No se pudo actualizar el perfil:', updateError);
      return;
    }
    setProfile((prev: any) => ({ ...prev, ...data }));
    if (newRole) setRole(newRole);
  };

  /** Carga (o crea) el perfil del usuario autenticado en la tabla 'profiles'. */
  const cargarPerfil = async (currentUser: AuthUser) => {
    const { data: row, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, role, extra')
      .eq('id', currentUser.uid)
      .maybeSingle();

    if (selectError) {
      console.error('Error cargando el perfil:', selectError);
      setLoading(false);
      return;
    }

    const bootstrapAdmin = import.meta.env.VITE_BOOTSTRAP_ADMIN;

    if (row) {
      const currentRole = row.role as RolUsuario;
      const forcedRole: RolUsuario = (bootstrapAdmin && currentUser.email === bootstrapAdmin) ? 'admin' : currentRole;

      // Aviso si intenta registrarse con otro rol teniendo ya uno asignado
      const pendingRole = localStorage.getItem('pending_role');
      if (pendingRole && pendingRole !== currentRole && forcedRole === currentRole) {
        setError(`Este correo ya está registrado como ${ROLE_LABELS[currentRole] || currentRole}. No puedes registrarte como ${ROLE_LABELS[pendingRole] || pendingRole}.`);
        localStorage.removeItem('pending_role');
      }

      if (forcedRole !== currentRole) {
        const { error: updateError } = await supabase.from('profiles').update({ role: forcedRole }).eq('id', currentUser.uid);
        if (updateError) console.error('No se pudo actualizar el rol:', updateError);
        setRole(forcedRole);
        setProfile(buildProfile({ ...row, role: forcedRole }));
      } else {
        setRole(currentRole);
        setProfile(buildProfile(row));
      }
    } else {
      // Primer login: crear el perfil
      const pendingRole = localStorage.getItem('pending_role') as RolUsuario | null;
      let newRole: RolUsuario = 'cliente';

      if (bootstrapAdmin && currentUser.email === bootstrapAdmin) {
        newRole = 'admin';
      } else if (pendingRole && ['agente', 'influencer', 'partner', 'cliente'].includes(pendingRole)) {
        newRole = pendingRole;
        localStorage.removeItem('pending_role');
      }

      const extra: Record<string, unknown> = {
        name: currentUser.displayName || '',
      };

      if (newRole === 'influencer') {
        extra.codigoReferido = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        extra.tier = 'bronze';
        extra.tasaComision = 0.03;
        extra.balanceComisiones = 0;
      } else if (newRole === 'partner') {
        extra.apiKey = `pk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        extra.balance = 0;
      }

      // Código de referido pendiente (registro vía enlace de afiliado).
      // Aplica el cupón via RPC (valida + incrementa usos_actuales) y vincula referidoPor.
      const pendingRef = localStorage.getItem('pending_ref');
      if (pendingRef) {
        try {
          const { data: resultado } = await supabase.rpc('aplicar_cupon_referido', {
            p_codigo: pendingRef.toUpperCase().trim(),
          });
          if (resultado?.ok && resultado.tipo === 'influencer' && resultado.influencer_id) {
            extra.referidoPor = resultado.influencer_id;
          }
        } catch (err) {
          console.error('Error procesando código de referido:', err);
        }
        localStorage.removeItem('pending_ref');
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: currentUser.uid,
        email: currentUser.email,
        role: newRole,
        extra,
      });

      if (insertError) {
        console.error('No se pudo crear el perfil:', insertError);
      } else {
        setRole(newRole);
        setProfile(buildProfile({ id: currentUser.uid, email: currentUser.email || '', role: newRole, extra }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    let activo = true;

    const procesarUsuario = async (authUser: AuthUser | null) => {
      setUser(authUser);
      if (authUser) {
        await cargarPerfil(authUser);
      } else {
        setRole(null);
        setProfile(null);
        setLoading(false);
      }
    };

    // onAuthStateChange emite el evento INITIAL_SESSION al suscribirse,
    // por lo que no es necesario llamar a getSession() por separado.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!activo) return;
      procesarUsuario(toAuthUser(session?.user));
    });

    return () => {
      activo = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, error, updateProfile, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
