'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import styles from './Dashboard.module.css';

export default function NewProjectButton() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const token = useAuthStore((s) => s.token) ?? '';

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    const project = await createProject(trimmed, token);
    setLoading(false);
    if (project) {
      router.push(`/project/${project.id}`);
    }
  }

  if (!open) {
    return (
      <button className={styles.newProjectBtn} onClick={() => setOpen(true)}>
        + Nuevo proyecto
      </button>
    );
  }

  return (
    <form className={styles.newProjectForm} onSubmit={handleCreate}>
      <input
        className={styles.newProjectInput}
        type="text"
        placeholder="Nombre del proyecto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        maxLength={80}
      />
      <button className={styles.newProjectSubmit} type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Creando…' : 'Crear'}
      </button>
      <button
        className={styles.newProjectCancel}
        type="button"
        onClick={() => {
          setOpen(false);
          setName('');
        }}
      >
        Cancelar
      </button>
    </form>
  );
}
