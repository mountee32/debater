import React, { createContext, useState, useEffect } from 'react';
import { submitScore, getLeaderboard } from '../api/openRouterApi';
import { AIPersonality } from '../data/aiPersonalities';
import debateSubjectsData from '../data/debateSubjects.json';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'select-category' | 'select-topic' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'end' | 'leaderboard' | 'select-pregenerated';
type Position = 'for' | 'against';

interface DebateSubject {
  id: string;
  category: string;
  subject: string;
  access: string;
}

export interface GameContextType {
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
  availableSubjects: DebateSubject[];
  setAvailableSubjects: React.Dispatch<React.SetStateAction<DebateSubject[]>>;
  handleStartChat: () => void;
  handleCategorySelect: (selectedCategory: string) => void;
  handleTopicSubmit: () => void;
  handlePersonalitySelect: (personality: AIPersonality) => void;
  handleDifficultyChange: (newDifficulty: Difficulty) => void;
  handlePositionSelect: (position: Position) => void;
  handleSubjectSelect: (subject: string) => void;
  handleEndGame: (result: { overallScore: number; rationale: string; recommendations: string }) => Promise<void>;
  handleUsernameSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  toggleDarkMode: () => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
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
  const [availableSubjects, setAvailableSubjects] = useState<DebateSubject[]>([]);

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

  const handleStartChat = () => {
    setGameState('select-category');
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    const subjectsInCategory = debateSubjectsData.subjects.filter(
      subject => subject.category === selectedCategory && subject.access === 'free'
    );
    setAvailableSubjects(subjectsInCategory);
    setGameState('select-topic');
  };

  const handleTopicSubmit = () => {
    setGameState('select-position');
  };

  const handlePersonalitySelect = (personality: AIPersonality) => {
    setSelectedPersonality(personality);
    setGameState('select-difficulty');
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setGameState('playing');
  };

  const handlePositionSelect = (position: Position) => {
    setUserPosition(position);
    setGameState('select-personality');
  };

  const handleSubjectSelect = (subject: string) => {
    setTopic(subject);
    setGameState('select-position');
  };

  const handleEndGame = async (result: { overallScore: number; rationale: string; recommendations: string }) => {
    const difficultyMultiplier = difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.1 : 1.2;
    const adjustedScore = Math.round(result.overallScore * difficultyMultiplier);
    setScore(adjustedScore);
    setRationale(result.rationale);
    setRecommendations(result.recommendations);
    
    const leaderboardData = await getLeaderboard();
    const highScore = leaderboardData.length < 100 || adjustedScore > leaderboardData[leaderboardData.length - 1].score;

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
        await submitScore(newUsername, score);
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
    availableSubjects,
    setAvailableSubjects,
    handleStartChat,
    handleCategorySelect,
    handleTopicSubmit,
    handlePersonalitySelect,
    handleDifficultyChange,
    handlePositionSelect,
    handleSubjectSelect,
    handleEndGame,
    handleUsernameSubmit,
    toggleDarkMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
