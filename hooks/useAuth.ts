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
  'auth/popup-blocked':
    'El navegador bloqueó la ventana emergente. Permite popups para este sitio e intenta de nuevo.',
  'auth/cancelled-popup-request': 'Solicitud cancelada. Intenta de nuevo.',
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

  /** Registra un usuario y devuelve el idToken para uso inmediato (evita race condition con el store) */
  async function signUp(name: string, email: string, password: string): Promise<string> {
    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      const idToken = await credential.user.getIdToken();
      setUser({ ...credential.user, displayName: name }, idToken);
      return idToken;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      throw new Error(parseAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Siempre usa signInWithPopup — tanto en desktop como en móvil.
   *
   * ¿Por qué no signInWithRedirect en móvil?
   * El flujo de redirect depende de cargar un iframe desde
   * `yourapp.firebaseapp.com/__/auth/iframe` para transferir el token
   * al regresar del proveedor. Chrome (política "Better Ads") bloquea
   * ese iframe en sitios externos a Firebase Hosting, dejando al usuario
   * atrapado en el login tras volver de Google.
   *
   * signInWithPopup usa postMessage entre la ventana popup y la app —
   * no requiere el iframe de firebaseapp.com y funciona en Chrome/Brave/Kiwi
   * siempre que el sitio permita popups (el usuario puede tener que habilitarlos
   * manualmente la primera vez).
   */
  async function signInWithGoogle(): Promise<void> {
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      setUser(credential.user, idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';

      // En Chrome móvil, COOP de accounts.google.com lanza window.closed errors
      // y Firebase arroja cancelled/closed ANTES de procesar el token del popup.
      // Esperamos hasta 3s a que onAuthStateChanged dispare con el usuario real.
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        const user = await new Promise<import('firebase/auth').User | null>((resolve) => {
          const unsub = onAuthStateChanged(auth, (u) => {
            unsub();
            resolve(u);
          });
          // Timeout de seguridad: si no llega usuario en 3s, el error era real
          setTimeout(() => { unsub(); resolve(null); }, 3000);
        });
        if (user) {
          const idToken = await user.getIdToken();
          setUser(user, idToken);
          return; // login exitoso — el componente navegará a /dashboard
        }
      }

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

