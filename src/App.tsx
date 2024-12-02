import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { DebateGame, HomeScreen } from './components';
import { GameProvider } from './contexts/GameContext';
import { useGameContext } from './hooks/useGameContext';
import { CategorySelection, AIPersonalitySelection, DifficultySelection, PositionSelection, TopicSelection } from './GameSetup';

const steps = ['Category', 'Topic', 'Position', 'Opponent', 'Difficulty'];

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const {
    gameState,
    setGameState,
    topic,
    setTopic,
    difficulty,
    selectedPersonality,
    userPosition,
    isDarkMode,
    handleStartChat,
    toggleDarkMode,
    currentSubjectId,
    setCurrentSubjectId,
    replayConversationId,
  } = useGameContext();

  const handleStartDebateFromLeaderboard = (subject: string, subjectId: string) => {
    setTopic(subject);
    setCurrentSubjectId(subjectId);
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

  const renderDebateGame = (conversationId?: string) => {
    if (conversationId) {
      return (
        <DebateGame
          isReplayMode={true}
          conversationId={conversationId}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          aiPersonality={selectedPersonality!}
        />
      );
    }

    if (gameState === 'playing' && selectedPersonality) {
      return (
        <DebateGame
          topic={topic}
          difficulty={difficulty}
          aiPersonality={selectedPersonality}
          userPosition={userPosition}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          subjectId={currentSubjectId}
        />
      );
    }

    return null;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300 bg-opacity-50 dark:bg-opacity-50" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%239C92AC\' fill-opacity=\'0.4\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E")'}}>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Routes>
            <Route path="/replay/:conversationId" element={
              <DebateGame
                isReplayMode={true}
                conversationId={replayConversationId}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                aiPersonality={selectedPersonality!}
              />
            } />
            <Route path="/" element={
              <>
                {gameState !== 'replaying' && <WizardSteps />}
                {gameState === 'home' && (
                  <HomeScreen 
                    username={''} 
                    onStartDebate={handleStartDebateFromLeaderboard} 
                    handleStartChat={handleStartChat}
                  />
                )}
                {gameState === 'select-category' && <CategorySelection />}
                {gameState === 'select-topic' && <TopicSelection />}
                {gameState === 'select-position' && <PositionSelection />}
                {gameState === 'select-personality' && <AIPersonalitySelection />}
                {gameState === 'select-difficulty' && <DifficultySelection />}
                {renderDebateGame()}
              </>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
