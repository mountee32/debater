import React, { useState, useEffect } from 'react';
import { Moon, Sun, User, ArrowLeft, Book, Globe, Atom, LucideIcon, Lightbulb, HelpCircle, Feather, Zap, Dumbbell, ThumbsUp, ThumbsDown } from 'lucide-react';
import { DebateGame, Leaderboard } from './components';
import { generateTopic, submitScore, getLeaderboard } from './api/openRouterApi';
import { AIPersonality, aiPersonalities } from './data/aiPersonalities';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'select-category' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'end' | 'leaderboard' | 'select-pregenerated';
type Position = 'for' | 'against';

const steps = ['Category', 'Opponent', 'Difficulty', 'Position'];

const categories: { name: string; icon: LucideIcon }[] = [
  { name: 'Christianity', icon: Book },
  { name: 'Politics', icon: Globe },
  { name: 'Science', icon: Atom },
  { name: 'Philosophy', icon: Lightbulb },
  { name: 'Random', icon: HelpCircle },
];

const difficulties: { name: Difficulty; icon: LucideIcon; description: string; multiplier: number }[] = [
  { name: 'easy', icon: Feather, description: 'Casual debate with simple arguments', multiplier: 1.0 },
  { name: 'medium', icon: Zap, description: 'Balanced debate with moderate complexity', multiplier: 1.1 },
  { name: 'hard', icon: Dumbbell, description: 'Intense debate with advanced arguments', multiplier: 1.2 },
];

