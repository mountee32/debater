import React from 'react';
import { ArrowLeft, Trophy, Star } from 'lucide-react';
import { DebateGame, Leaderboard, HomeScreen } from './components';
import { GameProvider } from './contexts/GameContext';
import { useGameContext } from './hooks/useGameContext';
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
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300" />
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
                  />
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300 bg-opacity-50 dark:bg-opacity-50" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%239C92AC\' fill-opacity=\'0.4\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E")'}}>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <WizardSteps />

          {gameState === 'home' && (
            <HomeScreen 
              username={username} 
              onStartDebate={handleStartDebateFromLeaderboard} 
              handleStartChat={handleStartChat}
            />
          )}
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
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )}
          {gameState === 'end' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 transition-all duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">Debate Complete!</h2>
                  <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-4">
                    <p className="text-lg text-white/90 mb-2">Final Score</p>
                    <p className="text-5xl font-bold text-white">{score}/10</p>
                    <p className="text-sm text-white/80 mt-2">
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
                      <span className="mx-2">•</span>
                      {difficulty === 'easy' ? '1.0x' : difficulty === 'medium' ? '1.1x' : '1.2x'} Multiplier
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-purple-500" />
                      Debate Analysis
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{rationale}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-purple-500" />
                      Improvement Tips
                    </h3>
                    <ul className="space-y-2">
                      {recommendations.split('\n').map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {showUsernamePrompt && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-6 border-2 border-purple-500/20">
                      <h3 className="text-xl font-semibold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                        🎉 New High Score! 🎉
                      </h3>
                      <form onSubmit={handleUsernameSubmit} className="flex flex-col items-center">
                        <input
                          type="text"
                          name="username"
                          placeholder="Enter your username"
                          className="w-full max-w-md px-4 py-2 rounded-xl border-2 border-purple-500/20 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 mb-4"
                          required
                        />
                        <button 
                          type="submit" 
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Submit Score
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setGameState('home')}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              </div>
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
