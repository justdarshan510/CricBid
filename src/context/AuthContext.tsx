'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../lib/firebaseApp';
import { 
  browserLocalPersistence, 
  onAuthStateChanged, 
  setPersistence, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify Firebase config
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.warn("Firebase config missing: NEXT_PUBLIC_FIREBASE_API_KEY is not defined. Using default configuration.");
    }
  }, []);

  const loginWithGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
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
        console.error("Firebase configuration missing or incorrect. Check your environment variables (API Key, Project ID, Auth Domain).");
        console.error("Common fix: Ensure Identity Platform is enabled in Firebase Console and the Google provider is active.");
      }

      alert(error.message);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email registration failed", error);
      throw error;
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
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
