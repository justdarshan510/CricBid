import type { FirebaseOptions } from 'firebase/app';

/**
 * CricBid production Firebase (cricbid-afb76).
 * Used when Vercel env vars are missing on a deployment.
 * Web API keys are public; access is limited by Realtime Database rules.
 */
export const CRICBID_FIREBASE_DEFAULTS: FirebaseOptions = {
  apiKey: 'AIzaSyCi8WMiqZ9lfCw2rjTMnzeIu9Q0h89sRyE',
  authDomain: 'cricbid-afb76.firebaseapp.com',
  databaseURL:
    'https://cricbid-afb76-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'cricbid-afb76',
  storageBucket: 'cricbid-afb76.firebasestorage.app',
  messagingSenderId: '204378168382',
  appId: '1:204378168382:web:8cfc8f586602096b92856f',
};
