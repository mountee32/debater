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

// Helper function to log performance metrics
const logPerformance = (action: string, startTime: number) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`[ReplayPerformance] ${action} took ${duration.toFixed(2)}ms`);
};

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
    isAiThinking: false,
    error: null,
    summary: null,
    isGeneratingSummary: false,
    conversationId
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [processedEvents, setProcessedEvents] = useState<ConversationEvent[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup function
  const cleanup = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    setMessages([]);
    setVisibleMessages([]);
  };

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

        // Sort events by timestamp
        const sortedEvents = [...data.events].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Filter out duplicate events
        const uniqueEvents = sortedEvents.filter((event, index, self) =>
          index === self.findIndex((e) => 
            e.type === event.type && 
            e.timestamp === event.timestamp && 
            e.content === event.content &&
            e.speakerId === event.speakerId
          )
        );

        console.log('[ReplayDebug] Events sorted and deduplicated:', 
          uniqueEvents.map(e => ({
            type: e.type,
            timestamp: e.timestamp,
            speakerId: e.speakerId,
            participantId: e.participantId
          }))
        );

        setConversation({ ...data, events: uniqueEvents });
        setProcessedEvents(uniqueEvents);
        
        // Initialize with empty messages
        setMessages([]);
        setVisibleMessages([]);

        setState(prev => ({
          ...prev,
          isLoading: false,
          audienceScore: { user: 50, opponent: 50 }
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

    cleanup();
    fetchReplay();

    return cleanup;
  }, [conversationId]);

  // Process events with timing
  useEffect(() => {
    if (!processedEvents.length || state.isLoading) return;

    const startTime = new Date(processedEvents[0].timestamp).getTime();
    let currentMessages: Message[] = [];
    let currentScore = { user: 50, opponent: 50 };
    let isProcessing = true;

    const processNextEvent = (index: number) => {
      if (!isProcessing || index >= processedEvents.length) {
        // If we've reached the end of events and have an endTime, show summary
        if (conversation?.endTime && index >= processedEvents.length) {
          const finalScore = currentScore.user;
          setState(prev => ({
            ...prev,
            summary: {
              score: finalScore,
              feedback: "You demonstrated strong logical reasoning and effectively supported your arguments with evidence. Your responses were clear and well-structured, though there's room for improvement in addressing counterarguments.",
              improvements: [
                "Focus more on directly addressing opponent's key points",
                "Include more specific examples to support your arguments",
                "Consider incorporating more diverse types of evidence"
              ]
            }
          }));
        }
        return;
      }

      const event = processedEvents[index];
      const eventTime = new Date(event.timestamp).getTime();
      const delay = index === 0 ? 0 : eventTime - new Date(processedEvents[index - 1].timestamp).getTime();

      console.log(`[ReplayDebug] Processing event ${index}:`, {
        type: event.type,
        delay,
        timestamp: event.timestamp
      });

      const timeout = setTimeout(() => {
        if (event.type === 'message' && event.speakerId && event.content) {
          const role = getMessageRole(event.speakerId);
          // Skip system messages that aren't hints
          if (role === 'system') return;

          const newMessage: Message = {
            id: index + 1,
            role,
            content: event.content,
            score: currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].score : undefined
          };

          currentMessages = [...currentMessages, newMessage];
          setMessages([...currentMessages]);
          setVisibleMessages([...currentMessages]);

          console.log('[ReplayDebug] Added message:', {
            role: newMessage.role,
            timestamp: event.timestamp
          });

        } else if (event.type === 'score' && event.participantId && event.newScore !== undefined) {
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

          setState(prev => ({
            ...prev,
            audienceScore: currentScore
          }));

          // Update the last message's score if it exists
          if (currentMessages.length > 0) {
            const lastMessage = currentMessages[currentMessages.length - 1];
            lastMessage.score = {
              score: event.participantId === 'user' ? event.newScore : 100 - event.newScore,
              previousScore: event.participantId === 'user' ? 
                (lastMessage.score?.score || 50) : 
                (100 - (lastMessage.score?.score || 50))
            };
            setMessages([...currentMessages]);
            setVisibleMessages([...currentMessages]);

            console.log('[ReplayDebug] Updated score:', {
              participantId: event.participantId,
              newScore: event.newScore,
              timestamp: event.timestamp
            });
          }
        }

        // Process next event
        processNextEvent(index + 1);
      }, delay);

      timeoutsRef.current.push(timeout);
    };

    processNextEvent(0);

    // Cleanup function
    return () => {
      isProcessing = false;
      cleanup();
    };
  }, [processedEvents, state.isLoading, conversation]);

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
    messages: visibleMessages,
    handleSendArgument,
    handleHintRequest,
    initializeDebate,
    generateDebateSummary,
    gameSetup: conversation?.gameSetup || null
  };
};
