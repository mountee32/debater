import React, { useState, useEffect } from 'react';

interface CompactLeaderboardProps {
  username: string;
  isExpanded: boolean;
  onToggle: () => void;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subject: string;
}

const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({ username, isExpanded, onToggle }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/src/data/leaderboard.json');
        const data = await response.json();
        setLeaderboardData(data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score));
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };

    fetchLeaderboard();
  }, []);

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  const displayedEntries = isExpanded ? leaderboardData : leaderboardData.slice(0, 5);

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
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <div className="grid grid-cols-10 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
          <div className="col-span-2">Score</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-5">Subject</div>
        </div>
        {displayedEntries.map((entry) => (
          <div key={entry.id} className={`grid grid-cols-10 gap-2 py-2 text-xs ${username === entry.username ? 'font-bold bg-indigo-100 dark:bg-indigo-900' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}>
            <div className="col-span-2 text-gray-800 dark:text-gray-200">{entry.score}</div>
            <div className="col-span-3 text-gray-800 dark:text-gray-200 truncate">{entry.username}</div>
            <div className="col-span-5 text-gray-800 dark:text-gray-200 truncate" title={entry.subject}>
              {truncateSubject(entry.subject, 30)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactLeaderboard;
