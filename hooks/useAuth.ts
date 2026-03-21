'use client';

import { useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Redirigiendo…',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
};

/**
 * Detecta si el dispositivo es móvil/táctil.
 * En móvil, signInWithPopup falla porque el navegador bloquea popups y
 * los iframes cross-origin de Firebase quedan bloqueados por COOP.
 * La solución es signInWithRedirect — el usuario es llevado a Google
 * y vuelve al app donde onAuthStateChanged maneja el resultado.
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    navigator.maxTouchPoints > 1 ||
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
  );
}

function parseAuthError(code: string): string {
  return AUTH_ERRORS[code] ?? 'Error de autenticación. Intenta de nuevo.';
}

export function useAuth() {
  const { uid, email, displayName, isLoading, token, setUser, clearUser, setLoading } =
    useAuthStore();

  /** Suscribirse a cambios de sesión (llamar una sola vez en el layout raíz) */
  useEffect(() => {
    let cancelled = false;

    // Recuperar el resultado pendiente del redirect de Google (flujo móvil).
    // getRedirectResult procesa el token de la URL y completa el sign-in.
    getRedirectResult(auth)
      .then(async (result) => {
        if (!cancelled && result?.user) {
          const idToken = await result.user.getIdToken();
          setUser(result.user, idToken);
        }
      })
      .catch(() => {
        // Sin redirect pendiente — ignorar
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setUser(user, idToken);
      } else {
        clearUser();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
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
    setLoading(true);
    try {
      if (isMobileDevice()) {
        // En móvil, signInWithPopup es bloqueado por el navegador (COOP + anti-popup policies).
        // signInWithRedirect lleva al usuario a Google y vuelve al app.
        // onAuthStateChanged detecta la sesión al retornar.
        await signInWithRedirect(auth, googleProvider);
        return; // La página navega fuera — el estado de carga queda hasta el retorno
      }
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      setUser(credential.user, idToken);
      setLoading(false);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      // Si el popup fue bloqueado en desktop, intentar redirect como fallback
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setLoading(false);
      throw new Error(parseAuthError(code));
    }
  }

  async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
    clearUser();
  }

  return { uid, email, displayName, isLoading, token, signIn, signUp, signInWithGoogle, signOut };
}
