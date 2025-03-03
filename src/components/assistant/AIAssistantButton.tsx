import React from 'react';
import { Brain, Settings } from 'lucide-react';
import { DashboardProduct, DashboardOrder } from '../../types/dashboard';
import { useAPIKeys } from '../../contexts/APIKeysContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Tooltip from '@mui/material/Tooltip';

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
  const { openaiApiKey } = useAPIKeys();
  const navigate = useNavigate();

  const handleClick = () => {
    // If no API key is present, navigate to settings instead of opening assistant
    if (!openaiApiKey) {
      navigate(ROUTES.SETTINGS);
    } else {
      onClick();
    }
  };

  // Determine button styling based on whether API key is present
  const buttonClasses = openaiApiKey
    ? `fixed bottom-6 right-6 p-3 ${
        isOpen ? 'bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-600'
      } border-2 border-indigo-500 hover:border-indigo-600 rounded-full shadow-lg transition-all duration-200 ease-in-out group flex items-center justify-center z-50`
    : 'fixed bottom-6 right-6 p-3 bg-gray-600 hover:bg-gray-700 border-2 border-gray-600 hover:border-gray-700 rounded-full shadow-lg transition-all duration-200 ease-in-out group flex items-center justify-center z-50';

  // Content based on whether API key is present  
  const buttonContent = openaiApiKey ? (
    <>
      <Brain className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      <span className="text-sm text-white mx-2">
        {isOpen ? 'Close Assistant' : 'Ask Me Anything'}
      </span>
    </>
  ) : (
    <>
      <Settings className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      <span className="text-sm text-white mx-2">
        Add OpenAI API Key
      </span>
    </>
  );

  // Wrap with tooltip if no API key
  if (!openaiApiKey) {
    return (
      <Tooltip title="Set up your OpenAI API key in Settings to use the AI Assistant" arrow>
        <button
          onClick={handleClick}
          className={buttonClasses}
          aria-label="Set up OpenAI API Key"
        >
          {buttonContent}
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={buttonClasses}
      aria-label="Open AI Assistant"
      aria-expanded={isOpen}
    >
      {buttonContent}
    </button>
  );
};
