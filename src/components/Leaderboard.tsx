import React, { useState, useEffect } from 'react';
import { Book, Globe, Atom, Lightbulb, Trophy, Medal, CheckCircle, Circle, CircleDot, Eye, Play, AlertCircle } from 'lucide-react';
import leaderboardData from '../data/leaderboard.json';
import debateSubjects from '../data/debateSubjects.json';

interface LeaderboardProps {
  username: string;
  onStartDebate: (entry: EnrichedLeaderboardEntry) => void;
  onWatchReplay: (entry: EnrichedLeaderboardEntry) => void;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subjectId: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
  conversationId?: string;
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

const Leaderboard: React.FC<LeaderboardProps> = ({ username, onStartDebate, onWatchReplay }) => {
  const [selectedEntry, setSelectedEntry] = useState<EnrichedLeaderboardEntry | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Religion');
  const [selectedSkill, setSelectedSkill] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Group subjects by category
  const subjectsByCategory = React.useMemo(() => {
    const grouped: Record<string, DebateSubject[]> = {};
    debateSubjects.subjects.forEach(subject => {
      if (!grouped[subject.category]) {
        grouped[subject.category] = [];
      }
      grouped[subject.category].push(subject);
    });
    return grouped;
  }, []);

  // Get high scores for a subject
  const getHighScores = (subjectId: string, skill: 'easy' | 'medium' | 'hard'): EnrichedLeaderboardEntry[] => {
    const subject = debateSubjects.subjects.find(s => s.id === subjectId);
    if (!subject) return [];

    const entries = (leaderboardData.entries as LeaderboardEntry[])
      .filter(entry => entry.subjectId === subjectId && entry.skill === skill)
      .map(entry => ({
        ...entry,
        subject: subject.subject,
        category: subject.category
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return entries;
  };

  const handleEntryClick = (entry: EnrichedLeaderboardEntry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
  };

  const handleStartDebate = () => {
    if (selectedEntry) {
      onStartDebate(selectedEntry);
    }
    setShowPopup(false);
  };

  const handleWatchReplay = () => {
    if (selectedEntry && selectedEntry.conversationId) {
      onWatchReplay(selectedEntry);
    }
    setShowPopup(false);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSkillFilter = (skill: 'easy' | 'medium' | 'hard') => {
    setSelectedSkill(skill);
  };

  const categories = Object.keys(subjectsByCategory);

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
            {['easy', 'medium', 'hard'].map(skill => (
              <button
                key={skill}
                className={`
                  px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 transform hover:scale-105
                  ${selectedSkill === skill
                    ? `bg-gradient-to-r ${skillColors[skill]} text-white shadow-lg`
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-md'
                  }
                `}
                onClick={() => handleSkillFilter(skill as 'easy' | 'medium' | 'hard')}
              >
                {skillIcons[skill]}
                <span className="font-medium capitalize">{skill}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-8">
            {subjectsByCategory[selectedCategory]?.map(subject => {
              const highScores = getHighScores(subject.id, selectedSkill);
              
              return (
                <div key={subject.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                  <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-4">
                    {subject.subject}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {highScores.length > 0 ? (
                      highScores.map((entry, index) => (
                        <div
                          key={entry.id}
                          onClick={() => handleEntryClick(entry)}
                          className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 
                            rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all duration-300 
                            transform hover:-translate-y-0.5 cursor-pointer select-none group
                            border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                          role="button"
                          tabIndex={0}
                        >
                          {index === 0 && (
                            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                          )}
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {entry.username}
                          </span>
                          <div className="ml-3 px-2.5 py-1 bg-white/80 dark:bg-gray-900/50 rounded-full">
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {entry.score}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <button
                        onClick={() => onStartDebate({
                          id: 0,
                          username: '',
                          score: 0,
                          subjectId: subject.id,
                          position: 'for',
                          skill: selectedSkill,
                          subject: subject.subject,
                          category: subject.category
                        })}
                        className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/30 
                          rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all duration-300 
                          transform hover:-translate-y-0.5 cursor-pointer select-none group
                          border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                      >
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Be the first to debate this topic!
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
              <h3 id="dialog-title" className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                High Score Entry
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">{selectedEntry.subject}</p>
              <div className="flex flex-col gap-3">
                <button
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${
                    selectedEntry.conversationId
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } transition-all duration-200`}
                  onClick={handleWatchReplay}
                  disabled={!selectedEntry.conversationId}
                >
                  {selectedEntry.conversationId ? (
                    <>
                      <Eye size={20} />
                      Watch Replay
                    </>
                  ) : (
                    <>
                      <AlertCircle size={20} />
                      Replay Not Available
                    </>
                  )}
                </button>
                <button
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleStartDebate}
                >
                  <Play size={20} />
                  Play Subject
                </button>
                <button
                  className="w-full px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
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
