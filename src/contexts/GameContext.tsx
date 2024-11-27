import React, { createContext, useState, useEffect } from 'react';
import { generateTopic, submitScore, getLeaderboard } from '../api/openRouterApi';
import { AIPersonality } from '../data/aiPersonalities';
import preCreatedSubjectsData from '../data/preCreatedSubjects.json';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'select-category' | 'select-topic' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'end' | 'leaderboard' | 'select-pregenerated';
type Position = 'for' | 'against';

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
  pregeneratedQuestions: string[];
  setPregeneratedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  preCreatedSubjects: string[];
  setPreCreatedSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  handleStartChat: () => void;
  handleCategorySelect: (selectedCategory: string) => void;
  handleTopicSubmit: () => void;
  handlePersonalitySelect: (personality: AIPersonality) => void;
  handleDifficultyChange: (newDifficulty: Difficulty) => void;
  handlePositionSelect: (position: Position) => void;
  handlePregeneratedQuestionSelect: (question: string) => void;
  handlePreCreatedSubjectSelect: (subject: string) => void;
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
  const [pregeneratedQuestions, setPregeneratedQuestions] = useState<string[]>([]);
  const [preCreatedSubjects, setPreCreatedSubjects] = useState<string[]>([]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      setIsDarkMode(storedDarkMode === 'true');
    }

    fetch('/src/data/debateQuestions.json')
      .then(response => response.json())
      .then(data => {
        setPregeneratedQuestions(data.questions);
      })
      .catch(() => {
        setPregeneratedQuestions([]);
      });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleStartChat = () => {
    setGameState('select-category');
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setPreCreatedSubjects(preCreatedSubjectsData[selectedCategory as keyof typeof preCreatedSubjectsData]);
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

  const handlePregeneratedQuestionSelect = (question: string) => {
    setTopic(question);
    setGameState('select-position');
  };

  const handlePreCreatedSubjectSelect = (subject: string) => {
    setTopic(subject);
    setGameState('select-position');
  };

  const handleEndGame = async (result: { overallScore: number; rationale: string; recommendations: string }) => {
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
    preCreatedSubjects,
    setPreCreatedSubjects,
    handleStartChat,
    handleCategorySelect,
    handleTopicSubmit,
    handlePersonalitySelect,
    handleDifficultyChange,
    handlePositionSelect,
    handlePregeneratedQuestionSelect,
    handlePreCreatedSubjectSelect,
    handleEndGame,
    handleUsernameSubmit,
    toggleDarkMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
