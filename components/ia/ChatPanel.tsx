'use client';

import { useEffect, useRef, useState } from 'react';
import { useIAChat } from '@/hooks/useIAChat';
import type { ChatMode } from '@/hooks/useIAChat';
import ChatMessageBubble from './ChatMessage';
import ChatInput from './ChatInput';
import ProjectContextSummary from './ProjectContextSummary';
import { BotIcon, CloseIcon, TrashIcon } from '@/components/ui/icons';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  projectId?: string;
  /** 'project' = análisis de costos | 'dashboard' = guía general | 'onboarding' = bienvenida */
  mode?: ChatMode;
  /** Si true, el panel se abre automáticamente al montar */
  autoOpen?: boolean;
  welcomeMessage?: string;
}

export default function ChatPanel({
  projectId,
  mode = 'project',
  autoOpen = false,
  welcomeMessage,
}: ChatPanelProps) {
  const [open, setOpen] = useState(autoOpen);
  // Patrón React docs para ajustar estado cuando cambia una prop sin useEffect:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [autoOpenPrev, setAutoOpenPrev] = useState(autoOpen);
  if (autoOpen !== autoOpenPrev) {
    setAutoOpenPrev(autoOpen);
    if (autoOpen) setOpen(true);
  }
  const { messages, isLoading, error, sendMessage, clearMessages } = useIAChat({
    projectId,
    mode,
    welcomeMessage,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const isDashboard = mode === 'dashboard' || mode === 'onboarding';
  const title = isDashboard ? 'Guía CostoBot' : 'Asistente CostoBot';
  const suggestions = isDashboard ? DASHBOARD_SUGGESTIONS : PROJECT_SUGGESTIONS;
  const emptyText = isDashboard
    ? '¡Hola! Soy tu guía de CostoBot. Puedo ayudarte a entender las capas, crear tu primer proyecto o resolver dudas de costos.'
    : '¡Hola! Puedo ayudarte a analizar los costos de tu proyecto.';

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
        {open ? <CloseIcon size={18} /> : <BotIcon size={22} />}
      </button>

      {/* Panel de chat */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            <BotIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {title}
          </span>
          <div className={styles.headerActions}>
            {messages.length > (welcomeMessage ? 1 : 0) && (
              <button
                className={styles.clearBtn}
                onClick={clearMessages}
                title="Limpiar chat"
                aria-label="Limpiar conversación"
              >
                <TrashIcon size={15} />
              </button>
            )}
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              title="Cerrar"
              aria-label="Cerrar asistente"
            >
              <CloseIcon size={15} />
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
          {/* Contexto del proyecto solo en modo project */}
          {mode === 'project' && messages.length === 0 && <ProjectContextSummary />}

          {/* Sugerencias iniciales */}
          {messages.length === 0 && (
            <div className={styles.emptyChat}>
              <p>{emptyText}</p>
              {isDashboard && (
                <div className={styles.layerGuide}>
                  <p className={styles.layerGuideTitle}>📋 Las 4 capas de CostoBot:</p>
                  <ul className={styles.layerList}>
                    <li><strong>Capa 1 — Insumos:</strong> materias primas y materiales</li>
                    <li><strong>Capa 2 — Procesos:</strong> pasos de producción y mano de obra</li>
                    <li><strong>Capa 3 — Productos:</strong> costo total calculado automáticamente</li>
                    <li><strong>Capa 4 — Precios:</strong> precio de venta y margen de ganancia</li>
                  </ul>
                </div>
              )}
              <p className={styles.suggestions}>Prueba preguntando:</p>
              <ul className={styles.suggestionList}>
                {suggestions.map((s) => (
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
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          placeholder={
            isDashboard
              ? 'Pregunta sobre costos, capas o tu negocio…'
              : 'Pregunta sobre tu proyecto… (Enter para enviar)'
          }
        />
      </div>
    </>
  );
}

const PROJECT_SUGGESTIONS = [
  '¿Cuáles son mis insumos más caros?',
  '¿Es rentable mi margen actual?',
  '¿Cómo puedo reducir costos?',
  '¿Cuál es mi punto de equilibrio?',
  'Analiza mi ROI y dime si es suficiente',
  '¿Cómo afectan los impuestos a mis precios?',
];

const DASHBOARD_SUGGESTIONS = [
  '¿Para qué sirve cada capa?',
  'Tengo una panadería, ¿cómo empiezo?',
  'Vendo ropa al por mayor, ¿qué tipo de proyecto uso?',
  '¿Cómo calculo mi punto de equilibrio?',
  '¿Qué diferencia hay entre producto fabricado y reventa?',
];

