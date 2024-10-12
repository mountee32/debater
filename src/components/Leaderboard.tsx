import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/openRouterApi';

interface LeaderboardProps {
  username: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ username }) => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchLeaderboard();
  }, [difficulty, category]);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard(difficulty, category);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Global Leaderboard</h2>
      <div className="mb-4">
        <select
          className="mr-2 p-2 border rounded"
          value={difficulty || ''}
          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | undefined)}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          className="p-2 border rounded"
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
        >
          <option value="">All Categories</option>
          <option value="Christianity">Christianity</option>
          <option value="Ethics">Ethics</option>
          <option value="Politics">Politics</option>
          <option value="Random">Random</option>
        </select>
      </div>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Rank</th>
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Score</th>
            <th className="p-2 border">Difficulty</th>
            <th className="p-2 border">Category</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={entry.id} className={username === entry.username ? 'bg-yellow-100' : ''}>
              <td className="p-2 border">{index + 1}</td>
              <td className="p-2 border">{entry.username}</td>
              <td className="p-2 border">{entry.score}</td>
              <td className="p-2 border">{entry.difficulty}</td>
              <td className="p-2 border">{entry.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
