import React from 'react';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { DebateGame, Leaderboard } from './components';
import { GameProvider, useGameContext } from './GameContext';
import { CategorySelection, AIPersonalitySelection, DifficultySelection, PositionSelection, PregeneratedQuestionSelection } from './GameSetup';

const steps = ['Category', 'Opponent', 'Difficulty', 'Position'];

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

function AppContent() {
  const {
    gameState,
    setGameState,
    topic,
    difficulty,
    selectedPersonality,
    userPosition,
    score,
    rationale,
    recommendations,
    username,
    showUsernamePrompt,
    isDarkMode,
    handleStartRandomGame,
    handleJoinExistingDiscussions,
    handleEndGame,
    handleUsernameSubmit,
    toggleDarkMode,
  } = useGameContext();

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

  const HomeScreen = () => (
    <div className="text-center">
      <h2 className="text-3xl font-semibold mb-6">Welcome to Debate Master</h2>
      <Leaderboard username={username} />
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
                  Multiplier: x{difficulty === 'easy' ? '1.0' : difficulty === 'medium' ? '1.1' : '1.2'})
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
