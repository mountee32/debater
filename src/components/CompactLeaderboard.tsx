import React, { useState, useMemo } from 'react';
import { Book, Globe, Atom, Lightbulb, CheckCircle, Circle, CircleDot } from 'lucide-react';
import leaderboardData from '../data/leaderboard.json';
import debateSubjects from '../data/debateSubjects.json';

interface CompactLeaderboardProps {
  username: string;
  isExpanded: boolean;
  onToggle: () => void;
}

interface EnrichedEntry {
  id: number;
  username: string;
  score: number;
  subject: string;
  category: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
}

const categoryIcons: { [key: string]: React.ElementType } = {
  Religion: Book,
  Politics: Globe,
  Science: Atom,
  Philosophy: Lightbulb,
};

const skillIcons: { [key: string]: React.ReactNode } = {
  'easy': <CheckCircle size={12} />,
  'medium': <Circle size={12} />,
  'hard': <CircleDot size={12} />
};

const skillColors: { [key: string]: string } = {
  'easy': 'bg-green-500 hover:bg-green-600',
  'medium': 'bg-yellow-500 hover:bg-yellow-600',
  'hard': 'bg-red-500 hover:bg-red-600'
};

const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({ username, isExpanded, onToggle }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<'easy' | 'medium' | 'hard'>('easy');

  const enrichedEntries = useMemo(() => {
    const subjectMap = new Map(
      debateSubjects.subjects.map(subject => [subject.id, subject])
    );

    return leaderboardData.entries
      .map(entry => {
        const subjectDetails = subjectMap.get(entry.subjectId);
        if (!subjectDetails) return null;

        return {
          id: entry.id,
          username: entry.username,
          score: entry.score,
          subject: subjectDetails.subject,
          category: subjectDetails.category,
          position: entry.position,
          skill: entry.skill
        };
      })
      .filter((entry): entry is EnrichedEntry => entry !== null);
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const filteredEntries = enrichedEntries
    .filter(entry => !selectedCategory || entry.category === selectedCategory)
    .filter(entry => entry.skill === selectedSkill);

  const sortedEntries = filteredEntries.sort((a, b) => b.score - a.score);
  const displayedEntries = isExpanded ? sortedEntries : sortedEntries.slice(0, 5);

  const skills: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

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
      
      <div className="space-y-2">
        <div className="flex flex-wrap justify-center gap-1">
          {Object.entries(categoryIcons).map(([category, Icon]) => (
            <button
              key={category}
              className={`flex items-center m-1 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              <Icon size={12} className="mr-1" />
              {category}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-1">
          {skills.map(skill => (
            <button
              key={skill}
              className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                selectedSkill === skill
                  ? `${skillColors[skill]} text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedSkill(skill)}
            >
              <span className="mr-1">{skillIcons[skill]}</span>
              <span className="capitalize">{skill}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 mt-4 ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <div className="flex text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
          <div className="w-16 text-center">Score</div>
          <div className="w-32 text-left">Name</div>
          <div className="flex-1 text-left">Subject</div>
          <div className="w-16 text-center">Position</div>
        </div>
        {displayedEntries.map((entry) => (
          <div key={entry.id} className={`flex py-2 text-xs ${username === entry.username ? 'font-bold bg-indigo-100 dark:bg-indigo-900' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}>
            <div className="w-16 text-center text-gray-800 dark:text-gray-200">{entry.score}</div>
            <div className="w-32 text-left text-gray-800 dark:text-gray-200 truncate" title={entry.username}>
              {truncateText(entry.username, 12)}
            </div>
            <div className="flex-1 text-gray-800 dark:text-gray-200 truncate text-left" title={entry.subject}>
              {entry.subject}
            </div>
            <div className="w-16 text-center">
              <span className={`px-2 py-1 rounded-full text-xs ${
                entry.position === 'for' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {entry.position}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactLeaderboard;
