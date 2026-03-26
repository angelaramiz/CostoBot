'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { auth } from '@/lib/firebase';
import { API_URL } from '@/lib/config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatMode = 'project' | 'dashboard' | 'onboarding';

interface UseIAChatOptions {
  projectId?: string;
  mode?: ChatMode;
  /** Mensaje inicial que el asistente envía al abrirse (sin llamada a la IA) */
  welcomeMessage?: string;
}

export function useIAChat({ projectId, mode = 'project', welcomeMessage }: UseIAChatOptions = {}) {
  const token = useAuthStore((s) => s.token) ?? '';

  /** Siempre obtiene un token válido (se renueva automáticamente si expiró) */
  async function getFreshToken(): Promise<string> {
    return (await auth.currentUser?.getIdToken()) ?? token;
  }
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    welcomeMessage ? [{ role: 'assistant', content: welcomeMessage }] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si welcomeMessage cambia (p.ej. después de cargar el nombre del usuario), resetear
  useEffect(() => {
    if (welcomeMessage) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [welcomeMessage]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = { role: 'user', content: content.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setIsLoading(true);
      setError(null);

      try {
        // Retry con backoff para 502 (backend durmiendo en Render free tier).
        // Render tarda ~15-30s en despertar — esperamos hasta 3 intentos.
        const doFetch = async () => {
          const freshToken = await getFreshToken();
          return fetch(`${API_URL}/api/ia/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${freshToken}`,
            },
            body: JSON.stringify({ messages: updated, projectId, mode }),
          });
        };

        let res = await doFetch();

        if (res.status === 502) {
          setError('El servidor está iniciando, espera un momento…');
          await new Promise((r) => setTimeout(r, 12000));
          setError(null);
          res = await doFetch();
        }

        if (res.status === 502) {
          setError('Conectando de nuevo, casi listo…');
          await new Promise((r) => setTimeout(r, 15000));
          setError(null);
          res = await doFetch();
        }

        const body = await res.json();

        if (!res.ok) {
          throw new Error(body.message ?? `Error ${res.status}`);
        }

        const reply = typeof body.reply === 'string' ? body.reply : '';
        if (!reply) throw new Error('La IA no devolvió respuesta');

        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al contactar la IA');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, isLoading, token, projectId, mode]
  );

  const clearMessages = useCallback(() => {
    if (welcomeMessage) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    } else {
      setMessages([]);
    }
    setError(null);
  }, [welcomeMessage]);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
