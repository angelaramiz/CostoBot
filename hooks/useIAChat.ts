'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatMode = 'project' | 'dashboard' | 'onboarding';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface UseIAChatOptions {
  projectId?: string;
  mode?: ChatMode;
  /** Mensaje inicial que el asistente envía al abrirse (sin llamada a la IA) */
  welcomeMessage?: string;
}

export function useIAChat({ projectId, mode = 'project', welcomeMessage }: UseIAChatOptions = {}) {
  const token = useAuthStore((s) => s.token) ?? '';
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
        const doFetch = () =>
          fetch(`${API_URL}/api/ia/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messages: updated, projectId, mode }),
          });

        let res = await doFetch();

        if (res.status === 502) {
          await new Promise((r) => setTimeout(r, 12000)); // esperar 12s
          res = await doFetch();
        }

        if (res.status === 502) {
          await new Promise((r) => setTimeout(r, 15000)); // esperar 15s más
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
