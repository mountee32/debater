import React, { useState, useEffect } from 'react';
import { Book, Globe, Atom, Lightbulb } from 'lucide-react';
import leaderboardData from '../data/leaderboard.json';

interface LeaderboardProps {
  username: string;
  onStartDebate: (subject: string) => void;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subject: string;
  category: string;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
  'Science': <Atom size={24} />,
  'Politics': <Globe size={24} />,
  'Religion': <Book size={24} />,
  'Philosophy': <Lightbulb size={24} />,
};

const Leaderboard: React.FC<LeaderboardProps> = ({ username, onStartDebate }) => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Politics');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = () => {
    const sortedEntries = (leaderboardData as LeaderboardEntry[])
      .filter(entry => entry.category !== 'Random')
      .sort((a, b) => b.score - a.score);
    setLeaderboardEntries(sortedEntries);
  };

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  const handleEntryClick = (entry: LeaderboardEntry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
  };

  const handleStartDebate = () => {
    if (selectedEntry) {
      onStartDebate(selectedEntry.subject);
    }
    setShowPopup(false);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredEntries = leaderboardEntries.filter(entry => entry.category === selectedCategory);

  const categories = [...new Set(leaderboardEntries.map(entry => entry.category))];

  return (
    <div className="mt-8 relative">
      <h2 className="text-2xl font-bold mb-4">Global Leaderboard</h2>
      <div className="flex flex-wrap justify-start mb-4">
        {categories.map(category => (
          <button
            key={category}
            className={`mr-2 mb-2 p-2 rounded flex flex-col items-center justify-center ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800'
            } shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
            onClick={() => handleCategoryFilter(category)}
          >
            {categoryIcons[category]}
            <span className="mt-1 text-sm">{category}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Score</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Subject</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, index) => (
              <tr
                key={entry.id}
                className={`${username === entry.username ? 'bg-yellow-100' : ''} hover:bg-gray-100 cursor-pointer`}
                onClick={() => handleEntryClick(entry)}
              >
                <td className="p-2">{entry.score}</td>
                <td className="p-2 text-left">{entry.username}</td>
                <td className="p-2 text-left">
                  <span title={entry.subject} className="cursor-help">
                    {truncateSubject(entry.subject, 50)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPopup && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Want to debate this topic?</h3>
            <p className="mb-4">Subject: {selectedEntry.subject}</p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 rounded mr-2"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleStartDebate}
              >
                Start Debate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
