import { useState, useEffect } from 'react';
import { AIPersonality } from '../data/aiPersonalities';
import { DebateState, Message, GameSetup, DebateHookResult } from '../types/debate';

interface ConversationEvent {
  type: 'message' | 'score';
  timestamp: string;
  speakerId?: string;
  content?: string;
  participantId?: string;
  newScore?: number;
}

interface Conversation {
  id: string;
  startTime: string;
  endTime?: string;
  gameSetup: GameSetup;
  events: ConversationEvent[];
}

export const useDebateReplay = (
  conversationId: string,
  aiPersonality: AIPersonality
): DebateHookResult => {
  const [state, setState] = useState<DebateState>({
    isLoading: true,
    isGeneratingHint: false,
    audienceScore: { user: 50, opponent: 50 },
    isAiThinking: false,
    error: null,
    summary: null,
    isGeneratingSummary: false,
    conversationId
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  // Fetch replay data
  useEffect(() => {
    const fetchReplay = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/replay/${conversationId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch replay data');
        }

        const data: Conversation = await response.json();
        setConversation(data);

        // Convert events to messages and scores
        const convertedMessages: Message[] = [];
        let currentScore = { user: 50, opponent: 50 };

        data.events.forEach((event, index) => {
          if (event.type === 'message' && event.speakerId && event.content) {
            convertedMessages.push({
              id: index + 1,
              role: event.speakerId === 'user' ? 'user' : 'opponent',
              content: event.content
            });
          } else if (event.type === 'score' && event.participantId && event.newScore !== undefined) {
            // Update scores
            if (event.participantId === 'user') {
              currentScore = {
                user: event.newScore,
                opponent: 100 - event.newScore
              };
            } else {
              currentScore = {
                user: 100 - event.newScore,
                opponent: event.newScore
              };
            }

            // Update the last message's score if it exists
            if (convertedMessages.length > 0) {
              const lastMessage = convertedMessages[convertedMessages.length - 1];
              lastMessage.score = {
                score: event.participantId === 'user' ? event.newScore : 100 - event.newScore,
                previousScore: event.participantId === 'user' ? 
                  (lastMessage.score?.score || 50) : 
                  (100 - (lastMessage.score?.score || 50))
              };
            }
          }
        });

        setMessages(convertedMessages);
        setState(prev => ({
          ...prev,
          isLoading: false,
          audienceScore: currentScore
        }));

      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load replay data'
        }));
      }
    };

    fetchReplay();
  }, [conversationId]);

  // These functions are no-ops in replay mode
  const handleSendArgument = async (currentArgument: string) => {};
  const handleHintRequest = async () => null;
  const initializeDebate = async () => {};
  const generateDebateSummary = async () => {};

  return {
    state,
    messages,
    handleSendArgument,
    handleHintRequest,
    initializeDebate,
    generateDebateSummary,
    gameSetup: conversation?.gameSetup || null
  };
};
