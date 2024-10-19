import React, { useState } from 'react';
import { Moon, Sun, ArrowLeft, HelpCircle, Shuffle } from 'lucide-react';
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
    setTopic,
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

  const handleStartDebateFromLeaderboard = (subject: string) => {
    setTopic(subject);
    setGameState('select-personality');
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
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                    index <= currentStep ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`mt-1 text-xs ${index <= currentStep ? 'text-blue-500 font-semibold' : 'text-gray-500'}`}>{step}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-grow relative">
                  <div 
                    className={`absolute top-0 left-0 right-0 h-0.5 ${
                      index < currentStep ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-300'
                    }`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {currentStep > 0 && (
          <button onClick={goBack} className="flex items-center text-blue-500 hover:text-blue-700 transition-colors duration-300 text-xs sm:text-sm">
            <ArrowLeft size={14} className="mr-1" />
            Back
          </button>
        )}
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="text-center">
      <Leaderboard username={username} onStartDebate={handleStartDebateFromLeaderboard} />
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
        <button
          onClick={handleStartRandomGame}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-sm"
          title="Start a new debate with a random topic"
        >
          Start Random Discussion
          <Shuffle size={18} className="ml-2 inline-block" />
        </button>
        <button
          onClick={handleJoinExistingDiscussions}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-sm"
          title="Join an ongoing debate from the list"
        >
          Join Existing Discussions
          <HelpCircle size={18} className="ml-2 inline-block" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300 bg-opacity-50 dark:bg-opacity-50" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%239C92AC\' fill-opacity=\'0.4\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E")'}}>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <header className="flex justify-between items-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">Debate Master</h1>
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="text-yellow-400" size={18} /> : <Moon className="text-gray-600" size={18} />}
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
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Game Over!</h2>
              <div className="mb-6">
                <p className="text-lg sm:text-xl mb-2">Your debate score:</p>
                <p className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">{score}/10</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  (Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}, 
                  Multiplier: x{difficulty === 'easy' ? '1.0' : difficulty === 'medium' ? '1.1' : '1.2'})
                </p>
              </div>
              <div className="mb-6 text-left">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">Feedback:</h3>
                <p className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-sm">{rationale}</p>
              </div>
              <div className="mb-6 text-left">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">Level Up Tips:</h3>
                <ul className="list-disc list-inside bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-sm">
                  {recommendations.split('\n').map((rec: string, index: number) => (
                    <li key={index} className="mb-2">{rec}</li>
                  ))}
                </ul>
              </div>
              {showUsernamePrompt && (
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2">New High Score!</h3>
                  <form onSubmit={handleUsernameSubmit} className="flex flex-col items-center">
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      className="border p-2 mb-2 rounded-lg w-64 dark:bg-gray-700 dark:border-gray-600 text-sm"
                      required
                    />
                    <button type="submit" className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 text-sm">Submit Score</button>
                  </form>
                </div>
              )}
              <button
                onClick={() => setGameState('home')}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-sm"
              >
                Play Again
              </button>
            </div>
          )}
          {gameState === 'leaderboard' && (
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Leaderboard</h2>
              <Leaderboard username={username} onStartDebate={handleStartDebateFromLeaderboard} />
              <button
                onClick={() => setGameState('home')}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 mt-6 text-sm"
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
