import { NextResponse } from 'next/server';
import {
  getFirebaseConfigErrorMessage,
  getMissingFirebaseEnvKeys,
  getUnsetFirebaseEnvKeys,
  isFirebaseConfigured,
  readFirebaseConfig,
} from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const missing = getMissingFirebaseEnvKeys();
  const unsetEnv = getUnsetFirebaseEnvKeys();
  const config = readFirebaseConfig();
  const configured = isFirebaseConfigured();
  return NextResponse.json({
    configured,
    missing,
    unsetEnv,
    usingDefaults: configured && unsetEnv.length > 0,
    present: {
      NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(config.apiKey),
      NEXT_PUBLIC_FIREBASE_DATABASE_URL: Boolean(config.databaseURL),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(config.projectId),
    },
    hint: configured
      ? unsetEnv.length
        ? 'Firebase OK (using built-in CricBid config; optional: add NEXT_PUBLIC_FIREBASE_* in Vercel to override).'
        : 'Firebase env looks OK on the server.'
      : getFirebaseConfigErrorMessage(),
  });
}
