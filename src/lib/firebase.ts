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

/** True only when the web config is actually filled in. */
export const firebaseReady = Boolean(config.apiKey && config.projectId);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

/**
 * Everything below initializes lazily, on demand.
 *
 * Calling initializeApp() at module scope breaks `next build`: the App Router
 * executes client-component modules on the server while prerendering, so an unset
 * API key throws auth/invalid-api-key and every page fails to generate. Deferring
 * until first real use keeps the build green and lets the app run offline-only
 * when Firebase is not configured.
 *
 * The Firebase SDK modules (~250 KB combined) are also dynamically imported so
 * they don't bloat the initial JS bundle for every page.
 */
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
    // Persist the session in IndexedDB/localStorage so a signed-in user stays
    // signed in across reloads and tabs. This is Firebase's web default, but we
    // set it explicitly so the guarantee doesn't depend on an SDK default.
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

/** Firebase Storage, for scan images. Same lazy pattern as auth and Firestore. */
export async function getStorageInstance() {
  const a = await app();
  if (!a) return null;
  if (!_storage) {
    const { getStorage } = await import('firebase/storage');
    _storage = getStorage(a);
  }
  return _storage;
}

/** For call sites that cannot proceed without auth. */
export async function requireAuth(): Promise<Auth> {
  const a = await getAuthInstance();
  if (!a) throw new Error('Firebase is not configured. Copy .env.local.example to .env.local and fill it in.');
  return a;
}
