/**
 * firebase.ts — CostoBot Frontend
 * Firebase client SDK — singleton para Next.js App Router.
 * Exporta `auth` y `googleProvider` para uso en hooks y componentes.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APPID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
