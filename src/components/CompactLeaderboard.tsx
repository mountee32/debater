import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Book, Globe, Atom, Lightbulb, Shuffle, Cpu } from 'lucide-react';
import { getLeaderboard } from '../api/openRouterApi';

interface CompactLeaderboardProps {
  username: string;
  isExpanded: boolean;
  onToggle: () => void;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  subject: string;
}

const mockLeaderboardData: LeaderboardEntry[] = [
  { id: 1, username: "debateChamp", score: 95, difficulty: "hard", category: "Politics", subject: "Should voting be mandatory?" },
  { id: 2, username: "logicMaster", score: 92, difficulty: "hard", category: "Ethics", subject: "Is euthanasia morally justifiable?" },
  { id: 3, username: "persuader101", score: 88, difficulty: "medium", category: "Science", subject: "Are GMOs beneficial for society?" },
  { id: 4, username: "rationalThinker", score: 85, difficulty: "medium", category: "Philosophy", subject: "Does free will exist?" },
  { id: 5, username: "debateNewbie", score: 75, difficulty: "easy", category: "Technology", subject: "Is social media overall good for society?" },
];

const categoryIcons: { [key: string]: React.ElementType } = {
  Religion: Book,
  Politics: Globe,
  Science: Atom,
  Philosophy: Lightbulb,
  Ethics: Lightbulb,
  Technology: Cpu,
  Random: Shuffle,
};

interface CategoryButtonsProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const CategoryButtons: React.FC<CategoryButtonsProps> = ({ selectedCategory, onCategorySelect }) => {
  return (
    <div className="flex flex-wrap justify-center mb-4">
      {Object.entries(categoryIcons).map(([category, Icon]) => (
        <button
          key={category}
          className={`flex items-center m-1 px-3 py-1 rounded-full text-sm ${
            selectedCategory === category
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          onClick={() => onCategorySelect(selectedCategory === category ? null : category)}
        >
          <Icon size={16} className="mr-1" />
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
};

const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({ username, isExpanded, onToggle }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(mockLeaderboardData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Commented out the API call and using mock data instead
      // const data = await getLeaderboard();
      // setLeaderboardData(data.slice(0, 10)); // Get top 10 entries
      setLeaderboardData(mockLeaderboardData);
    };

    fetchLeaderboard();
  }, []);

  const filteredLeaderboardData = selectedCategory
    ? leaderboardData.filter(entry => entry.category === selectedCategory)
    : leaderboardData;

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>
      <CategoryButtons selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-2 w-1/12">Rank</th>
              <th className="pb-2 w-3/12">User</th>
              <th className="pb-2 w-2/12">Score</th>
              <th className="pb-2 w-6/12">Subject</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboardData.map((entry, index) => (
              <tr key={entry.id} className={username === entry.username ? 'font-bold' : ''}>
                <td className="py-1">{index + 1}</td>
                <td className="py-1">{entry.username}</td>
                <td className="py-1">{entry.score}</td>
                <td className="py-1">
                  <span title={entry.subject} className="cursor-help">
                    {truncateSubject(entry.subject, 30)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompactLeaderboard;
