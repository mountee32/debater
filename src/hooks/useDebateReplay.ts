import { useState, useEffect, useRef } from 'react';
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

// Helper function to determine message role
const getMessageRole = (speakerId: string): 'user' | 'opponent' | 'system' | 'hint' => {
  switch (speakerId) {
    case 'user':
      return 'user';
    case 'opponent':
      return 'opponent';
    case 'system':
      return 'hint';
    default:
      return 'opponent';
  }
};

export const useDebateReplay = (
  conversationId: string,
  aiPersonality: AIPersonality
): DebateHookResult => {
  const [state, setState] = useState<DebateState>({
    isLoading: true,
    isGeneratingHint: false,
    audienceScore: { user: 50, opponent: 50 },
    isAiThinking: false, // Always false in replay mode
    error: null,
    summary: null,
    isGeneratingSummary: false,
    conversationId
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const currentMessagesRef = useRef<Message[]>([]);

  // Cleanup function
  const cleanup = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  // Fetch replay data
  useEffect(() => {
    const fetchReplay = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null, isAiThinking: false }));
        cleanup();
        currentMessagesRef.current = [];
        setMessages([]);
        
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/replay/${conversationId}`;
        console.log('[ReplayDebug] Fetching from URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch replay data: ${response.status} ${response.statusText}`);
        }

        const data: Conversation = await response.json();
        console.log('[ReplayDebug] Received conversation data:', {
          id: data.id,
          eventCount: data.events.length
        });

        // Sort events by timestamp
        const sortedEvents = [...data.events].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setConversation(data);

        // Process events immediately with minimal delay
        let currentScore = { user: 50, opponent: 50 };
        const processedMessages: Message[] = [];

        for (const [index, event] of sortedEvents.entries()) {
          if (event.type === 'message' && event.speakerId && event.content) {
            const role = getMessageRole(event.speakerId);
            if (role !== 'system') {
              const newMessage: Message = {
                id: index + 1,
                role,
                content: event.content,
                score: processedMessages.length > 0 ? 
                  processedMessages[processedMessages.length - 1].score : 
                  undefined
              };
              processedMessages.push(newMessage);
            }
          } else if (event.type === 'score' && event.participantId && event.newScore !== undefined) {
            currentScore = event.participantId === 'user' 
              ? { user: event.newScore, opponent: 100 - event.newScore }
              : { user: 100 - event.newScore, opponent: event.newScore };

            if (processedMessages.length > 0) {
              const lastMessage = processedMessages[processedMessages.length - 1];
              lastMessage.score = {
                score: event.participantId === 'user' ? event.newScore : 100 - event.newScore,
                previousScore: event.participantId === 'user' ? 
                  (lastMessage.score?.score || 50) : 
                  (100 - (lastMessage.score?.score || 50))
              };
            }
          }

          // Add delay between messages
          if (index < sortedEvents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Update messages after each event
          currentMessagesRef.current = [...processedMessages];
          setMessages([...processedMessages]);
          setState(prev => ({
            ...prev,
            audienceScore: currentScore,
            isLoading: false,
            isAiThinking: false
          }));
        }

        // Set final state
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAiThinking: false,
          audienceScore: currentScore,
          summary: conversation?.endTime ? {
            score: currentScore.user,
            feedback: "You demonstrated strong logical reasoning and effectively supported your arguments with evidence.",
            improvements: [
              "Focus more on directly addressing opponent's key points",
              "Include more specific examples to support your arguments",
              "Consider incorporating more diverse types of evidence"
            ]
          } : null
        }));

      } catch (error) {
        console.error('[ReplayError] Failed to load replay:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAiThinking: false,
          error: error instanceof Error ? error.message : 'Failed to load replay data'
        }));
      }
    };

    fetchReplay();
    return cleanup;
  }, [conversationId]);

  // These functions are no-ops in replay mode
  const handleSendArgument = async () => {};
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
