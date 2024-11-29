import React from 'react';
import { Trophy, Star, RotateCcw } from 'lucide-react';

interface GameSummaryProps {
  score: number;
  feedback: string;
  improvements: string[];
  onPlayAgain: () => void;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  score,
  feedback,
  improvements,
  onPlayAgain
}) => {
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
