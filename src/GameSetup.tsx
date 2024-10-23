import React from 'react';
import { User, Book, Globe, Atom, LucideIcon, Lightbulb, HelpCircle, Feather, Zap, Dumbbell, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useGameContext } from './hooks/useGameContext';
import { AIPersonality, aiPersonalities } from './data/aiPersonalities';

const categories: { name: string; icon: LucideIcon }[] = [
  { name: 'Religion', icon: Book },
  { name: 'Politics', icon: Globe },
  { name: 'Science', icon: Atom },
  { name: 'Philosophy', icon: Lightbulb },
  { name: 'Random', icon: HelpCircle },
];

const difficulties: { name: 'easy' | 'medium' | 'hard'; icon: LucideIcon; description: string }[] = [
  { name: 'easy', icon: Feather, description: 'Casual debate with simple arguments' },
  { name: 'medium', icon: Zap, description: 'Balanced debate with moderate complexity' },
  { name: 'hard', icon: Dumbbell, description: 'Intense debate with advanced arguments' },
];

const positions: { name: 'for' | 'against'; icon: LucideIcon; description: string }[] = [
  { name: 'for', icon: ThumbsUp, description: 'Argue in favor of the topic' },
  { name: 'against', icon: ThumbsDown, description: 'Argue against the topic' },
];

const StepContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      {children}
    </div>
  </div>
);

export const CategorySelection: React.FC = () => {
  const { handleCategorySelect } = useGameContext();

  return (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select Discussion Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => handleCategorySelect(name)}
            className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
          >
            <Icon className="w-8 h-8 mb-2 text-blue-500" />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </StepContainer>
  );
};

export const TopicSelection: React.FC = () => {
  const { topic, setTopic, preCreatedSubjects, handlePreCreatedSubjectSelect, handleTopicSubmit } = useGameContext();

  return (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select or Enter Debate Topic</h2>
      <div className="space-y-4 mb-6">
        {preCreatedSubjects.map((subject: string, index: number) => (
          <button
            key={index}
            onClick={() => handlePreCreatedSubjectSelect(subject)}
            className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
          >
            {subject}
          </button>
        ))}
      </div>
      <form onSubmit={handleTopicSubmit} className="space-y-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          placeholder="Or enter your own debate topic here"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Continue with Custom Topic
        </button>
      </form>
    </StepContainer>
  );
};

export const AIPersonalitySelection: React.FC = () => {
  const { handlePersonalitySelect } = useGameContext();

  return (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select AI Opponent</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiPersonalities.map((personality) => (
          <button
            key={personality.id}
            className="text-left bg-gray-100 dark:bg-gray-700 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
            onClick={() => handlePersonalitySelect(personality)}
          >
            <div className="flex items-start">
              <div className="w-16 h-16 rounded-full mr-4 overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <img
                  src={personality.avatarUrl}
                  alt={`${personality.name} avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <User className="w-8 h-8 text-gray-400 hidden" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{personality.name}</h3>
                <p className="text-sm">{personality.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </StepContainer>
  );
};

export const DifficultySelection: React.FC = () => {
  const { difficulty, handleDifficultyChange } = useGameContext();

  return (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select Difficulty</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {difficulties.map(({ name, icon: Icon, description }) => (
          <button
            key={name}
            onClick={() => handleDifficultyChange(name)}
            className={`flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 ${
              difficulty === name ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Icon className="w-8 h-8 mb-2 text-blue-500" />
            <span className="font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <p className="text-sm text-center mt-2">{description}</p>
          </button>
        ))}
      </div>
    </StepContainer>
  );
};

export const PositionSelection: React.FC = () => {
  const { topic, userPosition, handlePositionSelect } = useGameContext();

  return (
    <StepContainer>
      <h2 className="text-3xl font-bold mb-2 text-center">Topic:</h2>
      <p className="text-2xl mb-6 text-center font-semibold text-blue-600 dark:text-blue-400">{topic}</p>
      <h3 className="text-xl font-semibold mb-4 text-center">Select Your Position</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map(({ name, icon: Icon, description }) => (
          <button
            key={name}
            onClick={() => handlePositionSelect(name)}
            className={`flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 ${
              userPosition === name ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Icon className={`w-8 h-8 mb-2 ${name === 'for' ? 'text-green-500' : 'text-red-500'}`} />
            <span className="font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <p className="text-sm text-center mt-2">{description}</p>
          </button>
        ))}
      </div>
    </StepContainer>
  );
};

export const PregeneratedQuestionSelection: React.FC = () => {
  const { pregeneratedQuestions, handlePregeneratedQuestionSelect } = useGameContext();

  return (
    <StepContainer>
      <h2 className="text-2xl font-semibold mb-4 text-center">Select a Pregenerated Question</h2>
      <div className="space-y-4">
        {pregeneratedQuestions.map((question: string, index: number) => (
          <button
            key={index}
            onClick={() => handlePregeneratedQuestionSelect(question)}
            className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
          >
            {question}
          </button>
        ))}
      </div>
    </StepContainer>
  );
};
