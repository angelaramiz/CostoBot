'use client';

import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  isLoading: boolean;
  /** ID token para llamadas al backend */
  token: string | null;
}

interface AuthActions {
  setUser: (user: FirebaseUser | null, token?: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  uid: null,
  email: null,
  displayName: null,
  isLoading: true,
  token: null,

  setUser: (user, token) => {
    if (!user) {
      set({ uid: null, email: null, displayName: null, token: null, isLoading: false });
      return;
    }
    set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      token: token ?? null,
      isLoading: false,
    });
  },

  clearUser: () =>
    set({ uid: null, email: null, displayName: null, token: null, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
