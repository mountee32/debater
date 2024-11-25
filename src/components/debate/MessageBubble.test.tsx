import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble } from './MessageBubble';

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

describe('MessageBubble', () => {
  const defaultProps = {
    role: 'user' as const,
    content: 'Test message content',
    userPosition: 'for' as const,
    aiPosition: 'against' as const,
    aiPersonality: mockAiPersonality,
  };

  it('renders user message correctly', () => {
    render(<MessageBubble {...defaultProps} />);

    expect(screen.getByTestId('message-bubble-user')).toBeInTheDocument();
    expect(screen.getByTestId('message-content')).toHaveTextContent('Test message content');
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('message-author')).toHaveTextContent('You (for)');
  });

  it('renders AI message correctly', () => {
    render(
      <MessageBubble
        {...defaultProps}
        role="opponent"
        content="AI response"
      />
    );

    expect(screen.getByTestId('message-bubble-opponent')).toBeInTheDocument();
    expect(screen.getByTestId('message-content')).toHaveTextContent('AI response');
    expect(screen.getByTestId('ai-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('message-author')).toHaveTextContent('Test AI (against)');
  });

  it('displays score when provided', () => {
    render(
      <MessageBubble
        {...defaultProps}
        score={7}
      />
    );

    expect(screen.getByTestId('message-score')).toHaveTextContent('Score: 7');
  });

  it('does not display score when not provided', () => {
    render(<MessageBubble {...defaultProps} />);

    expect(screen.queryByTestId('message-score')).not.toBeInTheDocument();
  });

  it('applies correct color classes based on position', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);

    // User message with 'for' position should have green background
    expect(screen.getByTestId('message-content')).toHaveClass('from-green-50', 'to-emerald-50');

    // Rerender with 'against' position
    rerender(
      <MessageBubble
        {...defaultProps}
        userPosition="against"
      />
    );

    // User message with 'against' position should have red background
    expect(screen.getByTestId('message-content')).toHaveClass('from-red-50', 'to-rose-50');
  });

  it('handles AI avatar load error gracefully', () => {
    render(
      <MessageBubble
        {...defaultProps}
        role="opponent"
      />
    );

    const avatar = screen.getByTestId('ai-avatar');
    fireEvent.error(avatar);

    expect(avatar).not.toBeVisible();
    expect(avatar.parentElement).toHaveClass('flex', 'items-center', 'justify-center');
  });
});
