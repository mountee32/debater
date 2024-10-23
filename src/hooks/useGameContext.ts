import { useContext } from 'react';
import { GameContext, GameContextType } from '../contexts/GameContext';

export function useGameContext(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
