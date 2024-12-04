import React, { createContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AIPersonality, aiPersonalities } from '../data/aiPersonalities';
import debateSubjectsData from '../data/debateSubjects.json';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'home' | 'select-category' | 'select-topic' | 'select-personality' | 'select-difficulty' | 'select-position' | 'playing' | 'select-pregenerated' | 'replaying';
export type Position = 'for' | 'against';

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
  currentSubjectId: string;
  setCurrentSubjectId: React.Dispatch<React.SetStateAction<string>>;
  replayConversationId: string;
  setReplayConversationId: React.Dispatch<React.SetStateAction<string>>;
  handleStartChat: () => void;
  handleCategorySelect: (selectedCategory: string) => void;
  handleTopicSubmit: () => void;
  handlePersonalitySelect: (personality: AIPersonality) => void;
  handleDifficultyChange: (newDifficulty: Difficulty) => void;
  handlePositionSelect: (position: Position) => void;
  handleSubjectSelect: (subject: string, subjectId: string) => void;
  handleWatchReplay: (entry: { id: number; username: string; score: number; subjectId: string; position: Position; skill: Difficulty; conversationId?: string }) => void;
  toggleDarkMode: () => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

// Default personality for replay mode
const defaultPersonality = aiPersonalities.find(p => p.id === 'logical_larry') || aiPersonalities[0];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [gameState, setGameState] = useState<GameState>('home');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<string>('');
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [userPosition, setUserPosition] = useState<Position>('for');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<DebateSubject[]>([]);
  const [currentSubjectId, setCurrentSubjectId] = useState<string>('');
  const [replayConversationId, setReplayConversationId] = useState<string>('');

  // Initialize replay mode if conversationId is present in URL
  useEffect(() => {
    if (conversationId) {
      setReplayConversationId(conversationId);
      setSelectedPersonality(defaultPersonality);
      setGameState('replaying');
    }
  }, [conversationId]);

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
    // For custom topics, try to find a matching subject ID
    const matchingSubject = debateSubjectsData.subjects.find(
      subject => subject.subject.toLowerCase() === topic.toLowerCase()
    );
    if (matchingSubject) {
      setCurrentSubjectId(matchingSubject.id);
    }
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

  const handleSubjectSelect = (subject: string, subjectId: string) => {
    setTopic(subject);
    setCurrentSubjectId(subjectId);
    setGameState('select-position');
  };

  const handleWatchReplay = (entry: { id: number; username: string; score: number; subjectId: string; position: Position; skill: Difficulty; conversationId?: string }) => {
    if (!entry.conversationId) {
      console.error('No conversation ID available for replay');
      return;
    }
    setReplayConversationId(entry.conversationId);
    setUserPosition(entry.position);
    setDifficulty(entry.skill);
    setCurrentSubjectId(entry.subjectId);
    setSelectedPersonality(defaultPersonality);
    setGameState('replaying');
    navigate(`/replay/${entry.conversationId}`);
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
    currentSubjectId,
    setCurrentSubjectId,
    replayConversationId,
    setReplayConversationId,
    handleStartChat,
    handleCategorySelect,
    handleTopicSubmit,
    handlePersonalitySelect,
    handleDifficultyChange,
    handlePositionSelect,
    handleSubjectSelect,
    handleWatchReplay,
    toggleDarkMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
