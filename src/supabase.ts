import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Forma normalizada de usuario, compatible con el `auth.currentUser` que se usaba con Firebase. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export function toAuthUser(user: SupabaseUser | null | undefined): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.full_name || user.user_metadata?.name || null) as string | null,
    emailVerified: !!user.email_confirmed_at,
  };
}

/** Espejo síncrono del usuario autenticado, para código que antes usaba `auth.currentUser?.uid`. */
export const auth: { currentUser: AuthUser | null } = { currentUser: null };

supabase.auth.getSession().then(({ data }) => {
  auth.currentUser = toAuthUser(data.session?.user);
});
supabase.auth.onAuthStateChange((_event, session) => {
  auth.currentUser = toAuthUser(session?.user);
});

export const loginWithGoogle = (redirectPath?: string) => supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectPath
      ? `${window.location.origin}${redirectPath}`
      : `${window.location.origin}/dashboard`,
  },
});

export const registerWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const logout = () => supabase.auth.signOut();

export const resetPasswordForEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};
