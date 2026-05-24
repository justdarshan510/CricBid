import { FirebaseApp, getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** Read config fresh on every call — required for Vercel serverless runtime env. */
export function readFirebaseConfig(): FirebaseOptions {
  return {
    apiKey:
      env('NEXT_PUBLIC_FIREBASE_API_KEY') ||
      env('FIREBASE_API_KEY') ||
      env('NEXT_PUBLIC_FIREBASE_APIKEY'),
    authDomain:
      env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') || env('FIREBASE_AUTH_DOMAIN'),
    databaseURL:
      env('NEXT_PUBLIC_FIREBASE_DATABASE_URL') ||
      env('FIREBASE_DATABASE_URL') ||
      env('NEXT_PUBLIC_FIREBASE_DATABASEURL'),
    projectId:
      env('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ||
      env('FIREBASE_PROJECT_ID') ||
      env('NEXT_PUBLIC_FIREBASE_PROJECTID'),
    storageBucket:
      env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || env('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId:
      env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ||
      env('FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('NEXT_PUBLIC_FIREBASE_APP_ID') || env('FIREBASE_APP_ID'),
  };
}

export function getMissingFirebaseEnvKeys(): string[] {
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

/** True when browser has Firebase config baked in at build time (NEXT_PUBLIC_*). */
export function isFirebaseConfiguredOnClient(): boolean {
  return getMissingFirebaseEnvKeys().length === 0;
}

export function getFirebaseConfigErrorMessage(): string {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length === 0) {
    return 'Firebase is not configured. Check that env var values are not empty, then redeploy without build cache.';
  }
  return `Firebase env missing or empty on server: ${missing.join(', ')}. Add them in Vercel → Settings → Environment Variables (Production + Preview), then Redeploy without cache.`;
}

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(getFirebaseConfigErrorMessage());
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(readFirebaseConfig());
  }
  return app;
}

export function getFirebaseDatabase(): Database {
  if (!database) {
    database = getDatabase(getFirebaseApp());
  }
  return database;
}

export function resetFirebaseForTests(): void {
  app = null;
  database = null;
}
