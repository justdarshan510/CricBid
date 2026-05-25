'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, loginWithGoogle as firebaseLoginWithGoogle, logout } from '../lib/firebase';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, User } from 'firebase/auth';
import { writePersistedAuthUser } from '../utils/persistedAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    try {
      const result = await firebaseLoginWithGoogle();
      console.log('Google login success');
      return result;
    } catch (error: any) {
      console.error('Google login failed');
      console.error(error?.code);
      console.error(error?.message);
      throw error;
    }
  };

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      void setPersistence(auth, browserLocalPersistence);
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          writePersistedAuthUser({
            uid: currentUser.uid,
            name: currentUser.displayName ?? null,
            email: currentUser.email ?? null,
            photoURL: currentUser.photoURL ?? null,
          });
        } else {
          writePersistedAuthUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase auth initialization failed:", e);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
