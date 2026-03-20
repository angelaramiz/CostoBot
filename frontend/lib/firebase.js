/**
 * firebase.js — CostoBot Frontend
 * Firebase client SDK — inicializa una sola vez (singleton).
 * Exporta `auth` para usar en componentes Next.js.
 * [GREENFIELD — defined by user]
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APPID,
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
