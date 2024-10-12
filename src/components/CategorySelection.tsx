import React from 'react';
import { Book, Heart, Globe, Shuffle } from 'lucide-react';

interface CategorySelectionProps {
  onSelect: (category: string) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ onSelect }) => {
  const categories = [
    { name: 'Christianity', icon: Book },
    { name: 'Ethics', icon: Heart },
    { name: 'Politics', icon: Globe },
    { name: 'Random', icon: Shuffle },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Select Category</h2>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelect(category.name)}
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
