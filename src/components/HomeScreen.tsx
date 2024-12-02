import React, { useState, useMemo, useCallback } from 'react';
import { MessageSquare, CheckCircle, Circle, CircleDot } from 'lucide-react';
import leaderboardData from '../data/leaderboard.json';
import debateSubjects from '../data/debateSubjects.json';

interface HomeScreenProps {
  username: string;
  onStartDebate: (subject: string, subjectId: string) => void;
  handleStartChat: () => void;
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

type CategoryType = 'Religion' | 'Politics' | 'Science' | 'Philosophy';
type SkillType = 'easy' | 'medium' | 'hard';

const CATEGORIES: CategoryType[] = ['Religion', 'Politics', 'Science', 'Philosophy'];
const SKILLS: SkillType[] = ['easy', 'medium', 'hard'];

const skillIcons: { [key in SkillType]: React.ReactNode } = {
  'easy': <CheckCircle size={20} />,
  'medium': <Circle size={20} />,
  'hard': <CircleDot size={20} />
};

const skillColors: { [key in SkillType]: string } = {
  'easy': 'from-green-500 to-green-600',
  'medium': 'from-yellow-500 to-yellow-600',
  'hard': 'from-red-500 to-red-600'
};

const getCategoryIcon = (category: CategoryType): string => {
  switch (category) {
    case 'Religion': return '📖';
    case 'Politics': return '🏛️';
    case 'Science': return '🔬';
    case 'Philosophy': return '🤔';
    default: return '🌟';
  }
};

const getPositionIcon = (position: 'for' | 'against'): string => {
  return position === 'for' ? '👍' : '👎';
};

const abbreviateUsername = (username: string): string => {
  return username.length > 8 ? `${username.slice(0, 8)}..` : username;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ username, onStartDebate, handleStartChat }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Religion');
  const [selectedSkill, setSelectedSkill] = useState<SkillType>('easy');

  const { subjectsByCategory, entriesBySubject } = useMemo(() => {
    // Group subjects by category
    const subjectsByCategory: Record<CategoryType, DebateSubject[]> = {
      Religion: [],
      Politics: [],
      Science: [],
      Philosophy: []
    };

    // Create a map for quick subject lookup
    const subjectMap = new Map<string, DebateSubject>();
    
    // First, organize all subjects by category
    debateSubjects.subjects.forEach(subject => {
      if (CATEGORIES.includes(subject.category as CategoryType)) {
        subjectsByCategory[subject.category as CategoryType].push(subject);
        subjectMap.set(subject.id, subject);
      }
    });

    // Then, organize entries by subject and filter by skill
    const entriesBySubject = new Map<string, LeaderboardEntry[]>();
    
    // Group all entries by subject first
    (leaderboardData.entries as LeaderboardEntry[])
      .filter(entry => entry.skill === selectedSkill)
      .forEach(entry => {
        const subject = subjectMap.get(entry.subjectId);
        if (subject) {
          const entries = entriesBySubject.get(subject.subject) || [];
          entries.push(entry);
          entries.sort((a, b) => b.score - a.score);
          entriesBySubject.set(subject.subject, entries.slice(0, 5));
        }
      });

    return { subjectsByCategory, entriesBySubject };
  }, [selectedSkill]);

  const handleCategorySelect = useCallback((category: CategoryType) => {
    setSelectedCategory(category);
  }, []);

  const handleSkillSelect = useCallback((skill: SkillType) => {
    setSelectedSkill(skill);
  }, []);

  const handleSubjectClick = useCallback((subject: DebateSubject) => {
    onStartDebate(subject.subject, subject.id);
  }, [onStartDebate]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-12 mt-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          SpeakUp!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Unleash Your Voice, Hone Your Skills
        </p>
      </div>

      <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all duration-300 
                    transform hover:-translate-y-0.5 font-semibold text-lg group
                    ${selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700/80 shadow hover:shadow-md'}`}
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

            <div className="flex justify-center gap-3">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleSkillSelect(skill)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 
                    transform hover:-translate-y-0.5 font-medium text-sm
                    ${selectedSkill === skill
                      ? `bg-gradient-to-r ${skillColors[skill]} text-white shadow-lg`
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/80 shadow hover:shadow-md'}`}
                >
                  <span className="transform transition-all duration-300">
                    {skillIcons[skill]}
                  </span>
                  <span className="capitalize">{skill}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div key={`${selectedCategory}-${selectedSkill}`} className="p-8">
          <div>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-gray-800 dark:text-gray-100">
              <span className="text-5xl transform transition-transform duration-300 hover:scale-110 inline-block">
                {getCategoryIcon(selectedCategory)}
              </span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {selectedCategory}
              </span>
            </h2>

            <div className="space-y-8">
              {subjectsByCategory[selectedCategory].map((subject) => {
                const entries = entriesBySubject.get(subject.subject) || [];
                
                return (
                  <div key={subject.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                    <button
                      onClick={() => handleSubjectClick(subject)}
                      className="w-full text-left group mb-4"
                      aria-label={`Start debate about ${subject.subject}`}
                    >
                      <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {subject.subject}
                      </h3>
                    </button>
                    <div className="flex flex-wrap gap-4">
                      {entries.length > 0 ? (
                        entries.map((player) => (
                          <div
                            key={player.id}
                            onClick={() => handleSubjectClick(subject)}
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
                        ))
                      ) : (
                        <button
                          onClick={() => handleSubjectClick(subject)}
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
