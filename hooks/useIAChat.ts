'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function useIAChat(projectId: string) {
  const token = useAuthStore((s) => s.token) ?? '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = { role: 'user', content: content.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/ia/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: updated, projectId }),
        });

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
    [messages, isLoading, token, projectId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
