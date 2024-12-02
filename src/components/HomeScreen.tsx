import React from 'react';
import { MessageSquare } from 'lucide-react';
import Leaderboard from './Leaderboard';
import { useGameContext } from '../hooks/useGameContext';

interface HomeScreenProps {
  username: string;
  onStartDebate: (subject: string, subjectId: string) => void;
  handleStartChat: () => void;
}

interface EnrichedLeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subjectId: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
  subject: string;
  category: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ username, onStartDebate, handleStartChat }) => {
  const { handleWatchReplay } = useGameContext();

  const handleStartDebateFromEntry = (entry: EnrichedLeaderboardEntry) => {
    onStartDebate(entry.subject, entry.subjectId);
  };

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

      <Leaderboard 
        username={username} 
        onStartDebate={handleStartDebateFromEntry}
        onWatchReplay={handleWatchReplay}
      />

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
