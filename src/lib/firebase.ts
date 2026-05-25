import { FirebaseApp, getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { CRICBID_FIREBASE_DEFAULTS } from './firebaseDefaults';

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** Read config fresh on every call — env vars override built-in CricBid defaults. */
export function readFirebaseConfig(): FirebaseOptions {
  const defaults = CRICBID_FIREBASE_DEFAULTS;
  return {
    apiKey:
      env('NEXT_PUBLIC_FIREBASE_API_KEY') ||
      env('FIREBASE_API_KEY') ||
      env('NEXT_PUBLIC_FIREBASE_APIKEY') ||
      defaults.apiKey,
    authDomain:
      env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') ||
      env('FIREBASE_AUTH_DOMAIN') ||
      defaults.authDomain,
    databaseURL:
      env('NEXT_PUBLIC_FIREBASE_DATABASE_URL') ||
      env('FIREBASE_DATABASE_URL') ||
      env('NEXT_PUBLIC_FIREBASE_DATABASEURL') ||
      defaults.databaseURL,
    projectId:
      env('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ||
      env('FIREBASE_PROJECT_ID') ||
      env('NEXT_PUBLIC_FIREBASE_PROJECTID') ||
      defaults.projectId,
    storageBucket:
      env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') ||
      env('FIREBASE_STORAGE_BUCKET') ||
      defaults.storageBucket,
    messagingSenderId:
      env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ||
      env('FIREBASE_MESSAGING_SENDER_ID') ||
      defaults.messagingSenderId,
    appId:
      env('NEXT_PUBLIC_FIREBASE_APP_ID') || env('FIREBASE_APP_ID') || defaults.appId,
  };
}

export function getMissingFirebaseEnvKeys(): string[] {
  const config = readFirebaseConfig();
  const missing: string[] = [];
  if (!config.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!config.databaseURL) missing.push('NEXT_PUBLIC_FIREBASE_DATABASE_URL');
  if (!config.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  return missing;
}

/** Env vars not set on this deployment (defaults may still apply). */
export function getUnsetFirebaseEnvKeys(): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_ENV_KEYS) {
    if (!env(key)) missing.push(key);
  }
  return missing;
}

export function isFirebaseConfigured(): boolean {
  const config = readFirebaseConfig();
  return Boolean(config.apiKey && config.databaseURL && config.projectId);
}

/** True when Firebase config is available (NEXT_PUBLIC_* baked in at build, or server runtime env). */
export function isFirebaseConfiguredOnClient(): boolean {
  const config = readFirebaseConfig();
  return Boolean(config.apiKey && config.databaseURL && config.projectId);
}

export function getFirebaseConfigErrorMessage(): string {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length === 0) {
    return 'Firebase is not configured. Check that env var values are not empty, then redeploy without build cache.';
  }
  return (
    `Firebase env missing on this deployment: ${missing.join(', ')}. ` +
    'If your old domain works but this one does not, you likely added a new Vercel project or domain without copying env vars. ' +
    'In Vercel → this project → Settings → Environment Variables, copy all 7 NEXT_PUBLIC_FIREBASE_* values from the working project. ' +
    'Enable them for Production and Preview, then Deployments → Redeploy → uncheck "Use existing Build Cache".'
  );
}

let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(readFirebaseConfig());
} catch (e) {
  // Fallback for environments where config might be missing initially
  app = initializeApp(readFirebaseConfig());
}

export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function getFirebaseAuth(): Auth {
  return auth;
}

export function getFirebaseDatabase(): Database {
  return database;
}

export function resetFirebaseForTests(): void {
  // app = null; // Cannot reset const
}

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
