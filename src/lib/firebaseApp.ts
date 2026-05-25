import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import type { Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

/**
 * DEBUG: Log environment variables to help the user identify missing keys.
 * These will show up in the browser console (F12).
 */
if (typeof window !== 'undefined') {
  console.log("--- Firebase Environment Check ---");
  console.log("API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Defined" : "❌ UNDEFINED");
  console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Defined" : "❌ UNDEFINED");
  console.log("Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Defined" : "❌ UNDEFINED");
  console.log("----------------------------------");
}

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

export const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length > 0) return getApp();
  
  if (!isFirebaseConfigured()) {
    // Return a dummy app during build time to prevent crashes
    return initializeApp({
      apiKey: "missing-key",
      projectId: "missing-project",
      authDomain: "missing-project.firebaseapp.com"
    }, "dummy-app");
  }
  
  return initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());
export const getFirebaseDatabase = (): Database => getDatabase(getFirebaseApp());

export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const database = getFirebaseDatabase();
export const googleProvider = new GoogleAuthProvider();

export const analytics: Analytics | undefined = 
  typeof window !== "undefined" && isFirebaseConfigured() 
    ? getAnalytics(app) 
    : undefined;

export const loginWithGoogle = async () => {
  if (!isFirebaseConfigured()) {
    const error = "CRITICAL: Firebase is not configured. Google login will not work. Please check your Vercel Environment Variables.";
    alert(error);
    throw new Error(error);
  }
  return signInWithPopup(auth, googleProvider);
};

export const logout = async () => signOut(auth);

// Re-exports for compatibility
export const readFirebaseConfig = () => ({ ...firebaseConfig });
export const isFirebaseConfiguredOnClient = isFirebaseConfigured;
export const getMissingFirebaseEnvKeys = () => {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  return missing;
};
export const getUnsetFirebaseEnvKeys = getMissingFirebaseEnvKeys;
export const getFirebaseConfigErrorMessage = () => {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length === 0) return "";
  return "Missing: " + missing.join(", ");
};
