// Force TypeScript recompilation
import React, { useState, useEffect } from 'react';
import { Moon, Sun, User } from 'lucide-react';
import { DebateGame, CategorySelection, CompactLeaderboard, DifficultySlider } from './components';
import { generateTopic, endDebate, submitScore, getLeaderboard } from './api/openRouterApi';
import { log, clearLog } from './utils/logger';
import { AIPersonality, aiPersonalities } from './data/aiPersonalities';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'start' | 'select-personality' | 'playing' | 'end' | 'leaderboard';

function App() {
  const [topic, setTopic] = useState('');
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [rationale, setRationale] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [category, setCategory] = useState<string>('');
  const [username, setUsername] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      setIsDarkMode(storedDarkMode === 'true');
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleCategorySelect = async (selectedCategory: string) => {
    setCategory(selectedCategory);
    const newTopic = await generateTopic(selectedCategory, difficulty);
    setTopic(newTopic);
    setGameState('select-personality');
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  const handlePersonalitySelect = (personality: AIPersonality) => {
    setSelectedPersonality(personality);
    setGameState('playing');
  };

  const handleEndGame = async (result: { overallScore: number; rationale: string; recommendations: string }) => {
    setScore(result.overallScore);
    setRationale(result.rationale);
    setRecommendations(result.recommendations);
    
    const leaderboard = await getLeaderboard(difficulty, category);
    const highScore = leaderboard.length < 100 || result.overallScore > leaderboard[leaderboard.length - 1].score;

    setIsHighScore(highScore);
    setShowUsernamePrompt(highScore && !username);
    setGameState('end');
  };

  const handleUsernameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newUsername = formData.get('username') as string;
    if (newUsername) {
      setUsername(newUsername);
      localStorage.setItem('username', newUsername);
      if (isHighScore) {
        await submitScore(newUsername, score, difficulty, category);
      }
      setShowUsernamePrompt(false);
      setGameState('leaderboard');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  const toggleLeaderboard = () => {
    setIsLeaderboardExpanded(!isLeaderboardExpanded);
  };

  const AIPersonalitySelection = () => (
    <div className="text-gray-900 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Select AI Opponent</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiPersonalities.map((personality) => (
          <div
            key={personality.id}
            className="border rounded p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-start"
            onClick={() => handlePersonalitySelect(personality)}
          >
            <div className="w-16 h-16 rounded-full mr-4 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <img
                src={personality.avatarUrl}
                alt={`${personality.name} avatar`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <User className="w-8 h-8 text-gray-400 hidden" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{personality.name}</h3>
              <p className="mb-2">{personality.description}</p>
              <ul className="list-disc list-inside">
                <li>Argument Style: {personality.traits.argumentStyle}</li>
                <li>Vocabulary: {personality.traits.vocabulary}</li>
                <li>Example Types: {personality.traits.exampleTypes}</li>
                <li>Debate Strategy: {personality.traits.debateStrategy}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Debate Master</h1>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              {isDarkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
            </button>
          </header>

          {gameState === 'start' && (
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-3/4 pr-0 md:pr-8 mb-8 md:mb-0">
                <DifficultySlider difficulty={difficulty} onDifficultyChange={handleDifficultyChange} />
                <CategorySelection onSelect={handleCategorySelect} />
              </div>
              <div className="w-full md:w-1/4">
                <CompactLeaderboard
                  username={username}
                  isExpanded={isLeaderboardExpanded}
                  onToggle={toggleLeaderboard}
                />
              </div>
            </div>
          )}

          {gameState === 'select-personality' && (
            <AIPersonalitySelection />
          )}

          {gameState === 'playing' && selectedPersonality && (
            <DebateGame
              topic={topic}
              difficulty={difficulty}
              onEndGame={handleEndGame}
              aiPersonality={selectedPersonality}
            />
          )}

          {gameState === 'end' && (
            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-6">Game Over!</h2>
              <div className="mb-6">
                <p className="text-xl mb-2">Your debate score:</p>
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{score}/10</p>
              </div>
              <div className="mb-6 text-left">
                <h3 className="text-2xl font-semibold mb-2">Feedback:</h3>
                <p className="bg-white dark:bg-gray-800 p-4 rounded-lg">{rationale}</p>
              </div>
              <div className="mb-6 text-left">
                <h3 className="text-2xl font-semibold mb-2">Level Up Tips:</h3>
                <ul className="list-disc list-inside bg-white dark:bg-gray-800 p-4 rounded-lg">
                  {recommendations.split('\n').map((rec, index) => (
                    <li key={index} className="mb-2">{rec}</li>
                  ))}
                </ul>
              </div>
              {showUsernamePrompt && (
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold mb-2">New High Score!</h3>
                  <form onSubmit={handleUsernameSubmit} className="flex flex-col items-center">
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      className="border p-2 mb-2 rounded dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Submit Score</button>
                  </form>
                </div>
              )}
              <button
                onClick={() => setGameState('start')}
                className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700"
              >
                Play Again
              </button>
            </div>
          )}

          {gameState === 'leaderboard' && (
            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-6">Leaderboard</h2>
              <CompactLeaderboard
                username={username}
                isExpanded={true}
                onToggle={() => {}}
              />
              <button
                onClick={() => setGameState('start')}
                className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 mt-6"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
