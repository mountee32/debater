import React from 'react';
import { User } from 'lucide-react';
import { AIPersonality } from '../../data/aiPersonalities';

interface MessageBubbleProps {
  role: 'user' | 'opponent';
  content: string;
  score?: number;
  userPosition: 'for' | 'against';
  aiPosition: 'for' | 'against';
  aiPersonality: AIPersonality;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  score,
  userPosition,
  aiPosition,
  aiPersonality,
}) => {
  const getPositionColor = (position: 'for' | 'against') => {
    return position === 'for' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getScoreDisplay = (score: number) => {
    const percentageChange = (score - 5) * 2;
    const sign = percentageChange >= 0 ? '+' : '';
    const displayValue = Math.round(percentageChange);
    return sign + displayValue.toString() + '%';
  };

  const getScoreColor = (score: number) => {
    const percentageChange = (score - 5) * 2;
    if (percentageChange > 0) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    } else if (percentageChange < 0) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
    return 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
  };

  return (
    <div
      data-testid={`message-bubble-${role}`}
      className={`flex items-start space-x-3 mb-3 ${
        role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 shadow-lg">
        {role === 'opponent' ? (
          <img
            src={aiPersonality.avatarUrl}
            alt={`${aiPersonality.name} avatar`}
            className="w-full h-full object-cover"
            data-testid="ai-avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              const userIcon = document.createElement('div');
              userIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
              e.currentTarget.parentElement?.appendChild(userIcon);
            }}
          />
        ) : (
          <User className="w-5 h-5 text-gray-400 m-2" data-testid="user-avatar" />
        )}
      </div>
      <div
        data-testid="message-content"
        className={`flex-1 p-4 rounded-2xl shadow-lg transition-colors duration-200 ${
          role === 'user'
            ? userPosition === 'for' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30' 
              : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30'
            : aiPosition === 'for'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30'
              : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30'
        } max-w-[80%]`}
      >
        <div className="flex justify-between items-center mb-1.5">
          <span 
            data-testid="message-author"
            className={`text-sm font-bold ${
              role === 'user' 
                ? getPositionColor(userPosition)
                : getPositionColor(aiPosition)
            }`}
          >
            {role === 'user' 
              ? `You (${userPosition})`
              : `${aiPersonality.name} (${aiPosition})`}
          </span>
          {score !== undefined && (
            <span 
              data-testid="message-score"
              className={`text-sm font-medium px-2.5 py-0.5 rounded-lg ${getScoreColor(score)}`}
            >
              {getScoreDisplay(score)}
            </span>
          )}
        </div>
        <p className="text-base leading-relaxed">{content}</p>
      </div>
    </div>
  );
};
