'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { 
  browserLocalPersistence, 
  onAuthStateChanged, 
  setPersistence, 
  signInWithPopup,
  User 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
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

  // Verify Firebase config
  useEffect(() => {
    console.log("Firebase API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.error("Firebase config missing: NEXT_PUBLIC_FIREBASE_API_KEY is not defined");
    }
  }, []);

  const loginWithGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const result = await signInWithPopup(auth, googleProvider);

      console.log("Google login success");
      console.log("User:", result.user);
    } catch (error: any) {
      console.error("Google login failed");
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);

      if (error.code === 'auth/popup-blocked') {
        console.error("Popup blocked by browser. Please allow popups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error("Unauthorized domain. Add this domain to Firebase Console > Authentication > Settings.");
      } else if (error.code === 'auth/configuration-not-found') {
        console.error("Firebase configuration missing or incorrect.");
      }

      alert(error.message);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Current user state changed:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
