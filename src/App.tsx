// Force TypeScript recompilation
import React, { useState, useEffect } from 'react';
import { Moon, Sun, User, ArrowLeft } from 'lucide-react';
import { DebateGame, CompactLeaderboard, DifficultySlider } from './components';
import { generateTopic, endDebate, submitScore, getLeaderboard } from './api/openRouterApi';
import { log, clearLog } from './utils/logger';
import { AIPersonality, aiPersonalities } from './data/aiPersonalities';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'select-category' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'end' | 'leaderboard';
type Position = 'for' | 'against';

const steps = ['Category', 'Opponent', 'Difficulty', 'Position'];

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<string>('');
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [userPosition, setUserPosition] = useState<Position>('for');
  const [score, setScore] = useState(0);
  const [rationale, setRationale] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [username, setUsername] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const handleStartGame = () => {
    setGameState('select-category');
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setGameState('select-personality');
  };

  const handlePersonalitySelect = (personality: AIPersonality) => {
    setSelectedPersonality(personality);
    setGameState('select-difficulty');
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    generateTopic(category, newDifficulty).then((newTopic) => {
      setTopic(newTopic);
      setGameState('select-position');
    });
  };

  const handlePositionSelect = (position: Position) => {
    setUserPosition(position);
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

  const getCurrentStep = () => {
    switch (gameState) {
      case 'select-category': return 0;
      case 'select-personality': return 1;
      case 'select-difficulty': return 2;
      case 'select-position': return 3;
      default: return -1;
    }
  };

  const goBack = () => {
    switch (gameState) {
      case 'select-personality': setGameState('select-category'); break;
      case 'select-difficulty': setGameState('select-personality'); break;
      case 'select-position': setGameState('select-difficulty'); break;
      default: setGameState('home');
    }
  };

  const WizardSteps = () => {
    const currentStep = getCurrentStep();
    if (currentStep === -1) return null;

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div key={step} className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {index + 1}
              </div>
              <span className="mt-2">{step}</span>
            </div>
          ))}
        </div>
        {currentStep > 0 && (
          <button onClick={goBack} className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
        )}
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="text-center">
      <h2 className="text-3xl font-semibold mb-6">Welcome to Debate Master</h2>
      <CompactLeaderboard username={username} isExpanded={true} onToggle={() => {}} />
      <button
        onClick={handleStartGame}
        className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 mt-6"
      >
        Start Discussion Game
      </button>
    </div>
  );

  const CategorySelection = () => (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Select Discussion Category</h2>
      <div className="flex overflow-x-auto pb-4">
        {['Christianity', 'Politics', 'Science', 'Philosophy', 'Random'].map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );

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
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PositionSelection = () => (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Select Your Position</h2>
      <p className="mb-4">Topic: {topic}</p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => handlePositionSelect('for')}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
        >
          For
        </button>
        <button
          onClick={() => handlePositionSelect('against')}
          className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600"
        >
          Against
        </button>
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

          <WizardSteps />

          {gameState === 'home' && <HomeScreen />}
          {gameState === 'select-category' && <CategorySelection />}
          {gameState === 'select-personality' && <AIPersonalitySelection />}
          {gameState === 'select-difficulty' && (
            <DifficultySlider difficulty={difficulty} onDifficultyChange={handleDifficultyChange} />
          )}
          {gameState === 'select-position' && <PositionSelection />}
          {gameState === 'playing' && selectedPersonality && (
            <DebateGame
              topic={topic}
              difficulty={difficulty}
              onEndGame={handleEndGame}
              aiPersonality={selectedPersonality}
              userPosition={userPosition}
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
                onClick={() => setGameState('home')}
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
                onClick={() => setGameState('home')}
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
