import React, { useRef, useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { AIPersonality } from '../data/aiPersonalities';
import { useDebateLogic } from '../hooks/useDebateLogic';
import { useTimer } from '../hooks/useTimer';
import { MessageBubble } from './debate/MessageBubble';
import { DebateControls } from './debate/DebateControls';
import { DebateHeader } from './debate/DebateHeader';

interface DebateGameProps {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onEndGame: (result: { overallScore: number; rationale: string; recommendations: string }) => void;
  aiPersonality: AIPersonality;
  userPosition: 'for' | 'against';
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

interface DisplayMessage {
  id: number;
  role: 'user' | 'opponent';
  content: string;
  score?: {
    score: number;
    previousScore: number;
  };
}

const DebateGame: React.FC<DebateGameProps> = ({ 
  topic, 
  difficulty, 
  onEndGame, 
  aiPersonality, 
  userPosition,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [currentArgument, setCurrentArgument] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateInitializedRef = useRef(false);
  const aiPosition = userPosition === 'for' ? 'against' : 'for';

  const {
    state,
    messages,
    handleEndGame,
    handleSendArgument,
    handleHintRequest,
    initializeDebate,
  } = useDebateLogic(topic, difficulty, userPosition, aiPersonality, onEndGame);

  const timeLeft = useTimer(300, handleEndGame);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (topic && messages.length === 0 && !debateInitializedRef.current) {
      debateInitializedRef.current = true;
      initializeDebate();
    }
  }, [topic, messages.length, initializeDebate]);

  const onSendArgumentClick = async () => {
    setCurrentArgument(''); // Clear the input field immediately
    await handleSendArgument(currentArgument);
  };

  const onHintRequestClick = async () => {
    const hint = await handleHintRequest();
    if (hint) {
      setCurrentArgument(hint);
    }
  };

  // Filter out hint messages and cast to DisplayMessage type
  const displayMessages = messages
    .filter(message => message.role === 'user' || message.role === 'opponent') as DisplayMessage[];

  return (
    <div 
      data-testid="debate-game"
      className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <DebateHeader
        topic={topic}
        timeLeft={timeLeft}
        audienceScore={state.audienceScore}
        userPosition={userPosition}
        aiPosition={aiPosition}
        aiName={aiPersonality.name}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: '100px', paddingBottom: '160px' }}>
        <div className="max-w-4xl mx-auto px-4">
          {displayMessages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              score={message.score?.score}
              previousScore={message.score?.previousScore}
              userPosition={userPosition}
              aiPosition={aiPosition}
              aiPersonality={aiPersonality}
            />
          ))}
          {state.isAiThinking && (
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 shadow-lg">
                <img
                  src={aiPersonality.avatarUrl}
                  alt={`${aiPersonality.name} avatar`}
                  className="w-full h-full object-cover"
                  data-testid="thinking-avatar"
                />
              </div>
              <div className="inline-block p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 shadow-lg">
                <Loader className="animate-spin" size={18} />
              </div>
            </div>
          )}
          {state.error && (
            <div 
              data-testid="error-message"
              className="mx-4 mb-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-lg text-red-600 dark:text-red-400 text-sm font-medium"
            >
              {state.error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <DebateControls
        currentArgument={currentArgument}
        setCurrentArgument={setCurrentArgument}
        onSendArgument={onSendArgumentClick}
        onHintRequest={onHintRequestClick}
        onEndGame={handleEndGame}
        isLoading={state.isLoading}
        isGeneratingHint={state.isGeneratingHint}
        userPosition={userPosition}
      />
    </div>
  );
};

export default DebateGame;
