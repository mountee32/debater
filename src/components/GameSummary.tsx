import React, { useState } from 'react';
import { Trophy, Star, RotateCcw } from 'lucide-react';

interface GameSummaryProps {
  score: number;
  feedback: string;
  improvements: string[];
  onPlayAgain: () => void;
  isHighScore?: boolean;
  conversationId?: string;
  subjectId?: string;
  position?: 'for' | 'against';
  skill?: 'easy' | 'medium' | 'hard';
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  score,
  feedback,
  improvements,
  onPlayAgain,
  isHighScore,
  conversationId,
  subjectId,
  position,
  skill
}) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highScoreSubmitted, setHighScoreSubmitted] = useState(false);

  const handleSubmitHighScore = async () => {
    if (!username.trim() || !conversationId || !subjectId || !position || !skill) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/add-high-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          score,
          subjectId,
          position,
          skill,
          conversationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit high score');
      }

      setHighScoreSubmitted(true);
    } catch (err) {
      setError('Failed to submit high score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
            Debate Complete!
          </h2>
          <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-4">
            <p className="text-lg text-white/90 mb-2">Final Score</p>
            <p className="text-6xl font-bold text-white">{score}/100</p>
            <div className="mt-2 text-white/80">
              {score >= 90 ? '🏆 Outstanding!' :
               score >= 80 ? '🌟 Excellent!' :
               score >= 70 ? '👏 Great Job!' :
               score >= 60 ? '💪 Good Effort!' :
               '🎯 Keep Practicing!'}
            </div>
          </div>
        </div>

        {isHighScore && !highScoreSubmitted && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-6 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-3 flex items-center text-yellow-800 dark:text-yellow-200">
              <Trophy className="w-5 h-5 mr-2" />
              New High Score!
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Congratulations! You've achieved a high score. Enter your name to be added to the leaderboard.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-4 py-2 rounded-lg border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                maxLength={20}
              />
              <button
                onClick={handleSubmitHighScore}
                disabled={!username.trim() || isSubmitting}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                {error}
              </p>
            )}
          </div>
        )}

        {highScoreSubmitted && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-6 mb-6 transition-all duration-300">
            <p className="text-green-700 dark:text-green-300 text-center font-semibold">
              High score submitted successfully! 🎉
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-purple-500" />
              Debate Analysis
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {feedback}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-500" />
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-7 h-7 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 text-base">
                    {improvement}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={onPlayAgain}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold flex items-center space-x-2"
            >
              <RotateCcw size={20} className="mr-2" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
