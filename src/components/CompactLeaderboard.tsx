import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
}

const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({ username, isExpanded, onToggle }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const data = await getLeaderboard();
      setLeaderboardData(data.slice(0, 10)); // Get top 10 entries
    };

    fetchLeaderboard();
  }, []);

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
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-2">Rank</th>
              <th className="pb-2">User</th>
              <th className="pb-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr key={entry.id} className={username === entry.username ? 'font-bold' : ''}>
                <td className="py-1">{index + 1}</td>
                <td className="py-1">{entry.username}</td>
                <td className="py-1">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompactLeaderboard;
