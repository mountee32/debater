import React, { useState, useEffect } from 'react';
import { Book, Globe, Atom, Lightbulb, Trophy, Medal, CheckCircle, Circle, CircleDot } from 'lucide-react';
import leaderboardData from '../data/leaderboard.json';
import debateSubjects from '../data/debateSubjects.json';

interface LeaderboardProps {
  username: string;
  onStartDebate: (subject: string) => void;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subjectId: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
}

interface DebateSubject {
  id: string;
  category: string;
  subject: string;
  access: string;
}

interface EnrichedLeaderboardEntry extends LeaderboardEntry {
  subject: string;
  category: string;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
  'Science': <Atom size={24} className="text-blue-500" />,
  'Politics': <Globe size={24} className="text-green-500" />,
  'Religion': <Book size={24} className="text-purple-500" />,
  'Philosophy': <Lightbulb size={24} className="text-yellow-500" />,
};

const skillIcons: { [key: string]: React.ReactNode } = {
  'easy': <CheckCircle size={20} />,
  'medium': <Circle size={20} />,
  'hard': <CircleDot size={20} />
};

const skillColors: { [key: string]: string } = {
  'easy': 'from-green-500 to-green-600',
  'medium': 'from-yellow-500 to-yellow-600',
  'hard': 'from-red-500 to-red-600'
};

const Leaderboard: React.FC<LeaderboardProps> = ({ username, onStartDebate }) => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<EnrichedLeaderboardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<EnrichedLeaderboardEntry | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Politics');
  const [selectedSkill, setSelectedSkill] = useState<'easy' | 'medium' | 'hard'>('easy');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = () => {
    const subjectMap = new Map(
      debateSubjects.subjects.map(subject => [subject.id, subject])
    );

    const enrichedEntries = leaderboardData.entries
      .map(entry => {
        const subjectDetails = subjectMap.get(entry.subjectId);
        if (!subjectDetails) return null;

        return {
          ...entry,
          subject: subjectDetails.subject,
          category: subjectDetails.category
        };
      })
      .filter((entry): entry is EnrichedLeaderboardEntry => entry !== null)
      .sort((a, b) => b.score - a.score);

    setLeaderboardEntries(enrichedEntries);
  };

  const truncateSubject = (subject: string, maxLength: number) => {
    if (subject.length <= maxLength) return subject;
    return `${subject.substring(0, maxLength)}...`;
  };

  const handleEntryClick = (entry: EnrichedLeaderboardEntry) => {
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

  const handleSkillFilter = (skill: 'easy' | 'medium' | 'hard') => {
    setSelectedSkill(skill);
  };

  const filteredEntries = leaderboardEntries.filter(entry => 
    entry.category === selectedCategory && entry.skill === selectedSkill
  );

  const categories = [...new Set(leaderboardEntries.map(entry => entry.category))];
  const skills: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy data-testid="trophy-icon" className="text-yellow-500 w-5 h-5" />;
      case 1:
        return <Medal data-testid="silver-medal-icon" className="text-gray-400 w-5 h-5" />;
      case 2:
        return <Medal data-testid="bronze-medal-icon" className="text-amber-600 w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-8 relative flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Global Leaderboard</h2>
          <p className="text-indigo-100 text-center text-sm">Compete with the best debaters worldwide</p>
        </div>

        <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(category => (
              <button
                key={category}
                className={`
                  px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 transform hover:scale-105
                  ${selectedCategory === category
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-md'
                  }
                `}
                onClick={() => handleCategoryFilter(category)}
              >
                {categoryIcons[category]}
                <span className="font-medium">{category}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            {skills.map(skill => (
              <button
                key={skill}
                className={`
                  px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 transform hover:scale-105
                  ${selectedSkill === skill
                    ? `bg-gradient-to-r ${skillColors[skill]} text-white shadow-lg`
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-md'
                  }
                `}
                onClick={() => handleSkillFilter(skill)}
              >
                {skillIcons[skill]}
                <span className="font-medium capitalize">{skill}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-200">Rank</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-200">Score</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-200">Name</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-200">Subject</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-200">Position</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`
                    border-b border-gray-100 dark:border-gray-700 transition-colors duration-200
                    ${username === entry.username ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                    cursor-pointer
                  `}
                  onClick={() => handleEntryClick(entry)}
                >
                  <td className="p-4 flex items-center gap-2">
                    {getRankIcon(index)}
                    <span className="text-gray-600 dark:text-gray-300">{index + 1}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{entry.score}</span>
                  </td>
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-200">{entry.username}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <span title={entry.subject} className="cursor-help">
                      {truncateSubject(entry.subject, 50)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      entry.position === 'for' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {entry.position}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && selectedEntry && (
        <div 
          role="dialog" 
          aria-labelledby="dialog-title"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h3 id="dialog-title" className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Ready to Debate?</h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">{selectedEntry.subject}</p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={handleStartDebate}
                >
                  Start Debate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
