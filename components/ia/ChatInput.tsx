'use client';

import { useState } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pregunta sobre tu proyecto… (Enter para enviar)"
        aria-label="Mensaje al asistente"
        disabled={disabled}
        rows={2}
        maxLength={1000}
      />
      <button
        type="submit"
        className={styles.sendBtn}
        disabled={disabled || !value.trim()}
        title="Enviar mensaje"
      >
        {disabled ? '⟳' : '↑'}
      </button>
    </form>
  );
}
