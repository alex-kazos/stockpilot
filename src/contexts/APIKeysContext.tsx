import React, { createContext, useContext, useState, useEffect } from 'react';

interface APIKeysContextType {
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
  saveOpenaiApiKey: (key: string) => Promise<void>;
}

const APIKeysContext = createContext<APIKeysContextType | undefined>(undefined);

interface APIKeysProviderProps {
  children: React.ReactNode;
}

export const APIKeysProvider: React.FC<APIKeysProviderProps> = ({ children }) => {
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');

  // Load API keys from local storage on initialization
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setOpenaiApiKey(storedKey);
    }
  }, []);

  // Save API key to local storage
  const saveOpenaiApiKey = async (key: string): Promise<void> => {
    try {
      // Validate the key format (a basic check)
      if (key && !key.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key format. API keys should start with "sk-"');
      }

      // Store the key
      localStorage.setItem('openai_api_key', key);
      setOpenaiApiKey(key);
    } catch (error) {
      console.error('Error saving OpenAI API key:', error);
      throw error;
    }
  };

  return (
    <APIKeysContext.Provider
      value={{
        openaiApiKey,
        setOpenaiApiKey,
        saveOpenaiApiKey,
      }}
    >
      {children}
    </APIKeysContext.Provider>
  );
};

export const useAPIKeys = () => {
  const context = useContext(APIKeysContext);
  if (context === undefined) {
    throw new Error('useAPIKeys must be used within an APIKeysProvider');
  }
  return context;
};
