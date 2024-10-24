import React, { useState, useRef, useEffect } from 'react';
import { Clock, Send, Lightbulb, Flag, Loader, User, Sun, Moon } from 'lucide-react';
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
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
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
    <div className="text-gray-900 dark:text-gray-100 flex flex-col h-full relative">
      <div className="fixed top-0 left-0 right-0 z-10 shadow-lg">
        <div className="bg-indigo-100/95 dark:bg-indigo-900/95 backdrop-blur-sm p-4 border-b border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-white/90 dark:bg-indigo-800/90 px-4 py-2 rounded-full text-sm shadow-sm">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-300" />
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-full hover:bg-white/80 dark:hover:bg-indigo-800/80 transition-colors duration-200"
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun size={20} className="text-indigo-600 dark:text-indigo-300" />
                ) : (
                  <Moon size={20} className="text-indigo-600 dark:text-indigo-300" />
                )}
              </button>
            </div>
            <h1 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 text-center px-6 py-2 bg-white/90 dark:bg-indigo-800/90 rounded-xl shadow-sm">
              {topic}
            </h1>
          </div>
        </div>

        <div className="px-4 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreColor(audienceScore.user)}`}
                style={{ width: `${audienceScore.user}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-1 font-medium">
              <span className={`${getPositionColor(userPosition)} ${audienceScore.user > audienceScore.opponent ? 'font-bold' : ''}`}>
                You ({userPosition}) - {Math.round(audienceScore.user)}%
              </span>
              <span className={`${getPositionColor(aiPosition)} ${audienceScore.opponent > audienceScore.user ? 'font-bold' : ''}`}>
                {aiPersonality.name} ({aiPosition}) - {Math.round(audienceScore.opponent)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-800 mt-32 pb-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 p-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 shadow-sm">
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
                      userIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                      e.currentTarget.parentElement?.appendChild(userIcon);
                    }}
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-400 m-2" />
                )}
              </div>
              <div
                className={`flex-1 p-4 rounded-2xl shadow-sm transition-colors duration-200 ${
                  message.role === 'user'
                    ? userPosition === 'for' 
                      ? 'bg-green-50 dark:bg-green-900/30' 
                      : 'bg-red-50 dark:bg-red-900/30'
                    : message.role === 'opponent'
                    ? aiPosition === 'for'
                      ? 'bg-green-50 dark:bg-green-900/30'
                      : 'bg-red-50 dark:bg-red-900/30'
                    : 'bg-yellow-50 dark:bg-yellow-900/30'
                } max-w-[80%]`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-semibold ${
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
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Score: {message.score}
                    </span>
                  )}
                </div>
                <p className="text-base leading-relaxed">{message.content}</p>
                {message.role === 'hint' && (
                  <button
                    onClick={() => handleHintSelection(message.content)}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Use Hint
                  </button>
                )}
              </div>
            </div>
          ))}
          {isAiThinking && (
            <div className="flex items-start space-x-3 p-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 shadow-sm">
                <img
                  src={aiPersonality.avatarUrl}
                  alt={`${aiPersonality.name} avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="inline-block p-4 rounded-2xl bg-gray-100 dark:bg-gray-700/50 shadow-sm">
                <Loader className="animate-spin" size={16} />
              </div>
            </div>
          )}
          {error && (
            <div className="mx-4 my-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-shadow duration-200"
            value={currentArgument}
            onChange={(e) => setCurrentArgument(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type your argument here... (You are ${userPosition} this topic)`}
            rows={3}
          />
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleSendArgument}
              disabled={isLoading || currentArgument.trim() === ''}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-base font-medium shadow-sm transition-colors duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <Send size={18} />
                <span>Send</span>
              </div>
            </button>
            <button
              onClick={handleHintRequest}
              disabled={isGeneratingHint}
              className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-base font-medium shadow-sm transition-colors duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <Lightbulb size={18} />
                <span>{isGeneratingHint ? 'Thinking...' : 'Hint'}</span>
              </div>
            </button>
            <button
              onClick={handleEndGame}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 text-base font-medium shadow-sm transition-colors duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <Flag size={18} />
                <span>End</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateGame;
