import React, { createContext, useState, useContext, useEffect } from 'react';
import { generateTopic, submitScore, getLeaderboard } from './api/openRouterApi';
import { AIPersonality } from './data/aiPersonalities';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'select-category' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'end' | 'leaderboard' | 'select-pregenerated';
type Position = 'for' | 'against';

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  topic: string;
  setTopic: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedPersonality: AIPersonality | null;
  setSelectedPersonality: React.Dispatch<React.SetStateAction<AIPersonality | null>>;
  difficulty: Difficulty;
  setDifficulty: React.Dispatch<React.SetStateAction<Difficulty>>;
  userPosition: Position;
  setUserPosition: React.Dispatch<React.SetStateAction<Position>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  rationale: string;
  setRationale: React.Dispatch<React.SetStateAction<string>>;
  recommendations: string;
  setRecommendations: React.Dispatch<React.SetStateAction<string>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  showUsernamePrompt: boolean;
  setShowUsernamePrompt: React.Dispatch<React.SetStateAction<boolean>>;
  isHighScore: boolean;
  setIsHighScore: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  pregeneratedQuestions: string[];
  setPregeneratedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  handleStartRandomGame: () => void;
  handleJoinExistingDiscussions: () => void;
  handleCategorySelect: (selectedCategory: string) => void;
  handlePersonalitySelect: (personality: AIPersonality) => void;
  handleDifficultyChange: (newDifficulty: Difficulty) => void;
  handlePositionSelect: (position: Position) => void;
  handlePregeneratedQuestionSelect: (question: string) => void;
  handleEndGame: (result: { overallScore: number; rationale: string; recommendations: string }) => Promise<void>;
  handleUsernameSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  toggleDarkMode: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const difficultyMultiplier = difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.1 : 1.2;
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

  const value = {
    gameState,
    setGameState,
    topic,
    setTopic,
    category,
    setCategory,
    selectedPersonality,
    setSelectedPersonality,
    difficulty,
    setDifficulty,
    userPosition,
    setUserPosition,
    score,
    setScore,
    rationale,
    setRationale,
    recommendations,
    setRecommendations,
    username,
    setUsername,
    showUsernamePrompt,
    setShowUsernamePrompt,
    isHighScore,
    setIsHighScore,
    isDarkMode,
    setIsDarkMode,
    pregeneratedQuestions,
    setPregeneratedQuestions,
    handleStartRandomGame,
    handleJoinExistingDiscussions,
    handleCategorySelect,
    handlePersonalitySelect,
    handleDifficultyChange,
    handlePositionSelect,
    handlePregeneratedQuestionSelect,
    handleEndGame,
    handleUsernameSubmit,
    toggleDarkMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
