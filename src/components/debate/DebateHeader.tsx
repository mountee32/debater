import React from 'react';
import { Clock, Sun, Moon } from 'lucide-react';

interface DebateHeaderProps {
  topic: string;
  timeLeft: number;
  audienceScore: {
    user: number;
    opponent: number;
  };
  userPosition: 'for' | 'against';
  aiPosition: 'for' | 'against';
  aiName: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const DebateHeader: React.FC<DebateHeaderProps> = ({
  topic,
  timeLeft,
  audienceScore,
  userPosition,
  aiPosition,
  aiName,
  isDarkMode,
  onToggleDarkMode,
}) => {
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

  return (
    <header 
      data-testid="debate-header"
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900"
    >
      <div className="h-[60px] bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-900 dark:to-indigo-900">
        <div className="flex items-center justify-between max-w-4xl mx-auto h-full px-4">
          <div className="flex items-center">
            <div 
              data-testid="timer"
              className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm shadow-lg"
            >
              <Clock size={14} className="text-white mr-2" />
              <span className="font-semibold text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <h1 
            data-testid="debate-topic"
            className="text-xl font-bold text-white text-center px-6"
          >
            {topic}
          </h1>
          <button
            data-testid="theme-toggle"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun size={20} className="text-white" />
            ) : (
              <Moon size={20} className="text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="h-[40px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg px-4">
        <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
          <div 
            data-testid="audience-score-bar"
            className="relative h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner"
          >
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreColor(audienceScore.user)}`}
              style={{ width: `${audienceScore.user}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-1 font-medium">
            <span 
              data-testid="user-score"
              className={`${getPositionColor(userPosition)} ${audienceScore.user > audienceScore.opponent ? 'font-bold' : ''}`}
            >
              You ({userPosition}) - {Math.round(audienceScore.user)}%
            </span>
            <span 
              data-testid="ai-score"
              className={`${getPositionColor(aiPosition)} ${audienceScore.opponent > audienceScore.user ? 'font-bold' : ''}`}
            >
              {aiName} ({aiPosition}) - {Math.round(audienceScore.opponent)}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