const positions: { name: Position; icon: LucideIcon; description: string }[] = [
  { name: 'for', icon: ThumbsUp, description: 'Argue in favor of the topic' },
  { name: 'against', icon: ThumbsDown, description: 'Argue against the topic' },
];

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
  const [pregeneratedQuestions, setPregeneratedQuestions] = useState<string[]>([]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      setIsDarkMode(storedDarkMode === 'true');
    }

    // Load pregenerated questions
    fetch('/src/data/debateQuestions.json')
      .then(response => response.json())
      .then(data => {
        console.log('Pregenerated questions loaded:', data.questions);
        setPregeneratedQuestions(data.questions);
      })
      .catch(error => console.error('Error loading pregenerated questions:', error));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleStartRandomGame = () => {
    console.log('Starting random game');
    setGameState('select-category');
  };

  const handleJoinExistingDiscussions = () => {
    console.log('Joining existing discussions');
    setGameState('select-pregenerated');
  };

  const handleCategorySelect = (selectedCategory: string) => {
    console.log('Selected category:', selectedCategory);
    setCategory(selectedCategory);
    setGameState('select-personality');
    // Pre-fetch the topic when the category is selected
    generateTopic(selectedCategory, difficulty).then((newTopic: string) => {
      console.log('Generated topic:', newTopic);
      setTopic(newTopic);
    });
  };

  const handlePersonalitySelect = (personality: AIPersonality) => {
    console.log('Selected personality:', personality.name);
    setSelectedPersonality(personality);
    setGameState('select-difficulty');
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    console.log('Selected difficulty:', newDifficulty);
    setDifficulty(newDifficulty);
    setGameState('select-position');
  };

  const handlePositionSelect = (position: Position) => {
    console.log('Selected position:', position);
    setUserPosition(position);
    setGameState('playing');
  };

  const handlePregeneratedQuestionSelect = (question: string) => {
    console.log('Selected pregenerated question:', question);
    setTopic(question);
    setGameState('select-personality');
  };

  const handleEndGame = async (result: { overallScore: number; rationale: string; recommendations: string }) => {
    console.log('Game ended. Score:', result.overallScore);
    const difficultyMultiplier = difficulties.find(d => d.name === difficulty)?.multiplier || 1.0;
    const adjustedScore = Math.round(result.overallScore * difficultyMultiplier);
    setScore(adjustedScore);
    setRationale(result.rationale);
    setRecommendations(result.recommendations);
    
    const leaderboard = await getLeaderboard(difficulty, category);
    const highScore = leaderboard.length < 100 || adjustedScore > leaderboard[leaderboard.length - 1].score;

    setIsHighScore(highScore);
    setShowUsernamePrompt(highScore && !username);
    setGameState('end');
  };

  const handleUsernameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newUsername = formData.get('username') as string;
    if (newUsername) {
      console.log('Submitting username:', newUsername);
      setUsername(newUsername);
      localStorage.setItem('username', newUsername);
      if (isHighScore) {
        await submitScore(newUsername, score, difficulty, category, topic);
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
    console.log('Going back from:', gameState);
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
        <div className="flex justify-between items-center mb-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`mt-2 ${index <= currentStep ? 'text-blue-500' : 'text-gray-500'}`}>{step}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-grow relative">
                  <div 
                    className={`absolute top-0 left-0 right-0 h-0.5 ${
                      index < currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  ></div>
                </div>
              )}
            </React.Fragment>
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

  const StepContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {children}
      </div>
    </div>
  );

  const HomeScreen = () => (
    <StepContainer>
      <h2 className="text-3xl font-semibold mb-6 text-center">Welcome to Debate Master</h2>
      
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-center">Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <Icon className="w-8 h-8 mb-2 text-blue-500" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={handleStartRandomGame}
          className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700"
        >
          Start Random Discussion
        </button>
        <button
          onClick={handleJoinExistingDiscussions}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          Join Existing Discussions
        </button>
      </div>
    </StepContainer>
  );

  const CategorySelection = () => (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select Discussion Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => handleCategorySelect(name)}
            className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
          >
            <Icon className="w-8 h-8 mb-2 text-blue-500" />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const AIPersonalitySelection = () => (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select AI Opponent</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiPersonalities.map((personality) => (
          <button
            key={personality.id}
            className="text-left bg-gray-100 dark:bg-gray-700 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
            onClick={() => handlePersonalitySelect(personality)}
          >
            <div className="flex items-start">
              <div className="w-16 h-16 rounded-full mr-4 overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <img
                  src={personality.avatarUrl}
                  alt={`${personality.name} avatar`}
                  className="w-full h-full object-cover"
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
                <p className="text-sm">{personality.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const DifficultySelection = () => (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select Difficulty</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {difficulties.map(({ name, icon: Icon, description }) => (
          <button
            key={name}
            onClick={() => handleDifficultyChange(name)}
            className={`flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 ${
              difficulty === name ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Icon className="w-8 h-8 mb-2 text-blue-500" />
            <span className="font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <p className="text-sm text-center mt-2">{description}</p>
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const PositionSelection = () => (
    <StepContainer>
      <h2 className="text-3xl font-bold mb-2 text-center">Topic:</h2>
      <p className="text-2xl mb-6 text-center font-semibold text-blue-600 dark:text-blue-400">{topic}</p>
      <h3 className="text-xl font-semibold mb-4 text-center">Select Your Position</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map(({ name, icon: Icon, description }) => (
          <button
            key={name}
            onClick={() => handlePositionSelect(name)}
            className={`flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 ${
              userPosition === name ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Icon className={`w-8 h-8 mb-2 ${name === 'for' ? 'text-green-500' : 'text-red-500'}`} />
            <span className="font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <p className="text-sm text-center mt-2">{description}</p>
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const PregeneratedQuestionSelection = () => (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select a Pregenerated Question</h2>
      <div className="space-y-4">
        {pregeneratedQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => handlePregeneratedQuestionSelect(question)}
            className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
          >
            {question}
          </button>
        ))}
      </div>
    </StepContainer>
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
          {gameState === 'select-difficulty' && <DifficultySelection />}
          {gameState === 'select-position' && <PositionSelection />}
          {gameState === 'select-pregenerated' && <PregeneratedQuestionSelection />}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  (Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}, 
                  Multiplier: x{difficulties.find(d => d.name === difficulty)?.multiplier.toFixed(1)})
                </p>
              </div>
              <div className="mb-6 text-left">
                <h3 className="text-2xl font-semibold mb-2">Feedback:</h3>
                <p className="bg-white dark:bg-gray-800 p-4 rounded-lg">{rationale}</p>
              </div>
              <div className="mb-6 text-left">
                <h3 className="text-2xl font-semibold mb-2">Level Up Tips:</h3>
                <ul className="list-disc list-inside bg-white dark:bg-gray-800 p-4 rounded-lg">
                  {recommendations.split('\n').map((rec: string, index: number) => (
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
              <Leaderboard username={username} />
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
