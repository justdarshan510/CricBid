import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import type { Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

/**
 * Firebase configuration using environment variables.
 */
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

/**
 * Returns a copy of the Firebase configuration.
 */
export const readFirebaseConfig = (): FirebaseOptions => {
  return { ...firebaseConfig };
};

/**
 * Checks if the minimum required Firebase configuration is present.
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey && 
    firebaseConfig.projectId && 
    firebaseConfig.databaseURL
  );
};

/**
 * Client-side check for Firebase configuration.
 */
export const isFirebaseConfiguredOnClient = (): boolean => {
  return isFirebaseConfigured();
};

/**
 * Returns a list of missing required environment variables.
 */
export const getMissingFirebaseEnvKeys = (): string[] => {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.databaseURL) missing.push("NEXT_PUBLIC_FIREBASE_DATABASE_URL");
  return missing;
};

/**
 * Returns a list of unset environment variables.
 */
export const getUnsetFirebaseEnvKeys = (): string[] => {
  return getMissingFirebaseEnvKeys();
};

/**
 * Returns a descriptive error message if Firebase configuration is missing.
 */
export const getFirebaseConfigErrorMessage = (): string => {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length === 0) return "";
  return "Missing Firebase configuration: " + missing.join(", ") + ". Please add these as Environment Variables in Vercel.";
};

/**
 * Initializes and returns the Firebase App instance.
 * Safe to call during build time.
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length > 0) return getApp();
  
  // Use a dummy config if keys are missing to prevent crash during static build
  const config = isFirebaseConfigured() ? firebaseConfig : {
    apiKey: "dummy-key",
    projectId: "dummy-project",
    authDomain: "dummy-project.firebaseapp.com",
    databaseURL: "https://dummy.firebaseio.com"
  };
  
  return initializeApp(config);
};

/**
 * Returns the Firebase Auth instance.
 */
export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};

/**
 * Returns the Firebase Realtime Database instance.
 */
export const getFirebaseDatabase = (): Database => {
  return getDatabase(getFirebaseApp());
};

// Singleton instances - initialized lazily or safely
export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const database = getFirebaseDatabase();
export const googleProvider = new GoogleAuthProvider();

// Analytics is only available in the browser
export const analytics: Analytics | undefined = 
  typeof window !== "undefined" && isFirebaseConfigured() 
    ? getAnalytics(app) 
    : undefined;

/**
 * Helper to log in with Google using a popup.
 */
export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

/**
 * Helper to log out of the current session.
 */
export const logout = async () => {
  return signOut(auth);
};
