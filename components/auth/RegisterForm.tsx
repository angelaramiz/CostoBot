'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './AuthForm.module.css';
import { API_URL } from '@/lib/config';

export default function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const idToken = await signUp(name, email, password);

      // Crear proyecto inicial vacío en MongoDB usando el token recién obtenido
      // (no leer del store: Zustand puede no haber re-renderizado todavía)
      await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ name: 'Mi primer proyecto' }),
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>Crear cuenta</h1>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <label className={styles.label}>
        Nombre
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Tu nombre"
        />
      </label>

      <label className={styles.label}>
        Correo electrónico
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="tu@correo.com"
        />
      </label>

      <label className={styles.label}>
        Contraseña
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
        />
      </label>

      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className={styles.link}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
