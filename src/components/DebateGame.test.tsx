import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebateGame from './DebateGame';
import { useDebateLogic } from '../hooks/useDebateLogic';
import { useTimer } from '../hooks/useTimer';

// Mock the custom hooks
jest.mock('../hooks/useDebateLogic');
jest.mock('../hooks/useTimer');

const mockAiPersonality = {
  id: 'test-ai',
  name: 'Test AI',
  description: 'Test AI Description',
  avatarUrl: '/test-avatar.png',
  traits: {
    argumentStyle: 'logical',
    vocabulary: 'formal',
    exampleTypes: 'statistical',
    debateStrategy: 'analytical'
  }
};

const mockProps = {
  topic: 'Test Topic',
  difficulty: 'medium' as const,
  onEndGame: jest.fn(),
  aiPersonality: mockAiPersonality,
  userPosition: 'for' as const,
  isDarkMode: false,
  onToggleDarkMode: jest.fn(),
};

const mockDebateLogic = {
  state: {
    isLoading: false,
    isGeneratingHint: false,
    currentScore: 0,
    audienceScore: { user: 50, opponent: 50 },
    consecutiveGoodArguments: 0,
    isDebateEnded: false,
    isAiThinking: false,
    error: null,
  },
  messages: [
    { id: 1, role: 'opponent', content: 'Initial message' },
    { id: 2, role: 'user', content: 'User response', score: 7 },
  ],
  handleEndGame: jest.fn(),
  handleSendArgument: jest.fn(),
  handleHintRequest: jest.fn(),
  initializeDebate: jest.fn(),
};

describe('DebateGame', () => {
  beforeEach(() => {
    (useDebateLogic as jest.Mock).mockReturnValue(mockDebateLogic);
    (useTimer as jest.Mock).mockReturnValue(300);
  });

  it('renders the debate game with initial components', () => {
    render(<DebateGame {...mockProps} />);

    // Check header elements
    expect(screen.getByTestId('debate-header')).toBeInTheDocument();
    expect(screen.getByTestId('debate-topic')).toHaveTextContent('Test Topic');
    expect(screen.getByTestId('timer')).toBeInTheDocument();

    // Check messages
    expect(screen.getByText('Initial message')).toBeInTheDocument();
    expect(screen.getByText('User response')).toBeInTheDocument();

    // Check controls
    expect(screen.getByTestId('debate-controls')).toBeInTheDocument();
    expect(screen.getByTestId('argument-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
    expect(screen.getByTestId('hint-button')).toBeInTheDocument();
    expect(screen.getByTestId('end-button')).toBeInTheDocument();
  });

  it('handles sending a new argument', async () => {
    render(<DebateGame {...mockProps} />);

    const input = screen.getByTestId('argument-input');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'New argument' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockDebateLogic.handleSendArgument).toHaveBeenCalledWith('New argument');
    });
  });

  it('handles requesting a hint', async () => {
    const mockHint = 'This is a hint';
    (mockDebateLogic.handleHintRequest as jest.Mock).mockResolvedValueOnce(mockHint);

    render(<DebateGame {...mockProps} />);

    const hintButton = screen.getByTestId('hint-button');
    fireEvent.click(hintButton);

    await waitFor(() => {
      expect(mockDebateLogic.handleHintRequest).toHaveBeenCalled();
    });
  });

  it('handles ending the game', () => {
    render(<DebateGame {...mockProps} />);

    const endButton = screen.getByTestId('end-button');
    fireEvent.click(endButton);

    expect(mockDebateLogic.handleEndGame).toHaveBeenCalled();
  });

  it('displays error message when present', () => {
    const errorMessage = 'Test error message';
    (useDebateLogic as jest.Mock).mockReturnValue({
      ...mockDebateLogic,
      state: { ...mockDebateLogic.state, error: errorMessage },
    });

    render(<DebateGame {...mockProps} />);

    expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
  });

  it('shows loading state when AI is thinking', () => {
    (useDebateLogic as jest.Mock).mockReturnValue({
      ...mockDebateLogic,
      state: { ...mockDebateLogic.state, isAiThinking: true },
    });

    render(<DebateGame {...mockProps} />);

    expect(screen.getByTestId('thinking-avatar')).toBeInTheDocument();
  });

  it('toggles dark mode', () => {
    render(<DebateGame {...mockProps} />);

    const themeToggle = screen.getByTestId('theme-toggle');
    fireEvent.click(themeToggle);

    expect(mockProps.onToggleDarkMode).toHaveBeenCalled();
  });
});
