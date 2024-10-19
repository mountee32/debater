import React, { useState, useEffect } from 'react';
import { Book, Globe, Atom, Lightbulb, Shuffle, Cpu } from 'lucide-react';
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
  avatar: string;
}

const mockLeaderboardData: LeaderboardEntry[] = [
  { id: 1, username: "debateChamp", score: 95, difficulty: "hard", category: "Politics", subject: "Should voting be mandatory?", avatar: "/assets/user_afro_male.svg" },
  { id: 2, username: "logicMaster", score: 92, difficulty: "hard", category: "Ethics", subject: "Is euthanasia morally justifiable?", avatar: "/assets/woman1.svg" },
  { id: 3, username: "persuader101", score: 88, difficulty: "medium", category: "Science", subject: "Are GMOs beneficial for society?", avatar: "/assets/man2.svg" },
  { id: 4, username: "rationalThinker", score: 85, difficulty: "medium", category: "Philosophy", subject: "Does free will exist?", avatar: "/assets/woman_young.svg" },
  { id: 5, username: "debateNewbie", score: 75, difficulty: "easy", category: "Technology", subject: "Is social media overall good for society?", avatar: "/assets/boy_young.svg" },
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
    <div className="flex flex-wrap justify-center mb-6">
      {Object.entries(categoryIcons).map(([category, Icon]) => (
        <button
          key={category}
          className={`flex items-center m-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
            selectedCategory === category
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800'
          }`}
          onClick={() => onCategorySelect(selectedCategory === category ? null : category)}
        >
          <Icon size={20} className="mr-2" />
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Leaderboard</h2>
      </div>
      <CategoryButtons selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="pb-3 w-1/12 font-semibold">Rank</th>
              <th className="pb-3 w-4/12 font-semibold">User</th>
              <th className="pb-3 w-2/12 font-semibold">Score</th>
              <th className="pb-3 w-5/12 font-semibold">Subject</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboardData.map((entry, index) => (
              <tr key={entry.id} className={`${username === entry.username ? 'font-bold bg-indigo-100 dark:bg-indigo-900' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}>
                <td className="py-3 text-gray-800 dark:text-gray-200">{index + 1}</td>
                <td className="py-3 text-gray-800 dark:text-gray-200">
                  <div className="flex items-center">
                    <img src={entry.avatar} alt={entry.username} className="w-8 h-8 rounded-full mr-3" />
                    {entry.username}
                  </div>
                </td>
                <td className="py-3 text-gray-800 dark:text-gray-200">{entry.score}</td>
                <td className="py-3 text-gray-600 dark:text-gray-300">
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
