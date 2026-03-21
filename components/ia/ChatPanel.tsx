'use client';

import { useEffect, useRef, useState } from 'react';
import { useIAChat } from '@/hooks/useIAChat';
import ChatMessageBubble from './ChatMessage';
import ChatInput from './ChatInput';
import ProjectContextSummary from './ProjectContextSummary';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  projectId?: string;
}

export default function ChatPanel({ projectId }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const { messages, isLoading, error, sendMessage, clearMessages } = useIAChat(projectId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll al último mensaje
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  return (
    <>
      {/* Botón flotante */}
      <button
        className={styles.floatBtn}
        onClick={() => setOpen(!open)}
        title={open ? 'Cerrar asistente' : 'Abrir asistente IA'}
        aria-label={open ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
        aria-expanded={open}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Panel de chat */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>🤖 Asistente CostoBot</span>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <button className={styles.clearBtn} onClick={clearMessages} title="Limpiar chat" aria-label="Limpiar conversación">
                🗑
              </button>
            )}
            <button className={styles.closeBtn} onClick={() => setOpen(false)} title="Cerrar" aria-label="Cerrar asistente">
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo del chat */}
        <div
          className={styles.body}
          role="log"
          aria-live="polite"
          aria-label="Conversación con el asistente"
        >
          {messages.length === 0 && <ProjectContextSummary />}

          {messages.length === 0 && (
            <div className={styles.emptyChat}>
              <p>¡Hola! Puedo ayudarte a analizar los costos de tu proyecto.</p>
              <p className={styles.suggestions}>Prueba preguntando:</p>
              <ul className={styles.suggestionList}>
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button className={styles.suggestionBtn} onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessageBubble key={i} message={msg} />
          ))}

          {isLoading && (
            <div className={styles.typingIndicator}>
              <span />
              <span />
              <span />
            </div>
          )}

          {error && <p className={styles.errorMsg}>⚠ {error}</p>}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </>
  );
}

const SUGGESTIONS = [
  '¿Cuáles son mis insumos más caros?',
  '¿Es rentable mi margen actual?',
  '¿Cómo puedo reducir costos?',
];
