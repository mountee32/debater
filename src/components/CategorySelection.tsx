import React from 'react';
import { Book, Globe, Atom, Lightbulb, Shuffle } from 'lucide-react';
import { useGameContext } from '../hooks/useGameContext';

const CategorySelection: React.FC = () => {
  const { handleCategorySelect } = useGameContext();

  const categories = [
    { name: 'Religion', icon: Book },
    { name: 'Politics', icon: Globe },
    { name: 'Science', icon: Atom },
    { name: 'Philosophy', icon: Lightbulb },
    { name: 'Random', icon: Shuffle },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Select Category</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategorySelect(category.name)}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <category.icon size={48} className="mb-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-lg font-semibold">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
