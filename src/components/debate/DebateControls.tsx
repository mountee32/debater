import React from 'react';
import { Send, Lightbulb, Flag } from 'lucide-react';

interface DebateControlsProps {
  currentArgument: string;
  setCurrentArgument: (value: string) => void;
  onSendArgument: (argument: string) => Promise<void>;
  onHintRequest: () => Promise<string | null>;
  onEndDebate: () => void;
  isLoading: boolean;
  isGeneratingHint: boolean;
  userPosition: 'for' | 'against';
  isDisabled?: boolean;
  isReplayMode?: boolean;
}

export const DebateControls: React.FC<DebateControlsProps> = ({
  currentArgument,
  setCurrentArgument,
  onSendArgument,
  onHintRequest,
  onEndDebate,
  isLoading,
  isGeneratingHint,
  userPosition,
  isDisabled = false,
  isReplayMode = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
      e.preventDefault();
      handleSendArgument();
    }
  };

  const handleSendArgument = async () => {
    if (isDisabled || isLoading || currentArgument.trim() === '') return;
    await onSendArgument(currentArgument);
    setCurrentArgument('');
  };

  const handleHintRequest = async () => {
    if (isDisabled || isGeneratingHint) return;
    const hint = await onHintRequest();
    if (hint) {
      setCurrentArgument(hint);
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
          className={`w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base shadow-lg focus:ring-4 focus:ring-purple-500/20 dark:focus:ring-purple-500/40 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-200 ${
            isReplayMode ? 'opacity-50' : ''
          }`}
          value={currentArgument}
          onChange={(e) => setCurrentArgument(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReplayMode ? 'Replay mode - controls disabled' : `Type your argument here... (You are ${userPosition} this topic)`}
          rows={2}
          disabled={isDisabled || isReplayMode}
        />
        <div className="flex space-x-3 mt-3">
          <button
            data-testid="send-button"
            onClick={handleSendArgument}
            disabled={isDisabled || isLoading || currentArgument.trim() === '' || isReplayMode}
            className={`flex-1 py-2.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-base font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              isReplayMode ? 'opacity-50' : 'disabled:opacity-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Send size={18} />
              <span>Send</span>
            </div>
          </button>
          <button
            data-testid="hint-button"
            onClick={handleHintRequest}
            disabled={isDisabled || isGeneratingHint || isReplayMode}
            className={`flex-1 py-2.5 px-5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl text-base font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              isReplayMode ? 'opacity-50' : 'disabled:opacity-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Lightbulb size={18} />
              <span>{isGeneratingHint ? 'Thinking...' : 'Hint'}</span>
            </div>
          </button>
          <button
            data-testid="end-button"
            onClick={onEndDebate}
            disabled={isDisabled && !isReplayMode} // Enable during replay mode
            className="flex-1 py-2.5 px-5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-base font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
