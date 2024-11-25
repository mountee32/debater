import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DebateControls } from './DebateControls';

describe('DebateControls', () => {
  const defaultProps = {
    currentArgument: '',
    setCurrentArgument: jest.fn(),
    onSendArgument: jest.fn(),
    onHintRequest: jest.fn(),
    onEndGame: jest.fn(),
    isLoading: false,
    isGeneratingHint: false,
    userPosition: 'for' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all controls correctly', () => {
    render(<DebateControls {...defaultProps} />);

    expect(screen.getByTestId('debate-controls')).toBeInTheDocument();
    expect(screen.getByTestId('argument-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
    expect(screen.getByTestId('hint-button')).toBeInTheDocument();
    expect(screen.getByTestId('end-button')).toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    render(<DebateControls {...defaultProps} />);

    const input = screen.getByTestId('argument-input');
    fireEvent.change(input, { target: { value: 'New argument' } });

    expect(defaultProps.setCurrentArgument).toHaveBeenCalledWith('New argument');
  });

  it('handles Enter key press correctly', () => {
    render(<DebateControls {...defaultProps} currentArgument="Test argument" />);

    const input = screen.getByTestId('argument-input');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(defaultProps.onSendArgument).toHaveBeenCalled();
  });

  it('ignores Enter key press with Shift', () => {
    render(<DebateControls {...defaultProps} />);

    const input = screen.getByTestId('argument-input');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(defaultProps.onSendArgument).not.toHaveBeenCalled();
  });

  it('disables send button when loading', () => {
    render(<DebateControls {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('disables send button when argument is empty', () => {
    render(<DebateControls {...defaultProps} currentArgument="" />);

    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('enables send button with non-empty argument and not loading', () => {
    render(<DebateControls {...defaultProps} currentArgument="Test argument" />);

    expect(screen.getByTestId('send-button')).not.toBeDisabled();
  });

  it('disables hint button when generating hint', () => {
    render(<DebateControls {...defaultProps} isGeneratingHint={true} />);

    expect(screen.getByTestId('hint-button')).toBeDisabled();
    expect(screen.getByTestId('hint-button')).toHaveTextContent('Thinking...');
  });

  it('handles button clicks correctly', () => {
    render(<DebateControls {...defaultProps} currentArgument="Test argument" />);

    fireEvent.click(screen.getByTestId('send-button'));
    expect(defaultProps.onSendArgument).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('hint-button'));
    expect(defaultProps.onHintRequest).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('end-button'));
    expect(defaultProps.onEndGame).toHaveBeenCalled();
  });

  it('shows correct placeholder text based on user position', () => {
    const { rerender } = render(<DebateControls {...defaultProps} userPosition="for" />);
    
    expect(screen.getByTestId('argument-input')).toHaveAttribute(
      'placeholder',
      'Type your argument here... (You are for this topic)'
    );

    rerender(<DebateControls {...defaultProps} userPosition="against" />);
    
    expect(screen.getByTestId('argument-input')).toHaveAttribute(
      'placeholder',
      'Type your argument here... (You are against this topic)'
    );
  });
});
