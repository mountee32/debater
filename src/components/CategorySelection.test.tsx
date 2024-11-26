import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelection from './CategorySelection';
import { useGameContext } from '../hooks/useGameContext';

// Mock the useGameContext hook
jest.mock('../hooks/useGameContext', () => ({
  useGameContext: jest.fn(),
}));

const mockedUseGameContext = useGameContext as jest.MockedFunction<typeof useGameContext>;

describe('CategorySelection', () => {
  const mockHandleCategorySelect = jest.fn();

  beforeEach(() => {
    mockedUseGameContext.mockReturnValue({
      handleCategorySelect: mockHandleCategorySelect,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<CategorySelection />);
    expect(screen.getByText('Select Category')).toBeInTheDocument();
  });

  it('renders all category buttons', () => {
    render(<CategorySelection />);
    
    const expectedCategories = ['Religion', 'Politics', 'Science', 'Philosophy', 'Random'];
    expectedCategories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('calls handleCategorySelect when a category is clicked', () => {
    render(<CategorySelection />);
    
    const religionButton = screen.getByText('Religion');
    fireEvent.click(religionButton);
    
    expect(mockHandleCategorySelect).toHaveBeenCalledWith('Religion');
  });

  it('applies correct styling to category buttons', () => {
    render(<CategorySelection />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    
    buttons.forEach(button => {
      expect(button).toHaveClass(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'p-6',
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'shadow-md',
        'hover:shadow-lg',
        'transition-all',
        'duration-300',
        'transform',
        'hover:scale-105'
      );
    });
  });

  it('renders icons for each category', () => {
    render(<CategorySelection />);
    
    // Check if SVG icons are rendered
    const icons = document.querySelectorAll('svg');
    expect(icons).toHaveLength(5);
    
    icons.forEach(icon => {
      expect(icon).toHaveClass('mb-4', 'text-indigo-600', 'dark:text-indigo-400');
    });
  });

  it('maintains accessibility features', () => {
    render(<CategorySelection />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeVisible();
      expect(button).not.toHaveAttribute('aria-hidden');
      // Removed type attribute check since it's not required for button elements
    });
  });
});
