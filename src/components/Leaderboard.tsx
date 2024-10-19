import React, { useState, useEffect } from 'react';
import leaderboardData from '../data/leaderboard.json';

interface LeaderboardProps {
  username: string;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subject: string;
  stance: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ username }) => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = () => {
    const sortedEntries = (leaderboardData as LeaderboardEntry[]).sort((a, b) => b.score - a.score);
    setLeaderboardEntries(sortedEntries);
  };

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Global Leaderboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Score</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Subject</th>
              <th className="p-2 text-left">Stance</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardEntries.map((entry, index) => (
              <tr key={entry.id} className={username === entry.username ? 'bg-yellow-100' : ''}>
                <td className="p-2">{entry.score}</td>
                <td className="p-2">{entry.username}</td>
                <td className="p-2">
                  <span title={entry.subject} className="cursor-help">
                    {truncateSubject(entry.subject, 50)}
                  </span>
                </td>
                <td className="p-2 capitalize">{entry.stance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
