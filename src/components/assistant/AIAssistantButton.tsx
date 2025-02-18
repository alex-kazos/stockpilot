import React from 'react';
import { Brain } from 'lucide-react';
import { DashboardProduct, DashboardOrder } from '../../types/dashboard';

interface AIAssistantButtonProps {
  onClick: () => void;
  isOpen: boolean;
  products?: DashboardProduct[];
  orders?: DashboardOrder[];
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ 
  onClick, 
  isOpen,
  products = [],
  orders = []
}) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 p-3 ${
        isOpen ? 'bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-600'
      } border-2 border-indigo-500 hover:border-indigo-600 rounded-full shadow-lg transition-all duration-200 ease-in-out group flex items-center justify-center`}
      aria-label="Open AI Assistant"
      aria-expanded={isOpen}
    >
      <Brain className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      <span className="text-sm text-white mx-2">
        {isOpen ? 'Close Assistant' : 'Ask Me Anything'}
      </span>
    </button>
  );
};
