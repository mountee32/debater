import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/openRouterApi';

interface LeaderboardProps {
  username: string;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  difficulty: string;
  category: string;
  subject: string;
}

const mockLeaderboardData: LeaderboardEntry[] = [
  { id: 1, username: "debateChamp", score: 95, difficulty: "hard", category: "Politics", subject: "Should voting be mandatory?" },
  { id: 2, username: "logicMaster", score: 92, difficulty: "hard", category: "Ethics", subject: "Is euthanasia morally justifiable?" },
  { id: 3, username: "persuader101", score: 88, difficulty: "medium", category: "Science", subject: "Are GMOs beneficial for society?" },
  { id: 4, username: "rationalThinker", score: 85, difficulty: "medium", category: "Philosophy", subject: "Does free will exist?" },
  { id: 5, username: "debateNewbie", score: 75, difficulty: "easy", category: "Technology", subject: "Is social media overall good for society?" },
  { id: 6, username: "policyWonk", score: 89, difficulty: "hard", category: "Politics", subject: "Should there be term limits for elected officials?" },
  { id: 7, username: "techGuru", score: 82, difficulty: "medium", category: "Technology", subject: "Is artificial intelligence a threat to humanity?" },
];

const Leaderboard: React.FC<LeaderboardProps> = ({ username }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(mockLeaderboardData);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [difficulty]);

  const fetchLeaderboard = async () => {
    try {
      // Commented out the API call and using mock data instead
      // const data = await getLeaderboard(difficulty);
      // setLeaderboardData(data);
      
      // Filter mock data based on difficulty
      let filteredData = mockLeaderboardData;
      if (difficulty) {
        filteredData = filteredData.filter(entry => entry.difficulty === difficulty);
      }
      setLeaderboardData(filteredData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  const groupedData = leaderboardData.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, LeaderboardEntry[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
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
      </div>
      <div className="space-y-4">
        {Object.entries(groupedData).map(([category, entries]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              className="w-full p-4 text-left font-semibold bg-gray-100 hover:bg-gray-200 focus:outline-none"
              onClick={() => toggleCategory(category)}
            >
              {category} ({entries.length})
            </button>
            <div
              className={`transition-all duration-300 ease-in-out ${
                expandedCategory === category ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Username</th>
                    <th className="p-2 text-left">Score</th>
                    <th className="p-2 text-left">Difficulty</th>
                    <th className="p-2 text-left">Debate Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className={username === entry.username ? 'bg-yellow-100' : ''}>
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{entry.username}</td>
                      <td className="p-2">{entry.score}</td>
                      <td className="p-2">{entry.difficulty}</td>
                      <td className="p-2">
                        <span title={entry.subject} className="cursor-help">
                          {truncateSubject(entry.subject, 50)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
