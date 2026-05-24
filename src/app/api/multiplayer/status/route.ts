import { NextResponse } from 'next/server';
import {
  getFirebaseConfigErrorMessage,
  getMissingFirebaseEnvKeys,
  isFirebaseConfigured,
  readFirebaseConfig,
} from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const missing = getMissingFirebaseEnvKeys();
  const config = readFirebaseConfig();
  return NextResponse.json({
    configured: isFirebaseConfigured(),
    missing,
    present: {
      NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(config.apiKey),
      NEXT_PUBLIC_FIREBASE_DATABASE_URL: Boolean(config.databaseURL),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(config.projectId),
    },
    hint: missing.length
      ? getFirebaseConfigErrorMessage()
      : 'Firebase env looks OK on the server.',
  });
}
