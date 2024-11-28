import { useState, useCallback } from 'react';

interface MessageScore {
  score: number;
  previousScore: number;
}

interface Message {
  id: number;
  role: 'user' | 'opponent' | 'hint';
  content: string;
  score?: MessageScore;
}

export const useMessageHandler = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((role: 'user' | 'opponent' | 'hint', content: string, score?: MessageScore) => {
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

  const updateMessageScore = useCallback((messageId: number, score: MessageScore) => {
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
