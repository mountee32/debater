import React from 'react';
import { Send, Lightbulb, Flag } from 'lucide-react';

interface DebateControlsProps {
  currentArgument: string;
  setCurrentArgument: (value: string) => void;
  onSendArgument: () => void;
  onHintRequest: () => void;
  onEndGame: () => void;
  isLoading: boolean;
  isGeneratingHint: boolean;
  userPosition: 'for' | 'against';
}

export const DebateControls: React.FC<DebateControlsProps> = ({
  currentArgument,
  setCurrentArgument,
  onSendArgument,
  onHintRequest,
  onEndGame,
  isLoading,
  isGeneratingHint,
  userPosition,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendArgument();
    }
  };

  return (
    <footer 
      data-testid="debate-controls"
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg"
    >
      <div className="max-w-4xl mx-auto">
        <textarea
          data-testid="argument-input"
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base shadow-lg focus:ring-4 focus:ring-purple-500/20 dark:focus:ring-purple-500/40 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-200"
          value={currentArgument}
          onChange={(e) => setCurrentArgument(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type your argument here... (You are ${userPosition} this topic)`}
          rows={2}
        />
        <div className="flex space-x-3 mt-3">
          <button
            data-testid="send-button"
            onClick={onSendArgument}
            disabled={isLoading || currentArgument.trim() === ''}
            className="flex-1 py-2.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 text-base font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center space-x-2">
              <Send size={18} />
              <span>Send</span>
            </div>
          </button>
          <button
            data-testid="hint-button"
            onClick={onHintRequest}
            disabled={isGeneratingHint}
            className="flex-1 py-2.5 px-5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl disabled:opacity-50 text-base font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center space-x-2">
              <Lightbulb size={18} />
              <span>{isGeneratingHint ? 'Thinking...' : 'Hint'}</span>
            </div>
          </button>
          <button
            data-testid="end-button"
            onClick={onEndGame}
            className="flex-1 py-2.5 px-5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-base font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center space-x-2">
              <Flag size={18} />
              <span>End</span>
            </div>
          </button>
        </div>
      </div>
    </footer>
  );
};
