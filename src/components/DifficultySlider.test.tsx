import { render, screen, fireEvent } from '@testing-library/react';
import DifficultySlider from './DifficultySlider';

describe('DifficultySlider', () => {
  const mockOnDifficultyChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />);
    expect(screen.getByText('Select Difficulty')).toBeInTheDocument();
  });

  it('renders all difficulty buttons', () => {
    render(<DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />);
    
    ['Easy', 'Medium', 'Hard'].forEach(difficulty => {
      expect(screen.getByText(difficulty)).toBeInTheDocument();
    });
  });

  it('calls onDifficultyChange when a difficulty is selected', () => {
    render(<DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />);
    
    fireEvent.click(screen.getByText('Medium'));
    expect(mockOnDifficultyChange).toHaveBeenCalledWith('medium');
    
    fireEvent.click(screen.getByText('Hard'));
    expect(mockOnDifficultyChange).toHaveBeenCalledWith('hard');
  });

  it('applies correct styling to selected difficulty', () => {
    render(<DifficultySlider difficulty="medium" onDifficultyChange={mockOnDifficultyChange} />);
    
    const mediumButton = screen.getByText('Medium');
    expect(mediumButton).toHaveClass('bg-indigo-600', 'text-white');
    
    const easyButton = screen.getByText('Easy');
    expect(easyButton).not.toHaveClass('bg-indigo-600', 'text-white');
  });

  it('applies hover styles to unselected difficulties', () => {
    render(<DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />);
    
    const mediumButton = screen.getByText('Medium');
    const hardButton = screen.getByText('Hard');
    
    expect(mediumButton).toHaveClass('hover:bg-gray-300', 'dark:hover:bg-gray-600');
    expect(hardButton).toHaveClass('hover:bg-gray-300', 'dark:hover:bg-gray-600');
  });

  it('maintains consistent button layout', () => {
    render(<DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />);
    
    const container = screen.getByText('Select Difficulty').parentElement;
    expect(container).toHaveClass('mb-8');
    
    const buttonContainer = container?.querySelector('.flex');
    expect(buttonContainer).toHaveClass(
      'flex',
      'justify-between',
      'items-center',
      'bg-gray-200',
      'dark:bg-gray-700',
      'rounded-full',
      'p-2'
    );
  });

  it('capitalizes difficulty labels', () => {
    render(<DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />);
    
    const buttons = screen.getAllByRole('button');
    const labels = buttons.map(button => button.textContent);
    
    expect(labels).toEqual(['Easy', 'Medium', 'Hard']);
  });

  it('handles all difficulty transitions', () => {
    const { rerender } = render(
      <DifficultySlider difficulty="easy" onDifficultyChange={mockOnDifficultyChange} />
    );

    // Test transition from easy to medium
    rerender(<DifficultySlider difficulty="medium" onDifficultyChange={mockOnDifficultyChange} />);
    expect(screen.getByText('Medium')).toHaveClass('bg-indigo-600', 'text-white');

    // Test transition from medium to hard
    rerender(<DifficultySlider difficulty="hard" onDifficultyChange={mockOnDifficultyChange} />);
    expect(screen.getByText('Hard')).toHaveClass('bg-indigo-600', 'text-white');
  });
});
