import { redirect } from 'next/navigation';

/**
 * Ruta raíz: redirige siempre al dashboard.
 * AuthGuard en el layout (app) redirigirá a /login si no hay sesión.
 */
export default function Home() {
  redirect('/dashboard');
}
