import React, { useState } from 'react';
import { Moon, Sun, ArrowLeft, MessageSquare } from 'lucide-react';
import { DebateGame, Leaderboard } from './components';
import { GameProvider, useGameContext } from './GameContext';
import { CategorySelection, AIPersonalitySelection, DifficultySelection, PositionSelection, PregeneratedQuestionSelection, TopicSelection } from './GameSetup';

const steps = ['Category', 'Topic', 'Position', 'Opponent', 'Difficulty'];

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
    handleStartChat,
    handleEndGame,
    handleUsernameSubmit,
    toggleDarkMode,
  } = useGameContext();

  const handleStartDebateFromLeaderboard = (subject: string) => {
    setTopic(subject);
    setGameState('select-position');
  };

  const getCurrentStep = () => {
    switch (gameState) {
      case 'select-category': return 0;
      case 'select-topic': return 1;
      case 'select-position': return 2;
      case 'select-personality': return 3;
      case 'select-difficulty': return 4;
      default: return -1;
    }
  };

  const goBack = () => {
    console.log('Going back from:', gameState);
    switch (gameState) {
      case 'select-topic': setGameState('select-category'); break;
      case 'select-position': setGameState('select-topic'); break;
      case 'select-personality': setGameState('select-position'); break;
      case 'select-difficulty': setGameState('select-personality'); break;
      default: setGameState('home');
    }
  };

  const WizardSteps = () => {
    const currentStep = getCurrentStep();
    if (currentStep === -1) return null;

    return (
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between items-center mb-3 sm:mb-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs ${
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
          <button onClick={goBack} className="flex items-center text-blue-500 hover:text-blue-700 transition-colors duration-300 text-xs">
            <ArrowLeft size={12} className="mr-1" />
            Back
          </button>
        )}
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="text-center">
      <Leaderboard username={username} onStartDebate={handleStartDebateFromLeaderboard} />
      <div className="flex justify-center mt-4">
        <button
          onClick={handleStartChat}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-sm"
          title="Start a new debate chat"
        >
          Start Chat
          <MessageSquare size={16} className="ml-2 inline-block" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300 bg-opacity-50 dark:bg-opacity-50" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%239C92AC\' fill-opacity=\'0.4\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E")'}}>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <header className="flex justify-center items-center mb-4 sm:mb-6 relative">
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">Debate Master</h1>
            <button 
              onClick={toggleDarkMode} 
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 absolute right-0"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="text-yellow-400" size={16} /> : <Moon className="text-gray-600" size={16} />}
            </button>
          </header>

          <WizardSteps />

          {gameState === 'home' && <HomeScreen />}
          {gameState === 'select-category' && <CategorySelection />}
          {gameState === 'select-topic' && <TopicSelection />}
          {gameState === 'select-position' && <PositionSelection />}
          {gameState === 'select-personality' && <AIPersonalitySelection />}
          {gameState === 'select-difficulty' && <DifficultySelection />}
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
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Game Over!</h2>
              <div className="mb-4">
                <p className="text-lg mb-1">Your debate score:</p>
                <p className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">{score}/10</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  (Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}, 
                  Multiplier: x{difficulty === 'easy' ? '1.0' : difficulty === 'medium' ? '1.1' : '1.2'})
                </p>
              </div>
              <div className="mb-4 text-left">
                <h3 className="text-lg sm:text-xl font-semibold mb-1">Feedback:</h3>
                <p className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-sm">{rationale}</p>
              </div>
              <div className="mb-4 text-left">
                <h3 className="text-lg sm:text-xl font-semibold mb-1">Level Up Tips:</h3>
                <ul className="list-disc list-inside bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-sm">
                  {recommendations.split('\n').map((rec: string, index: number) => (
                    <li key={index} className="mb-1">{rec}</li>
                  ))}
                </ul>
              </div>
              {showUsernamePrompt && (
                <div className="mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">New High Score!</h3>
                  <form onSubmit={handleUsernameSubmit} className="flex flex-col items-center">
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      className="border p-2 mb-2 rounded-lg w-64 dark:bg-gray-700 dark:border-gray-600 text-sm"
                      required
                    />
                    <button type="submit" className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg transition-all duration-300 text-sm">Submit Score</button>
                  </form>
                </div>
              )}
              <button
                onClick={() => setGameState('home')}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-sm"
              >
                Play Again
              </button>
            </div>
          )}
          {gameState === 'leaderboard' && (
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Leaderboard</h2>
              <Leaderboard username={username} onStartDebate={handleStartDebateFromLeaderboard} />
              <button
                onClick={() => setGameState('home')}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 mt-4 text-sm"
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
