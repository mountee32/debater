import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebateGame from './DebateGame';
import * as openRouterApi from '../api/openRouterApi';
import { AIPersonality } from '../data/aiPersonalities';

// Mock the API functions
jest.mock('../api/openRouterApi', () => ({
  startDebate: jest.fn(),
  continueDebate: jest.fn(),
  generateHint: jest.fn(),
  endDebate: jest.fn(),
  calculateProgressiveScore: jest.fn(),
  calculateComboBonus: jest.fn(),
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  log: jest.fn(),
}));

describe('DebateGame', () => {
  const mockAiPersonality: AIPersonality = {
    id: 'test-ai',
    name: 'Test AI',
    avatarUrl: 'test-url',
    description: 'Test description',
    traits: {
      argumentStyle: 'logical',
      vocabulary: 'formal',
      exampleTypes: 'statistical',
      debateStrategy: 'analytical',
    },
  };

  const createMockProps = (difficulty: 'easy' | 'medium' | 'hard') => ({
    topic: 'Test Topic',
    difficulty,
    onEndGame: jest.fn(),
    aiPersonality: mockAiPersonality,
    userPosition: 'for' as const,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  test('initializes debate on mount (easy difficulty)', async () => {
    const mockProps = createMockProps('easy');
    (openRouterApi.startDebate as jest.Mock).mockResolvedValue('AI initial response (easy)');

    render(<DebateGame {...mockProps} />);

    await waitFor(() => {
      expect(openRouterApi.startDebate).toHaveBeenCalledWith(
        mockProps.topic,
        mockProps.difficulty,
        mockProps.userPosition,
        mockProps.aiPersonality
      );
    });

    expect(await screen.findByText('AI initial response (easy)')).toBeInTheDocument();
  });

  test('initializes debate on mount (medium difficulty)', async () => {
    const mockProps = createMockProps('medium');
    (openRouterApi.startDebate as jest.Mock).mockResolvedValue('AI initial response (medium)');

    render(<DebateGame {...mockProps} />);

    await waitFor(() => {
      expect(openRouterApi.startDebate).toHaveBeenCalledWith(
        mockProps.topic,
        mockProps.difficulty,
        mockProps.userPosition,
        mockProps.aiPersonality
      );
    });

    expect(await screen.findByText('AI initial response (medium)')).toBeInTheDocument();
  });

  test('initializes debate on mount (hard difficulty)', async () => {
    const mockProps = createMockProps('hard');
    (openRouterApi.startDebate as jest.Mock).mockResolvedValue('AI initial response (hard)');

    render(<DebateGame {...mockProps} />);

    await waitFor(() => {
      expect(openRouterApi.startDebate).toHaveBeenCalledWith(
        mockProps.topic,
        mockProps.difficulty,
        mockProps.userPosition,
        mockProps.aiPersonality
      );
    });

    expect(await screen.findByText('AI initial response (hard)')).toBeInTheDocument();
  });

  test('sends user argument and continues debate', async () => {
    console.log('Starting test: sends user argument and continues debate');
    const mockProps = createMockProps('medium');
    (openRouterApi.startDebate as jest.Mock).mockResolvedValue('AI initial response');
    (openRouterApi.continueDebate as jest.Mock).mockResolvedValue({
      response: 'AI response',
      evaluation: {
        score: 8,
        feedback: 'Good argument',
        consistencyScore: 8,
        factScore: 8,
        styleScore: 8,
        audienceReaction: 8,
      },
    });

    render(<DebateGame {...mockProps} />);

    console.log('Waiting for AI initial response');
    await screen.findByText('AI initial response');
    console.log('AI initial response found');

    const input = screen.getByPlaceholderText('Type your argument here...');
    fireEvent.change(input, { target: { value: 'User argument' } });
    console.log('User argument entered');

    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    console.log('Send button clicked');

    await waitFor(() => {
      console.log('Checking if user argument is in the document');
      expect(screen.getByText('User argument')).toBeInTheDocument();
    }, { timeout: 1000 });

    await waitFor(() => {
      console.log('Checking if continueDebate was called');
      expect(openRouterApi.continueDebate).toHaveBeenCalled();
    }, { timeout: 1000 });

    await waitFor(() => {
      console.log('Checking continueDebate arguments');
      expect(openRouterApi.continueDebate).toHaveBeenCalledWith(
        mockProps.topic,
        expect.arrayContaining([
          expect.objectContaining({ role: 'opponent', content: 'AI initial response' }),
          expect.objectContaining({ role: 'user', content: 'User argument' }),
        ]),
        'User argument',
        mockProps.difficulty,
        mockProps.userPosition,
        mockProps.aiPersonality
      );
    }, { timeout: 10000 });

    console.log('Waiting for AI response');
    expect(await screen.findByText('AI response')).toBeInTheDocument();
    console.log('Test completed');
  }, 15000);

  test('generates hint when requested', async () => {
    const mockProps = createMockProps('medium');
    (openRouterApi.startDebate as jest.Mock).mockResolvedValue('AI initial response');
    (openRouterApi.generateHint as jest.Mock).mockResolvedValue('Hint message');

    render(<DebateGame {...mockProps} />);

    await screen.findByText('AI initial response');

    const hintButton = screen.getByText('Hint');
    fireEvent.click(hintButton);

    await waitFor(() => {
      expect(openRouterApi.generateHint).toHaveBeenCalledWith(
        mockProps.topic,
        expect.arrayContaining([
          expect.objectContaining({ role: 'opponent', content: 'AI initial response' }),
        ]),
        mockProps.difficulty,
        mockProps.userPosition
      );
    });

    expect(await screen.findByText('Hint: Hint message')).toBeInTheDocument();
  });

  test('ends game when end button is clicked', async () => {
    const mockProps = createMockProps('medium');
    (openRouterApi.startDebate as jest.Mock).mockResolvedValue('AI initial response');
    (openRouterApi.endDebate as jest.Mock).mockResolvedValue({
      overallScore: 100,
      rationale: 'Game ended rationale',
      recommendations: 'Game ended recommendations',
    });

    render(<DebateGame {...mockProps} />);

    await screen.findByText('AI initial response');

    const endButton = screen.getByText('End');
    fireEvent.click(endButton);

    await waitFor(() => {
      expect(openRouterApi.endDebate).toHaveBeenCalled();
      expect(mockProps.onEndGame).toHaveBeenCalledWith({
        overallScore: 100,
        rationale: 'Game ended rationale',
        recommendations: 'Game ended recommendations',
      });
    });
  });
});
