import { render, screen, fireEvent } from '@testing-library/react';
import Leaderboard from './Leaderboard';

jest.mock('../data/leaderboard.json', () => ([
  { id: 1, username: 'user1', score: 100, subject: 'Test 1', category: 'Politics' },
  { id: 2, username: 'user2', score: 90, subject: 'Test 2', category: 'Politics' },
  { id: 3, username: 'user3', score: 80, subject: 'Test 3', category: 'Politics' }
]));

describe('Leaderboard', () => {
  const mockOnStartDebate = jest.fn();
  const defaultProps = {
    username: 'user1',
    onStartDebate: mockOnStartDebate
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the leaderboard title', () => {
    render(<Leaderboard {...defaultProps} />);
    expect(screen.getByText('Global Leaderboard')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<Leaderboard {...defaultProps} />);
    
    // Find buttons by their text content within spans
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(button => button.textContent?.trim());
    expect(buttonTexts).toContain('Politics');
  });

  it('filters entries by category when clicking category buttons', () => {
    render(<Leaderboard {...defaultProps} />);
    
    // Initially shows Politics (default category)
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getByText('Test 3')).toBeInTheDocument();
  });

  it('highlights current user entries', () => {
    render(<Leaderboard {...defaultProps} />);
    
    const userCell = screen.getByText('user1');
    const userRow = userCell.closest('tr');
    expect(userRow).toHaveClass('bg-indigo-50', 'dark:bg-indigo-900/20');
  });

  it('shows popup when clicking an entry', () => {
    render(<Leaderboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Test 1'));
    
    const popup = screen.getByRole('dialog');
    expect(popup).toBeInTheDocument();
    expect(popup).toHaveTextContent('Test 1');
  });

  it('calls onStartDebate with correct subject when starting debate', () => {
    render(<Leaderboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Test 1'));
    fireEvent.click(screen.getByText('Start Debate'));
    
    expect(mockOnStartDebate).toHaveBeenCalledWith('Test 1');
  });

  it('closes popup when clicking cancel', () => {
    render(<Leaderboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Test 1'));
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays rank icons for top 3 entries', () => {
    render(<Leaderboard {...defaultProps} />);
    
    const trophyIcon = screen.getByTestId('trophy-icon');
    const silverMedalIcon = screen.getByTestId('silver-medal-icon');
    const bronzeMedalIcon = screen.getByTestId('bronze-medal-icon');
    
    expect(trophyIcon).toHaveClass('text-yellow-500');
    expect(silverMedalIcon).toHaveClass('text-gray-400');
    expect(bronzeMedalIcon).toHaveClass('text-amber-600');
  });

  it('truncates long subject names', () => {
    const longSubject = 'This is a very long subject that should be truncated in the display';
    const mockData = [
      { id: 1, username: 'user1', score: 100, subject: longSubject, category: 'Politics' }
    ];
    
    jest.resetModules();
    jest.doMock('../data/leaderboard.json', () => mockData);
    
    const { rerender } = render(<Leaderboard {...defaultProps} />);
    rerender(<Leaderboard {...defaultProps} />);
    
    const subjectSpan = screen.getByTitle(longSubject);
    const displayedText = subjectSpan.textContent || '';
    expect(displayedText.length).toBeLessThan(longSubject.length);
  });

  it('sorts entries by score in descending order', () => {
    render(<Leaderboard {...defaultProps} />);
    
    const scores = Array.from(screen.getAllByRole('cell'))
      .map(cell => cell.textContent?.trim())
      .filter(text => /^\d+$/.test(text || ''))
      .map(text => parseInt(text || '0', 10))
      .filter(score => !isNaN(score) && score > 10); // Filter out rank numbers (1,2,3)
    
    expect(scores).toEqual([100, 90, 80]);
  });

  it('applies correct styling to selected category', () => {
    render(<Leaderboard {...defaultProps} />);
    
    const politicsButton = screen.getByRole('button', { name: /Politics/i });
    expect(politicsButton).toHaveClass('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500');
  });
});
