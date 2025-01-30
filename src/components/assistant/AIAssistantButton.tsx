import React from 'react';
import { Brain } from 'lucide-react';

interface AIAssistantButtonProps {
  onClick: () => void;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 p-3 bg-indigo-500 hover:bg-indigo-600 border-2 border-indigo-500 hover:border-indigo-600 rounded-full shadow-lg transition-all duration-200 ease-in-out group flex items-center justify-center"
      aria-label="Open AI Assistant"
    >
      <Brain className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      <span className="text-sm text-white mx-2"> Ask Me Anything</span>
    </button>
  );
};
