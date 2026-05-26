import { getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import type { Database } from 'firebase/database';
import { CRICBID_FIREBASE_DEFAULTS } from './firebaseDefaults';

const clean = (val: unknown) => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
};

const getResolvedConfig = (): FirebaseOptions => {
  const defaults = CRICBID_FIREBASE_DEFAULTS;
  const apiKey = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const projectId = clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  if (!apiKey && !projectId) {
    return defaults;
  }

  return {
    ...defaults,
    apiKey: apiKey || defaults.apiKey,
    projectId: projectId || defaults.projectId,
    authDomain:
      clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
      (projectId ? `${projectId}.firebaseapp.com` : defaults.authDomain),
    databaseURL:
      clean(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) || defaults.databaseURL,
    storageBucket:
      clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || defaults.storageBucket,
    messagingSenderId:
      clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
      defaults.messagingSenderId,
    appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || defaults.appId,
    measurementId:
      clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) ||
      defaults.measurementId,
  };
};

export const firebaseConfig = getResolvedConfig();

if (typeof window !== 'undefined') {
  const envKey = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log('--- Firebase Configuration ---');
  console.log('Source:', envKey ? 'Vercel Environment Variables' : 'CricBid Defaults');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('API Key Status:', firebaseConfig.apiKey ? 'Set' : 'Missing');
  console.log('------------------------------');
}

export const getFirebaseApp = (): FirebaseApp => {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  return initializeApp(firebaseConfig);
};

export const getFirebaseDatabase = (): Database => getDatabase(getFirebaseApp());

export const app = getFirebaseApp();
export const database = getFirebaseDatabase();

export const readFirebaseConfig = () => ({ ...firebaseConfig });
export const isFirebaseConfigured = () => !!firebaseConfig.apiKey;
export const isFirebaseConfiguredOnClient = isFirebaseConfigured;

export const getMissingFirebaseEnvKeys = () => {
  const missing: string[] = [];
  if (!clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)) {
    missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  }
  if (!clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)) {
    missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
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
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ] as const;

  keys.forEach((key) => {
    if (!clean(process.env[key])) unset.push(key);
  });

  return unset;
};

export const getFirebaseConfigErrorMessage = () => {
  const missing = getMissingFirebaseEnvKeys();
  return missing.length
    ? `Note: Using defaults. Missing env keys: ${missing.join(', ')}`
    : '';
};
