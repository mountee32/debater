import React, { useState, useRef, useEffect } from 'react';
import { Clock, Send, Lightbulb, Flag, Loader, User } from 'lucide-react';
import { startDebate, continueDebate, generateHint, endDebate } from '../api/openRouterApi';
import { log } from '../utils/logger';
import { AIPersonality } from '../data/aiPersonalities';
import { useMessageHandler } from '../hooks/useMessageHandler';
import { useTimer } from '../hooks/useTimer';

interface DebateGameProps {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onEndGame: (result: { overallScore: number; rationale: string; recommendations: string }) => void;
  aiPersonality: AIPersonality;
  userPosition: 'for' | 'against';
}

const DebateGame: React.FC<DebateGameProps> = ({ topic, difficulty, onEndGame, aiPersonality, userPosition }) => {
  const { messages, addMessage, updateMessageScore, removeHintMessages } = useMessageHandler();
  const [currentArgument, setCurrentArgument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [audienceScore, setAudienceScore] = useState({ user: 50, opponent: 50 });
  const [consecutiveGoodArguments, setConsecutiveGoodArguments] = useState(0);
  const [isDebateEnded, setIsDebateEnded] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiPosition = userPosition === 'for' ? 'against' : 'for';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateInitializedRef = useRef(false);

  const handleEndGame = async () => {
    const userArguments = messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content);
    const scores = messages
      .filter((message) => message.role === 'user' && message.score !== undefined)
      .map((message) => message.score as number);
    
    try {
      const result = await endDebate(topic, userArguments, scores, difficulty, userPosition);
      setIsDebateEnded(true);
      onEndGame(result);
    } catch (error) {
      log(`DebateGame: Error ending debate: ${error}`);
      setError('Failed to end debate. Please try again.');
    }
  };

  const timeLeft = useTimer(300, handleEndGame);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score <= 40) return 'bg-gradient-to-r from-red-600 to-red-400';
    if (score <= 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-green-600 to-green-400';
  };

  const getPositionColor = (position: 'for' | 'against') => {
    return position === 'for' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const updateAudienceScore = (messageScore: number, isUserMessage: boolean) => {
    setAudienceScore(prev => {
      const scoreDelta = (messageScore - 5) * 2;
      if (isUserMessage) {
        const userNew = Math.min(Math.max(prev.user + scoreDelta, 0), 100);
        return {
          user: userNew,
          opponent: 100 - userNew
        };
      } else {
        const opponentNew = Math.min(Math.max(prev.opponent + scoreDelta, 0), 100);
        return {
          user: 100 - opponentNew,
          opponent: opponentNew
        };
      }
    });
  };

  useEffect(() => {
    const initializeDebate = async () => {
      if (topic && messages.length === 0 && !debateInitializedRef.current) {
        log(`DebateGame: Initializing debate with topic: ${topic}`);
        debateInitializedRef.current = true;
        setIsLoading(true);
        setIsAiThinking(true);
        setError(null);

        try {
          const response = await startDebate(topic, difficulty, userPosition, aiPersonality);
          log(`DebateGame: Received initial AI response: ${response}`);
          if (response) {
            addMessage('opponent', response);
          }
        } catch (error) {
          log(`DebateGame: Error initializing debate: ${error}`);
          setError('Failed to start debate. Please try again.');
          debateInitializedRef.current = false;
        } finally {
          setIsLoading(false);
          setIsAiThinking(false);
        }
      }
    };

    initializeDebate();
  }, [topic, difficulty, messages.length, aiPersonality, userPosition, addMessage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendArgument = async () => {
    if (currentArgument.trim() === '' || isLoading) return;

    setIsLoading(true);
    setIsAiThinking(true);
    setError(null);

    try {
      addMessage('user', currentArgument);

      const { response, evaluation } = await continueDebate(
        topic,
        messages,
        currentArgument,
        difficulty,
        userPosition,
        aiPersonality
      );

      if (response) {
        addMessage('opponent', response);

        const totalScore = evaluation.score;
        updateMessageScore(messages.length + 1, totalScore);
        setCurrentScore(prev => prev + totalScore);
        updateAudienceScore(totalScore, true);

        if (evaluation.score >= 7) {
          setConsecutiveGoodArguments(prev => prev + 1);
        } else {
          setConsecutiveGoodArguments(0);
        }

        const aiScore = 5 + (Math.random() * 2 - 1);
        updateAudienceScore(aiScore, false);
      }
    } catch (error) {
      log(`DebateGame: Error in debate continuation: ${error}`);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setCurrentArgument('');
      removeHintMessages();
      setIsLoading(false);
      setIsAiThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendArgument();
    }
  };

  const handleHintRequest = async () => {
    if (isGeneratingHint) return;

    setIsGeneratingHint(true);
    setIsAiThinking(true);
    setError(null);

    try {
      const hint = await generateHint(topic, messages, difficulty, userPosition);
      if (hint) {
        removeHintMessages();
        addMessage('hint', hint);
      }
    } catch (error) {
      log(`DebateGame: Error generating hint: ${error}`);
      setError('Failed to generate hint. Please try again.');
    } finally {
      setIsGeneratingHint(false);
      setIsAiThinking(false);
    }
  };

  const handleHintSelection = (hint: string) => {
    setCurrentArgument(hint);
    removeHintMessages();
  };

  return (
    <div className="text-gray-900 dark:text-gray-100 flex flex-col h-full">
      <div className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100 truncate flex-1 mr-2">
            {topic}
          </span>
          <div className="flex items-center space-x-1 bg-indigo-200 dark:bg-indigo-800 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
            <Clock size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-2 py-1 bg-gray-50 dark:bg-gray-900">
        <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreColor(audienceScore.user)}`}
            style={{ width: `${audienceScore.user}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-0.5">
          <span className={`${getPositionColor(userPosition)} ${audienceScore.user > audienceScore.opponent ? 'font-bold' : ''}`}>
            You ({userPosition}) - {Math.round(audienceScore.user)}%
          </span>
          <span className={`${getPositionColor(aiPosition)} ${audienceScore.opponent > audienceScore.user ? 'font-bold' : ''}`}>
            {aiPersonality.name} ({aiPosition}) - {Math.round(audienceScore.opponent)}%
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto border-t border-b bg-white dark:bg-gray-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 p-1.5 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {message.role === 'opponent' ? (
                <img
                  src={aiPersonality.avatarUrl}
                  alt={`${aiPersonality.name} avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                    const userIcon = document.createElement('div');
                    userIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                    e.currentTarget.parentElement?.appendChild(userIcon);
                  }}
                />
              ) : (
                <User className="w-3 h-3 text-gray-400 m-1.5" />
              )}
            </div>
            <div
              className={`flex-1 p-2 rounded-lg ${
                message.role === 'user'
                  ? userPosition === 'for' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                  : message.role === 'opponent'
                  ? aiPosition === 'for'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-medium ${
                  message.role === 'user' 
                    ? getPositionColor(userPosition)
                    : message.role === 'opponent'
                    ? getPositionColor(aiPosition)
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {message.role === 'user' 
                    ? `You (${userPosition})`
                    : message.role === 'opponent'
                    ? `${aiPersonality.name} (${aiPosition})`
                    : 'Hint'}
                </span>
                {message.score !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Score: {message.score}
                  </span>
                )}
              </div>
              <p className="text-sm">{message.content}</p>
              {message.role === 'hint' && (
                <button
                  onClick={() => handleHintSelection(message.content)}
                  className="mt-0.5 text-xs text-blue-600 dark:text-blue-400"
                >
                  Use Hint
                </button>
              )}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex items-start space-x-2 p-1.5">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              <img
                src={aiPersonality.avatarUrl}
                alt={`${aiPersonality.name} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="inline-block p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Loader className="animate-spin" size={14} />
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-xs p-1.5 bg-red-100 dark:bg-red-900 rounded mx-1.5 my-1">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-1">
        <textarea
          className="w-full p-1.5 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          value={currentArgument}
          onChange={(e) => setCurrentArgument(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Type your argument here... (You are ${userPosition} this topic)`}
          rows={2}
        />
        <div className="flex space-x-1 mt-1">
          <button
            onClick={handleSendArgument}
            disabled={isLoading || currentArgument.trim() === ''}
            className="flex-1 py-1 px-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            Send
          </button>
          <button
            onClick={handleHintRequest}
            disabled={isGeneratingHint}
            className="flex-1 py-1 px-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm"
          >
            {isGeneratingHint ? 'Thinking...' : 'Hint'}
          </button>
          <button
            onClick={handleEndGame}
            className="flex-1 py-1 px-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebateGame;
