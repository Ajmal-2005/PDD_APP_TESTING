import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isRealConfigValue = (val?: string) => Boolean(val && !val.includes('your_') && !val.includes('placeholder') && !val.includes('1234567890'));

/** True only when real, non-placeholder Firebase web config is supplied. */
export const firebaseReady = Boolean(isRealConfigValue(config.apiKey) && isRealConfigValue(config.projectId));

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

async function app(): Promise<FirebaseApp | null> {
  if (!firebaseReady) return null;
  if (!_app) {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    _app = getApps().length ? getApp() : initializeApp(config);
  }
  return _app;
}

export async function getAuthInstance(): Promise<Auth | null> {
  const a = await app();
  if (!a) return null;
  if (!_auth) {
    const { getAuth, setPersistence, browserLocalPersistence } = await import('firebase/auth');
    _auth = getAuth(a);
    void setPersistence(_auth, browserLocalPersistence).catch((e) =>
      console.warn('Could not set auth persistence', e),
    );
  }
  return _auth;
}

export async function getDb(): Promise<Firestore | null> {
  const a = await app();
  if (!a) return null;
  if (!_db) {
    const { getFirestore } = await import('firebase/firestore');
    _db = getFirestore(a);
  }
  return _db;
}

let _storage: import('firebase/storage').FirebaseStorage | null = null;

export async function getStorageInstance() {
  const a = await app();
  if (!a) return null;
  if (!_storage) {
    const { getStorage } = await import('firebase/storage');
    _storage = getStorage(a);
    /*
     * The SDK default is 10 minutes of retries. That is sensible for a flaky network but
     * wrong for a bucket that does not exist yet: it turns "Storage is not enabled" into
     * a ten-minute silent stall instead of a prompt, logged failure. Scan images are
     * small and retryable on the next sync, so fail fast and keep the UI honest.
     */
    _storage.maxUploadRetryTime = 20_000;
    _storage.maxOperationRetryTime = 20_000;
  }
  return _storage;
}

export async function requireAuth(): Promise<Auth> {
  const a = await getAuthInstance();
  if (!a) throw new Error('Firebase is not configured with real API keys in .env.local.');
  return a;
}
