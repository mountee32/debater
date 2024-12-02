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

// Helper function to log performance metrics
const logPerformance = (action: string, startTime: number) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`[ReplayPerformance] ${action} took ${duration.toFixed(2)}ms`);
};

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
      const startTime = performance.now();
      console.log('[ReplayDebug] Starting conversation replay fetch:', {
        conversationId,
        aiPersonality: aiPersonality.name
      });

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/replay/${conversationId}`;
        console.log('[ReplayDebug] Fetching from URL:', apiUrl);
        
        const fetchStartTime = performance.now();
        const response = await fetch(apiUrl);
        logPerformance('API fetch', fetchStartTime);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch replay data: ${response.status} ${response.statusText}`);
        }

        const parseStartTime = performance.now();
        const data: Conversation = await response.json();
        logPerformance('JSON parsing', parseStartTime);

        console.log('[ReplayDebug] Received conversation data:', {
          id: data.id,
          eventCount: data.events.length,
          startTime: data.startTime,
          endTime: data.endTime
        });

        setConversation(data);

        // Convert events to messages and scores
        const conversionStartTime = performance.now();
        const convertedMessages: Message[] = [];
        let currentScore = { user: 50, opponent: 50 };

        data.events.forEach((event, index) => {
          if (event.type === 'message' && event.speakerId && event.content) {
            console.log('[ReplayDebug] Processing message event:', {
              index,
              speakerId: event.speakerId,
              contentLength: event.content.length
            });

            convertedMessages.push({
              id: index + 1,
              role: event.speakerId === 'user' ? 'user' : 'opponent',
              content: event.content
            });
          } else if (event.type === 'score' && event.participantId && event.newScore !== undefined) {
            console.log('[ReplayDebug] Processing score event:', {
              index,
              participantId: event.participantId,
              newScore: event.newScore
            });

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

        logPerformance('Event conversion', conversionStartTime);

        console.log('[ReplayDebug] Conversion complete:', {
          messageCount: convertedMessages.length,
          finalScore: currentScore
        });

        setMessages(convertedMessages);
        setState(prev => ({
          ...prev,
          isLoading: false,
          audienceScore: currentScore
        }));

        logPerformance('Total replay initialization', startTime);

      } catch (error) {
        console.error('[ReplayError] Failed to load replay:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load replay data'
        }));

        logPerformance('Failed replay attempt', startTime);
      }
    };

    fetchReplay();
  }, [conversationId]);

  // These functions are no-ops in replay mode
  const handleSendArgument = async (currentArgument: string) => {
    console.log('[ReplayDebug] Attempted to send argument in replay mode:', currentArgument);
  };
  
  const handleHintRequest = async () => {
    console.log('[ReplayDebug] Attempted to request hint in replay mode');
    return null;
  };
  
  const initializeDebate = async () => {
    console.log('[ReplayDebug] Attempted to initialize debate in replay mode');
  };
  
  const generateDebateSummary = async () => {
    console.log('[ReplayDebug] Attempted to generate summary in replay mode');
  };

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
