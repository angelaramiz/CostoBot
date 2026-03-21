'use client';

import { useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth.store';

const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya está registrado.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/user-not-found': 'No existe una cuenta con este correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
  'auth/popup-closed-by-user': 'El inicio de sesión fue cancelado.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
};

function parseAuthError(code: string): string {
  return AUTH_ERRORS[code] ?? 'Error de autenticación. Intenta de nuevo.';
}

export function useAuth() {
  const { uid, email, displayName, isLoading, token, setUser, clearUser, setLoading } =
    useAuthStore();

  /** Suscribirse a cambios de sesión (llamar una sola vez en el layout raíz) */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setUser(user, idToken);
      } else {
        clearUser();
      }
    });
    return unsubscribe;
  }, [setUser, clearUser]);

  async function signIn(email: string, password: string): Promise<void> {
    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      setUser(credential.user, idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      throw new Error(parseAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  async function signUp(name: string, email: string, password: string): Promise<void> {
    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      const idToken = await credential.user.getIdToken();
      setUser({ ...credential.user, displayName: name }, idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      throw new Error(parseAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(): Promise<void> {
    try {
      setLoading(true);
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      setUser(credential.user, idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      throw new Error(parseAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
    clearUser();
  }

  return { uid, email, displayName, isLoading, token, signIn, signUp, signInWithGoogle, signOut };
}
