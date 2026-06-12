import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

type RolUsuario = 'admin' | 'agente' | 'influencer' | 'partner' | 'cliente' | 'contabilidad' | 'logistica';

interface AuthContextType {
  user: User | null;
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

import { handleFirestoreError, OperationType } from './lib/firestore-errors';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<RolUsuario | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const updateProfile = async (data: any) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      setProfile(prev => ({ ...prev, ...data }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const currentRole = data.role;

            // El rol vive en el documento del usuario. Único bootstrap permitido:
            // el email configurado en VITE_BOOTSTRAP_ADMIN se eleva a admin.
            const bootstrapAdmin = import.meta.env.VITE_BOOTSTRAP_ADMIN;
            const forcedRole = (bootstrapAdmin && currentUser.email === bootstrapAdmin) ? 'admin' : currentRole;

            // Aviso si intenta registrarse con otro rol teniendo ya uno asignado
            const pendingRole = localStorage.getItem('pending_role');
            if (pendingRole && pendingRole !== currentRole && forcedRole === currentRole) {
              const roleLabels: any = {
                agente: 'Agente',
                influencer: 'Influencer',
                partner: 'Partner B2B',
                cliente: 'Cliente',
                admin: 'Administrador',
                contabilidad: 'Contabilidad',
                logistica: 'Logística'
              };
              setError(`Este correo ya está registrado como ${roleLabels[currentRole] || currentRole}. No puedes registrarte como ${roleLabels[pendingRole] || pendingRole}.`);
              localStorage.removeItem('pending_role');
            }

            if (forcedRole !== currentRole) {
              try {
                await setDoc(userDocRef, { role: forcedRole }, { merge: true });
                setRole(forcedRole);
                setProfile({ ...data, role: forcedRole });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
              }
            } else {
              setRole(currentRole);
              setProfile(data);
            }
          } else {
            // Check for pending registration role in localStorage
            const pendingRole = localStorage.getItem('pending_role') as any;
            let newRole: RolUsuario = 'cliente';

            const bootstrapAdmin = import.meta.env.VITE_BOOTSTRAP_ADMIN;
            if (bootstrapAdmin && currentUser.email === bootstrapAdmin) {
              newRole = 'admin';
            } else if (pendingRole && ['agente', 'influencer', 'partner', 'cliente'].includes(pendingRole)) {
              newRole = pendingRole;
              localStorage.removeItem('pending_role');
            }

            const initialProfile: any = {
              email: currentUser.email,
              name: currentUser.displayName || '',
              role: newRole,
              createdAt: serverTimestamp()
            };

            // Auto-generate specific fields based on role
            if (newRole === 'influencer') {
              initialProfile.codigoReferido = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              initialProfile.tier = 'bronze';
              initialProfile.tasaComision = 0.03;
              initialProfile.balanceComisiones = 0;
            } else if (newRole === 'partner') {
              initialProfile.apiKey = `pk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
              initialProfile.balance = 0;
            }

            // Check for pending referral code
            const pendingRef = localStorage.getItem('pending_ref');
            if (pendingRef) {
              try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('codigoReferido', '==', pendingRef));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                  const referrerDoc = querySnapshot.docs[0];
                  initialProfile.referidoPor = referrerDoc.id;
                }
              } catch (err) {
                console.error("Error looking up referrer:", err);
              }
              localStorage.removeItem('pending_ref');
            }

            try {
              await setDoc(userDocRef, initialProfile);
              setRole(newRole);
              setProfile(initialProfile);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, error, updateProfile, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
