import React, { useState, useEffect } from 'react';
import leaderboardData from '../data/leaderboard.json';

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

const Leaderboard: React.FC<LeaderboardProps> = ({ username }) => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = () => {
    setLeaderboardEntries(leaderboardData as LeaderboardEntry[]);
  };

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  const groupedData = leaderboardEntries.reduce((acc, entry) => {
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
