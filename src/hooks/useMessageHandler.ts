import { useState, useCallback } from 'react';
import { log } from '../utils/logger';

interface Message {
  id: number;
  role: 'user' | 'opponent' | 'hint';
  content: string;
  score?: number;
}

export const useMessageHandler = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((role: 'user' | 'opponent' | 'hint', content: string, score?: number) => {
    log(`Adding message: ${role} - ${content}`);
    
    setMessages(prevMessages => [
      ...prevMessages,
      { 
        id: prevMessages.length + 1, 
        role, 
        content, 
        score 
      }
    ]);
  }, []);

  const updateMessageScore = useCallback((messageId: number, score: number) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, score } : msg
      )
    );
  }, []);

  const removeHintMessages = useCallback(() => {
    setMessages(prevMessages => prevMessages.filter(message => message.role !== 'hint'));
  }, []);

  return {
    messages,
    addMessage,
    updateMessageScore,
    removeHintMessages,
  };
};
