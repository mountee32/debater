import React from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySliderProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

const DifficultySlider: React.FC<DifficultySliderProps> = ({ difficulty, onDifficultyChange }) => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Select Difficulty</h2>
      <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-700 rounded-full p-2">
        {difficulties.map((d) => (
          <button
            key={d}
            className={`px-4 py-2 rounded-full transition-all duration-300 ${
              difficulty === d
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            onClick={() => onDifficultyChange(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySlider;
