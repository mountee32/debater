import React from 'react';
import { useGameContext } from '../hooks/useGameContext';

const TopicSelection: React.FC = () => {
  const { 
    topic, 
    setTopic, 
    availableSubjects, 
    handleSubjectSelect, 
    handleTopicSubmit 
  } = useGameContext();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-colors duration-300">
        <h2 className="text-2xl font-semibold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
          Select or Enter Debate Topic
        </h2>
        
        <div className="space-y-4 mb-6">
          {availableSubjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelect(subject.subject, subject.id)}
              className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              {subject.subject}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleTopicSubmit();
        }} className="space-y-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            placeholder="Or enter your own debate topic here"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Continue with Custom Topic
          </button>
        </form>
      </div>
    </div>
  );
};

export default TopicSelection;
