import React, { createContext, useState, useEffect } from 'react';
import { AIPersonality } from '../data/aiPersonalities';
import debateSubjectsData from '../data/debateSubjects.json';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'home' | 'select-category' | 'select-topic' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'select-pregenerated';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<DebateSubject[]>([]);

  useEffect(() => {
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
    toggleDarkMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
