import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import type { Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";
import { CRICBID_FIREBASE_DEFAULTS } from "./firebaseDefaults";

const clean = (val: any) => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
};

/**
 * Resolve the Firebase configuration.
 * Merges Vercel environment variables with built-in defaults.
 */
const getResolvedConfig = (): FirebaseOptions => {
  const defaults = CRICBID_FIREBASE_DEFAULTS;
  
  const apiKey = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const projectId = clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  // If no environment variables are detected, return the working defaults.
  if (!apiKey && !projectId) {
    return defaults;
  }

  // If environment variables exist, merge them with defaults to prevent missing fields.
  // This ensures that even if you only set the API Key, other fields stay valid.
  return {
    ...defaults,
    apiKey: apiKey || defaults.apiKey,
    projectId: projectId || defaults.projectId,
    authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || (projectId ? `${projectId}.firebaseapp.com` : defaults.authDomain),
    databaseURL: clean(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) || defaults.databaseURL,
    storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || defaults.storageBucket,
    messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || defaults.messagingSenderId,
    appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || defaults.appId,
    measurementId: clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || defaults.measurementId,
  };
};

export const firebaseConfig = getResolvedConfig();

/**
 * DEBUG: Log initialization status to browser console (F12)
 */
if (typeof window !== 'undefined') {
  const envKey = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log("--- Firebase Configuration ---");
  console.log("Source:", envKey ? "Vercel Environment Variables" : "CricBid Defaults");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("API Key Status:", firebaseConfig.apiKey ? "✅ Set" : "❌ Missing");
  console.log("------------------------------");
}

export const getFirebaseApp = (): FirebaseApp => {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  return initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());
export const getFirebaseDatabase = (): Database => getDatabase(getFirebaseApp());

export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const database = getFirebaseDatabase();
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const analytics: Analytics | undefined = 
  typeof window !== "undefined" ? getAnalytics(app) : undefined;

export const loginWithGoogle = async () => {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('missing')) {
    const error = "Firebase API Key is invalid. Please check your Vercel Environment Variables.";
    alert(error);
    throw new Error(error);
  }
  return signInWithPopup(auth, googleProvider);
};

export const logout = async () => signOut(auth);

// Compatibility re-exports
export const readFirebaseConfig = () => ({ ...firebaseConfig });
export const isFirebaseConfigured = () => !!firebaseConfig.apiKey;
export const isFirebaseConfiguredOnClient = isFirebaseConfigured;
export const getMissingFirebaseEnvKeys = () => {
  const missing: string[] = [];
  if (!clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  return missing;
};
export const getUnsetFirebaseEnvKeys = () => {
  const unset: string[] = [];
  const keys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  keys.forEach(key => {
    if (!clean(process.env[key])) unset.push(key);
  });
  return unset;
};
export const getFirebaseConfigErrorMessage = () => {
  const missing = getMissingFirebaseEnvKeys();
  return missing.length ? "Note: Using defaults. Missing env keys: " + missing.join(", ") : "";
};
