import React, { useState, useRef, useEffect } from 'react';
import { Clock, Send, Lightbulb, Flag, Loader, User, ThumbsUp, ThumbsDown } from 'lucide-react';
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

  const getScoreColor = (score: number) => {
    if (score <= 40) return 'bg-gradient-to-r from-red-600 to-red-400';
    if (score <= 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-green-600 to-green-400';
  };

  const updateAudienceScore = (messageScore: number, isUserMessage: boolean) => {
    setAudienceScore(prev => {
      const scoreDelta = (messageScore - 5) * 2; // Convert 0-10 score to percentage change
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
      // Add user's message first
      addMessage('user', currentArgument);

      // Get AI's response
      const { response, evaluation } = await continueDebate(
        topic,
        messages,
        currentArgument,
        difficulty,
        userPosition,
        aiPersonality
      );

      if (response) {
        // Add AI's response
        addMessage('opponent', response);

        // Update scores
        const totalScore = evaluation.score;
        updateMessageScore(messages.length + 1, totalScore);
        setCurrentScore(prev => prev + totalScore);
        updateAudienceScore(totalScore, true);

        // Update combo
        if (evaluation.score >= 7) {
          setConsecutiveGoodArguments(prev => prev + 1);
        } else {
          setConsecutiveGoodArguments(0);
        }

        // Update AI's score after response
        const aiScore = 5 + (Math.random() * 2 - 1); // Random score between 4-6 for AI
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
    <div className="text-gray-900 dark:text-gray-100">
      <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold text-center text-indigo-900 dark:text-indigo-100 mb-3">
          {topic}
        </h2>
        <div className="flex justify-center space-x-6">
          <div className="text-center">
            <div className="text-sm mb-1">Your Position</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full ${
              userPosition === 'for' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {userPosition === 'for' ? <ThumbsUp size={16} className="mr-1" /> : <ThumbsDown size={16} className="mr-1" />}
              <span className="font-semibold capitalize">{userPosition}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm mb-1">AI Position</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full ${
              aiPosition === 'for' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {aiPosition === 'for' ? <ThumbsUp size={16} className="mr-1" /> : <ThumbsDown size={16} className="mr-1" />}
              <span className="font-semibold capitalize">{aiPosition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audience Score Display */}
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center mb-2 font-semibold">Audience Score</div>
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreColor(audienceScore.user)}`}
            style={{ width: `${audienceScore.user}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-sm">
          <span className={audienceScore.user > audienceScore.opponent ? 'font-bold' : ''}>
            You: {Math.round(audienceScore.user)}%
          </span>
          <span className={audienceScore.opponent > audienceScore.user ? 'font-bold' : ''}>
            AI: {Math.round(audienceScore.opponent)}%
          </span>
        </div>
      </div>

      <div className="mb-2 h-96 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 mb-2 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
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
              className={`flex-1 p-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : message.role === 'opponent'
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'bg-yellow-100 dark:bg-yellow-900'
              }`}
            >
              <p>{message.content}</p>
              {message.score !== undefined && (
                <p className="text-xs mt-1">Score: {message.score}</p>
              )}
              {message.role === 'hint' && (
                <button
                  onClick={() => handleHintSelection(message.content)}
                  className="mt-1 text-xs text-blue-600 dark:text-blue-400"
                >
                  Use Hint
                </button>
              )}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex items-start space-x-2 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              <img
                src={aiPersonality.avatarUrl}
                alt={`${aiPersonality.name} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="inline-block p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Loader className="animate-spin" size={16} />
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm mb-2 p-2 bg-red-100 dark:bg-red-900 rounded">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mb-2 flex flex-col">
        <textarea
          className="mb-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={currentArgument}
          onChange={(e) => setCurrentArgument(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your argument here..."
          rows={3}
        />
        <div className="flex space-x-2">
          <button
            onClick={handleSendArgument}
            disabled={isLoading || currentArgument.trim() === ''}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
          <button
            onClick={handleHintRequest}
            disabled={isGeneratingHint}
            className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {isGeneratingHint ? 'Thinking...' : 'Hint'}
          </button>
          <button
            onClick={handleEndGame}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebateGame;
