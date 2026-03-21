'use client';

import type { ChatMessage } from '@/hooks/useIAChat';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
      {!isUser && <span className={styles.avatar}>🤖</span>}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={styles.line}>
            {line}
          </p>
        ))}
      </div>
      {isUser && <span className={styles.avatar}>👤</span>}
    </div>
  );
}
