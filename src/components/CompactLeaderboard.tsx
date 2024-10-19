import React, { useState } from 'react';
import { Book, Globe, Atom, Lightbulb, Shuffle } from 'lucide-react';
import { LeaderboardEntry, leaderboardData } from '../data/leaderboardData';

interface CompactLeaderboardProps {
  username: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const categoryIcons: { [key: string]: React.ElementType } = {
  Religion: Book,
  Politics: Globe,
  Science: Atom,
  Philosophy: Lightbulb,
  Random: Shuffle,
};

const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({ username, isExpanded, onToggle }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const filteredEntries = selectedCategory
    ? leaderboardData.filter(entry => entry.category === selectedCategory)
    : leaderboardData;

  const sortedEntries = filteredEntries.sort((a, b) => b.score - a.score);
  const displayedEntries = isExpanded ? sortedEntries : sortedEntries.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Leaderboard</h2>
        <button
          onClick={onToggle}
          className="text-sm text-blue-500 hover:text-blue-700 transition-colors duration-300"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      <div className="flex flex-wrap justify-center mb-4">
        {Object.entries(categoryIcons).map(([category, Icon]) => (
          <button
            key={category}
            className={`flex items-center m-1 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
          >
            <Icon size={12} className="mr-1" />
            {category}
          </button>
        ))}
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <div className="flex text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
          <div className="w-16 text-center">Score</div>
          <div className="w-32 text-left">Name</div>
          <div className="flex-1 text-left">Subject</div>
        </div>
        {displayedEntries.map((entry) => (
          <div key={entry.id} className={`flex py-2 text-xs ${username === entry.username ? 'font-bold bg-indigo-100 dark:bg-indigo-900' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}>
            <div className="w-16 text-center text-gray-800 dark:text-gray-200">{entry.score}</div>
            <div className="w-32 text-left text-gray-800 dark:text-gray-200 truncate" title={entry.username}>
              {truncateText(entry.username, 12)}
            </div>
            <div className="flex-1 text-gray-800 dark:text-gray-200 truncate text-left" title={entry.subject}>
              {entry.subject}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactLeaderboard;
