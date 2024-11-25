import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DebateHeader } from './DebateHeader';

describe('DebateHeader', () => {
  const defaultProps = {
    topic: 'Test Topic',
    timeLeft: 180, // 3 minutes
    audienceScore: {
      user: 60,
      opponent: 40,
    },
    userPosition: 'for' as const,
    aiPosition: 'against' as const,
    aiName: 'Test AI',
    isDarkMode: false,
    onToggleDarkMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header elements correctly', () => {
    render(<DebateHeader {...defaultProps} />);

    expect(screen.getByTestId('debate-header')).toBeInTheDocument();
    expect(screen.getByTestId('debate-topic')).toHaveTextContent('Test Topic');
    expect(screen.getByTestId('timer')).toHaveTextContent('3:00');
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const { rerender } = render(<DebateHeader {...defaultProps} />);

    // Test 3 minutes
    expect(screen.getByTestId('timer')).toHaveTextContent('3:00');

    // Test 1 minute 5 seconds
    rerender(<DebateHeader {...defaultProps} timeLeft={65} />);
    expect(screen.getByTestId('timer')).toHaveTextContent('1:05');

    // Test 30 seconds
    rerender(<DebateHeader {...defaultProps} timeLeft={30} />);
    expect(screen.getByTestId('timer')).toHaveTextContent('0:30');

    // Test 5 seconds
    rerender(<DebateHeader {...defaultProps} timeLeft={5} />);
    expect(screen.getByTestId('timer')).toHaveTextContent('0:05');
  });

  it('displays audience score correctly', () => {
    render(<DebateHeader {...defaultProps} />);

    const scoreBar = screen.getByTestId('audience-score-bar');
    const userScore = screen.getByTestId('user-score');
    const aiScore = screen.getByTestId('ai-score');

    expect(scoreBar).toBeInTheDocument();
    expect(userScore).toHaveTextContent('You (for) - 60%');
    expect(aiScore).toHaveTextContent('Test AI (against) - 40%');
  });

  it('applies correct score colors based on value', () => {
    const { rerender } = render(
      <DebateHeader
        {...defaultProps}
        audienceScore={{ user: 70, opponent: 30 }}
      />
    );

    // Test good score (> 60)
    let scoreBar = screen.getByTestId('audience-score-bar').firstChild;
    expect(scoreBar).toHaveClass('bg-gradient-to-r', 'from-green-600', 'to-green-400');

    // Test medium score (40-60)
    rerender(
      <DebateHeader
        {...defaultProps}
        audienceScore={{ user: 50, opponent: 50 }}
      />
    );
    scoreBar = screen.getByTestId('audience-score-bar').firstChild;
    expect(scoreBar).toHaveClass('bg-gradient-to-r', 'from-yellow-500', 'to-yellow-400');

    // Test low score (< 40)
    rerender(
      <DebateHeader
        {...defaultProps}
        audienceScore={{ user: 30, opponent: 70 }}
      />
    );
    scoreBar = screen.getByTestId('audience-score-bar').firstChild;
    expect(scoreBar).toHaveClass('bg-gradient-to-r', 'from-red-600', 'to-red-400');
  });

  it('handles theme toggle correctly', () => {
    const { rerender } = render(<DebateHeader {...defaultProps} />);

    // Test light mode
    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    fireEvent.click(themeToggle);
    expect(defaultProps.onToggleDarkMode).toHaveBeenCalled();

    // Test dark mode
    rerender(<DebateHeader {...defaultProps} isDarkMode={true} />);
    expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('applies correct position colors', () => {
    const { rerender } = render(<DebateHeader {...defaultProps} />);

    // Test 'for' position
    expect(screen.getByTestId('user-score')).toHaveClass('text-green-600');
    expect(screen.getByTestId('ai-score')).toHaveClass('text-red-600');

    // Test 'against' position
    rerender(
      <DebateHeader
        {...defaultProps}
        userPosition="against"
        aiPosition="for"
      />
    );
    expect(screen.getByTestId('user-score')).toHaveClass('text-red-600');
    expect(screen.getByTestId('ai-score')).toHaveClass('text-green-600');
  });

  it('highlights winning score', () => {
    const { rerender } = render(
      <DebateHeader
        {...defaultProps}
        audienceScore={{ user: 70, opponent: 30 }}
      />
    );

    // User winning
    expect(screen.getByTestId('user-score')).toHaveClass('font-bold');
    expect(screen.getByTestId('ai-score')).not.toHaveClass('font-bold');

    // AI winning
    rerender(
      <DebateHeader
        {...defaultProps}
        audienceScore={{ user: 30, opponent: 70 }}
      />
    );
    expect(screen.getByTestId('user-score')).not.toHaveClass('font-bold');
    expect(screen.getByTestId('ai-score')).toHaveClass('font-bold');
  });
});
