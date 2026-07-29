import { requireAuth, getAuthInstance } from './firebase';

/** Turns Firebase error codes into something a farmer can act on. */
export function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address is not valid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in window was closed.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup.',
    'auth/missing-email': 'Please enter your email address.',
    'auth/missing-password': 'Please enter your password.',
    'auth/user-disabled': 'This account has been disabled.',
  };
  return map[code] ?? (e as Error)?.message ?? 'Something went wrong.';
}

export const login = async (email: string, password: string) => {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  return signInWithEmailAndPassword(await requireAuth(), email, password);
};

export async function register(name: string, email: string, password: string) {
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const cred = await createUserWithEmailAndPassword(await requireAuth(), email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  return cred;
}

export const loginWithGoogle = async () => {
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  return signInWithPopup(await requireAuth(), new GoogleAuthProvider());
};

export const resetPassword = async (email: string) => {
  const { sendPasswordResetEmail } = await import('firebase/auth');
  return sendPasswordResetEmail(await requireAuth(), email);
};

export const logout = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('agrovision.demoUser');
  }
  const a = await getAuthInstance();
  if (a) {
    const { signOut } = await import('firebase/auth');
    await signOut(a);
  }
};
