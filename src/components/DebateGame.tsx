import React, { useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { AIPersonality } from '../data/aiPersonalities';
import { useDebateLogic } from '../hooks/useDebateLogic';
import { useDebateReplay } from '../hooks/useDebateReplay';
import { useTimer } from '../hooks/useTimer';
import { MessageBubble } from './debate/MessageBubble';
import { DebateControls } from './debate/DebateControls';
import { DebateHeader } from './debate/DebateHeader';
import { GameSummary } from './GameSummary';
import { DebateHookResult } from '../types/debate';

interface BaseDebateGameProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  aiPersonality: AIPersonality;
}

interface LiveDebateGameProps extends BaseDebateGameProps {
  isReplayMode?: false;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  userPosition: 'for' | 'against';
  subjectId: string;
}

interface ReplayDebateGameProps extends BaseDebateGameProps {
  isReplayMode: true;
  conversationId: string;
}

type DebateGameProps = LiveDebateGameProps | ReplayDebateGameProps;

interface DisplayMessage {
  id: number;
  role: 'user' | 'opponent';
  content: string;
  score?: {
    score: number;
    previousScore: number;
  };
}

const DebateGame: React.FC<DebateGameProps> = (props) => {
  const { isDarkMode, onToggleDarkMode, aiPersonality } = props;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateInitializedRef = useRef(false);

  // Use either live debate logic or replay logic based on mode
  const debateHook = props.isReplayMode
    ? useDebateReplay(props.conversationId, aiPersonality)
    : useDebateLogic(
        props.topic,
        props.difficulty,
        props.userPosition,
        aiPersonality,
        props.subjectId
      );

  const {
    state,
    messages,
    handleSendArgument,
    handleHintRequest,
    initializeDebate,
    generateDebateSummary,
    gameSetup
  } = debateHook;

  const { timeLeft } = useTimer(300, async () => {
    return Promise.resolve();
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!props.isReplayMode && messages.length === 0 && !debateInitializedRef.current) {
      debateInitializedRef.current = true;
      initializeDebate();
    }
  }, [props.isReplayMode, messages.length, initializeDebate]);

  const onSendArgumentClick = async (currentArgument: string) => {
    if (state.isLoading) return;
    await handleSendArgument(currentArgument);
  };

  const onHintRequestClick = async (): Promise<string | null> => {
    if (state.isGeneratingHint) return null;
    const hint = await handleHintRequest();
    return hint || null;
  };

  const onEndDebateClick = async () => {
    await generateDebateSummary();
  };

  const onPlayAgain = () => {
    window.location.reload(); // For now, just reload the page
  };

  // Filter out hint messages and cast to DisplayMessage type
  const displayMessages = messages
    .filter(message => message.role === 'user' || message.role === 'opponent') as DisplayMessage[];

  // Determine if controls should be disabled
  const isControlsDisabled = state.isLoading || state.isGeneratingSummary || props.isReplayMode;

  // Get game parameters based on mode
  const getGameParams = () => {
    if (props.isReplayMode) {
      if (!gameSetup) return null;
      return {
        topic: gameSetup.topic,
        userPosition: gameSetup.position,
        subjectId: gameSetup.subjectId,
        skill: gameSetup.skill
      };
    }
    return {
      topic: props.topic,
      userPosition: props.userPosition,
      subjectId: props.subjectId,
      skill: props.difficulty
    };
  };

  const gameParams = getGameParams();
  if (!gameParams) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  if (state.summary) {
    return (
      <GameSummary
        score={state.summary.score}
        feedback={state.summary.feedback}
        improvements={state.summary.improvements}
        onPlayAgain={onPlayAgain}
        isHighScore={state.summary.isHighScore}
        conversationId={state.conversationId || undefined}
        subjectId={gameParams.subjectId}
        position={gameParams.userPosition}
        skill={gameParams.skill}
      />
    );
  }

  const aiPosition = gameParams.userPosition === 'for' ? 'against' : 'for';

  return (
    <div 
      data-testid="debate-game"
      className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <DebateHeader
        topic={gameParams.topic}
        timeLeft={timeLeft}
        audienceScore={state.audienceScore}
        userPosition={gameParams.userPosition}
        aiPosition={aiPosition}
        aiName={aiPersonality.name}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        isReplayMode={props.isReplayMode}
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
              userPosition={gameParams.userPosition}
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
        onSendArgument={onSendArgumentClick}
        onHintRequest={onHintRequestClick}
        onEndDebate={onEndDebateClick}
        isLoading={state.isLoading}
        isGeneratingHint={state.isGeneratingHint}
        userPosition={gameParams.userPosition}
        isDisabled={isControlsDisabled}
        isReplayMode={props.isReplayMode}
        currentArgument=""
        setCurrentArgument={() => {}}
      />
    </div>
  );
};

export default DebateGame;
