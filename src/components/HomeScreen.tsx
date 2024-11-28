import React, { useState, useMemo, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import leaderboardData from '../data/leaderboard.json';
import preCreatedSubjects from '../data/preCreatedSubjects.json';

interface HomeScreenProps {
  username: string;
  onStartDebate: (subject: string) => void;
  handleStartChat: () => void;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subject: string;
  category: string;
  position: 'for' | 'against';
}

type SubjectCategories = {
  Religion: string[];
  Politics: string[];
  Science: string[];
  Philosophy: string[];
};

type CategoryType = keyof SubjectCategories;

const CATEGORIES: CategoryType[] = ['Religion', 'Politics', 'Science', 'Philosophy'];

const getCategoryIcon = (category: CategoryType): string => {
  switch (category) {
    case 'Religion': return '📖';
    case 'Politics': return '🏛️';
    case 'Science': return '🔬';
    case 'Philosophy': return '🤔';
    default: return '🌟';
  }
};

// Helper function to get position icon
const getPositionIcon = (position: 'for' | 'against'): string => {
  return position === 'for' ? '👍' : '👎';
};

// Helper function to abbreviate username
const abbreviateUsername = (username: string): string => {
  return username.length > 8 ? `${username.slice(0, 8)}..` : username;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ username, onStartDebate, handleStartChat }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Religion');

  // Group entries by category and subject
  const groupedEntries = useMemo(() => {
    const entries: Record<CategoryType, Record<string, LeaderboardEntry[]>> = {
      Religion: {},
      Politics: {},
      Science: {},
      Philosophy: {}
    };

    // Filter out entries that don't belong to our main categories
    const validEntries = leaderboardData.filter(entry => 
      CATEGORIES.includes(entry.category as CategoryType)
    );

    validEntries.forEach(entry => {
      const category = entry.category as CategoryType;
      if (!entries[category][entry.subject]) {
        entries[category][entry.subject] = [];
      }
      entries[category][entry.subject].push(entry as LeaderboardEntry);
    });

    // Sort entries and limit to top 5 for each subject
    Object.keys(entries).forEach(category => {
      Object.keys(entries[category as CategoryType]).forEach(subject => {
        entries[category as CategoryType][subject].sort((a, b) => b.score - a.score);
        entries[category as CategoryType][subject] = 
          entries[category as CategoryType][subject].slice(0, 5);
      });
    });

    return entries;
  }, []);

  const handleCategorySelect = useCallback((category: CategoryType) => {
    setSelectedCategory(category);
  }, []);

  // Get categories to display based on selection
  const categoriesToDisplay = useMemo(() => {
    return [selectedCategory];
  }, [selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Category Filter Buttons */}
      <div className="mb-10 flex flex-wrap justify-center gap-4">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategorySelect(category)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all duration-300 
              transform hover:-translate-y-0.5 font-semibold text-lg group
              ${selectedCategory === category
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700/80 shadow hover:shadow-md'}`}
          >
            <span className={`text-3xl transform transition-all duration-300 ${
              selectedCategory === category ? 'scale-110' : 'group-hover:scale-110'
            }`}>
              {getCategoryIcon(category)}
            </span>
            <span className={`transition-all duration-300 ${
              selectedCategory === category
                ? 'text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
            }`}>
              {category}
            </span>
          </button>
        ))}
      </div>

      {/* Debate Categories */}
      <div key={selectedCategory} className="space-y-10">
        {categoriesToDisplay.map((category) => {
          const subjects = groupedEntries[category];
          if (!subjects || Object.keys(subjects).length === 0) return null;

          return (
            <div key={category} className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-8 shadow-lg backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-gray-800 dark:text-gray-100">
                <span className="text-5xl transform transition-transform duration-300 hover:scale-110 inline-block">
                  {getCategoryIcon(category)}
                </span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {category}
                </span>
              </h2>

              <div className="space-y-8">
                {Object.entries(subjects).map(([subject, players]) => (
                  <div key={subject} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                    <h3 className="font-semibold mb-4 text-lg text-gray-700 dark:text-gray-300">
                      {subject}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          onClick={() => onStartDebate(player.subject)}
                          className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 
                            rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all duration-300 
                            transform hover:-translate-y-0.5 cursor-pointer select-none group
                            border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                          role="button"
                          tabIndex={0}
                        >
                          <span className="mr-2.5 text-xl group-hover:scale-110 transition-transform duration-300">
                            {getPositionIcon(player.position)}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {abbreviateUsername(player.username)}
                          </span>
                          <div className="ml-3 px-2.5 py-1 bg-white/80 dark:bg-gray-900/50 rounded-full 
                            transform transition-all duration-300 group-hover:scale-105 group-hover:bg-white dark:group-hover:bg-gray-900
                            border border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800">
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {player.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8 mb-12">
        <button
          onClick={handleStartChat}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl 
            shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 
            flex items-center justify-center group relative overflow-hidden"
          title="Start a new debate chat"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="font-semibold text-lg relative z-10">Start New Debate</span>
          <MessageSquare size={24} className="ml-3 relative z-10 group-hover:scale-110 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;