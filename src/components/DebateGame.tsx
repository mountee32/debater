import React, { useState, useRef, useEffect } from 'react';
import { Clock, Send, Lightbulb, Flag, Loader, User } from 'lucide-react';
import { startDebate, continueDebate, generateHint, endDebate, calculateProgressiveScore, calculateComboBonus } from '../api/openRouterApi';
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

interface Feedback {
  score: number;
  feedback: string;
  consistencyScore: number;
  factScore: number;
  styleScore: number;
  audienceReaction: number;
  progressiveBonus: number;
  timeBonus: number;
  comboBonus: number;
}

const TIME_LIMIT = 60; // 60 seconds per argument
const BONUS_THRESHOLD = 30; // Bonus points if answered within 30 seconds

const DebateGame: React.FC<DebateGameProps> = ({ topic, difficulty, onEndGame, aiPersonality, userPosition }) => {
  const { messages, addMessage, updateMessageScore, removeHintMessages } = useMessageHandler();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentArgument, setCurrentArgument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [consecutiveGoodArguments, setConsecutiveGoodArguments] = useState(0);
  const [isDebateEnded, setIsDebateEnded] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
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
    }
  };

  const timeLeft = useTimer(300, handleEndGame);
  const argumentTimer = useTimer(TIME_LIMIT, () => {});

  useEffect(() => {
    log(`DebateGame: Component mounted or updated. Topic: ${topic}, Messages count: ${messages.length}, Difficulty: ${difficulty}`);
  });

  useEffect(() => {
    if (topic && messages.length === 0 && !debateInitializedRef.current) {
      log(`DebateGame: Initializing debate with topic: ${topic}, difficulty: ${difficulty}, and personality: ${aiPersonality.name}`);
      debateInitializedRef.current = true;
      setIsLoading(true);
      setIsAiThinking(true);

      startDebate(topic, difficulty, userPosition, aiPersonality).then((response) => {
        log(`DebateGame: Received initial AI response: ${response}`);
        addMessage('opponent', response);
        setIsLoading(false);
        setIsAiThinking(false);
      });
    }
  }, [topic, difficulty, messages.length, aiPersonality, userPosition]);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendArgument = async () => {
    if (currentArgument.trim() === '' || isLoading) return;

    setIsLoading(true);
    setIsAiThinking(true);
    const timeBonus = argumentTimer > BONUS_THRESHOLD ? 2 : 0;
    const userMessageId = messages.length + 1;
    const updatedMessages = [...messages, { id: userMessageId, role: 'user', content: currentArgument }];
    addMessage('user', currentArgument);
    setCurrentArgument('');
    removeHintMessages();

    try {
      const { response, evaluation } = await continueDebate(topic, updatedMessages, currentArgument, difficulty, userPosition, aiPersonality);
      addMessage('opponent', response);
      
      const roundNumber = updatedMessages.filter(m => m.role === 'user').length;
      const progressiveScore = calculateProgressiveScore(evaluation.score, roundNumber);
      const comboBonus = calculateComboBonus(consecutiveGoodArguments);
      const totalScore = progressiveScore + timeBonus + comboBonus;

      updateMessageScore(userMessageId, totalScore);

      setFeedbacks(prev => [...prev, {
        ...evaluation,
        score: totalScore,
        progressiveBonus: progressiveScore - evaluation.score,
        timeBonus,
        comboBonus
      }]);

      setCurrentScore((prevScore) => prevScore + totalScore);

      if (evaluation.score >= 7) {
        setConsecutiveGoodArguments(prev => prev + 1);
      } else {
        setConsecutiveGoodArguments(0);
      }
    } catch (error) {
      log(`DebateGame: Error in debate continuation: ${error}`);
    }

    setIsLoading(false);
    setIsAiThinking(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleHintRequest = async () => {
    if (isGeneratingHint) return;

    setIsGeneratingHint(true);
    setIsAiThinking(true);
    try {
      const hint = await generateHint(topic, messages, difficulty, userPosition);
      removeHintMessages();
      addMessage('hint', hint);
    } catch (error) {
      log(`DebateGame: Error generating hint: ${error}`);
    }
    setIsGeneratingHint(false);
    setIsAiThinking(false);
  };

  const handleHintSelection = (hint: string) => {
    setCurrentArgument(hint);
    removeHintMessages();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendArgument();
    }
  };

  if (isDebateEnded) {
    return (
      <div className="text-gray-900 dark:text-gray-100">
        <h2 className="text-2xl font-semibold mb-4">Debate Ended</h2>
        <p className="text-lg mb-4">Final Score: {currentScore}</p>
        <h3 className="text-xl font-semibold mb-2">Detailed Feedback:</h3>
        {feedbacks.map((feedback, index) => (
          <div key={index} className="mb-4 p-4 border rounded bg-white dark:bg-gray-800">
            <h4 className="font-semibold">Argument {index + 1}</h4>
            <p>Score: {feedback.score}</p>
            <p>Feedback: {feedback.feedback}</p>
            <p>Consistency: {feedback.consistencyScore}</p>
            <p>Factual Accuracy: {feedback.factScore}</p>
            <p>Debate Style: {feedback.styleScore}</p>
            <p>Audience Reaction: {feedback.audienceReaction}</p>
            <p>Progressive Bonus: +{feedback.progressiveBonus}</p>
            <p>Time Bonus: +{feedback.timeBonus}</p>
            <p>Combo Bonus: +{feedback.comboBonus}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-gray-900 dark:text-gray-100">
      <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mb-2">
        <h2 className="text-xl font-semibold text-center text-indigo-900 dark:text-indigo-100">
          {topic}
        </h2>
      </div>
      <div className="flex justify-between items-center mb-2 text-sm">
        <p>Difficulty: {difficulty}</p>
        <div className="flex space-x-2">
          <p className={`font-semibold ${userPosition === 'for' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            You: {userPosition === 'for' ? 'For' : 'Against'}
          </p>
          <p className={`font-semibold ${aiPosition === 'for' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            AI ({aiPersonality.name}): {aiPosition === 'for' ? 'For' : 'Against'}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-2 text-sm">
        <div className="flex items-center">
          <Clock className="mr-1" size={16} />
          <span className="font-semibold">{formatTime(timeLeft)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Score: {currentScore}</span>
          <span>Time Bonus: {argumentTimer > BONUS_THRESHOLD ? '+2' : '+0'}</span>
          <span>Combo: x{consecutiveGoodArguments + 1}</span>
        </div>
      </div>
      <div className="mb-2 h-96 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
          >
            {message.role === 'opponent' && (
              <div className="w-8 h-8 rounded-full mr-2 overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
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
              </div>
            )}
            <div
              className={`message-bubble ${
                message.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : 
                message.role === 'opponent' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 
                'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
              } p-2 rounded-lg max-w-3/4 text-sm`}
            >
              {message.role === 'hint' ? (
                <div>
                  <p>Hint: {message.content}</p>
                  <button
                    onClick={() => handleHintSelection(message.content)}
                    className="btn-secondary mr-2 mt-1 bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 transition-colors duration-300"
                  >
                    Use Hint
                  </button>
                  <button
                    onClick={removeHintMessages}
                    className="btn-secondary mt-1 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p>{message.content}</p>
                  {message.score !== undefined && (
                    <p className="text-xs mt-1">Score: {message.score}</p>
                  )}
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full ml-2 overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="message-bubble bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg mb-2">
              <Loader className="animate-spin" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mb-2 flex flex-col">
        <textarea
          className="input-field mb-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          value={currentArgument}
          onChange={(e) => setCurrentArgument(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your argument here..."
        />
        <div className="flex space-x-1">
          <button
            onClick={handleSendArgument}
            disabled={isLoading || currentArgument.trim() === ''}
            className="btn-primary flex-1 py-1 px-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center"
          >
            <Send className="inline-block mr-1" size={16} />
            Send
          </button>
          <button
            onClick={handleHintRequest}
            disabled={isGeneratingHint}
            className="btn-secondary flex-1 py-1 px-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors duration-300 flex items-center justify-center"
          >
            <Lightbulb className="inline-block mr-1" size={16} />
            {isGeneratingHint ? 'Thinking...' : 'Hint'}
          </button>
          <button
            onClick={handleEndGame}
            className="btn-secondary flex-1 py-1 px-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors duration-300 flex items-center justify-center"
            disabled={isLoading}
          >
            <Flag className="inline-block mr-1" size={16} />
            End
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebateGame;
