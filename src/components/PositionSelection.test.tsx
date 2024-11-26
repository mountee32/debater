import { render, screen } from '@testing-library/react';
import { PositionSelection } from '../GameSetup';
import { useGameContext } from '../hooks/useGameContext';

jest.mock('../hooks/useGameContext', () => ({
  useGameContext: () => ({
    topic: "Should artificial intelligence be regulated?",
    userPosition: 'for',
    handlePositionSelect: jest.fn()
  })
}));

describe('PositionSelection', () => {
  it('renders topic', () => {
    render(<PositionSelection />);
    expect(screen.getByText('Topic:')).toBeTruthy();
  });
});
