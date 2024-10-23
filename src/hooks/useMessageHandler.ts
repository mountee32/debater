import { useState, useCallback, useRef } from 'react';
import { log } from '../utils/logger';

interface Message {
  id: number;
  role: 'user' | 'opponent' | 'hint';
  content: string;
  score?: number;
}

export const useMessageHandler = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMessageIdRef = useRef(0);

  const addMessage = useCallback((role: 'user' | 'opponent' | 'hint', content: string, score?: number) => {
    log(`Adding message: ${role} - ${content}`);
    
    const words = content.split(' ');
    const truncatedContent = words.slice(0, 60).join(' ');
    const remainingContent = words.slice(60).join(' ');

    let displayedContent = '';
    const newMessageId = lastMessageIdRef.current + 1;
    lastMessageIdRef.current = newMessageId;

    setMessages((prevMessages) => [
      ...prevMessages,
      { id: newMessageId, role, content: truncatedContent, score }
    ]);

    const interval = setInterval(() => {
      if (displayedContent.length < remainingContent.length) {
        displayedContent += remainingContent[displayedContent.length];
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newMessageId ? { ...msg, content: truncatedContent + displayedContent } : msg
          )
        );
      } else {
        clearInterval(interval);
      }
    }, 25);
  }, []);

  const updateMessageScore = useCallback((messageId: number, score: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, score } : msg
      )
    );
  }, []);

  const removeHintMessages = () => {
    setMessages((prevMessages) => prevMessages.filter((message) => message.role !== 'hint'));
  };

  return {
    messages,
    addMessage,
    updateMessageScore,
    removeHintMessages,
  };
};
