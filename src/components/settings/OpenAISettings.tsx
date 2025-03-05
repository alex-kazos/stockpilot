import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAPIKeys } from '../../contexts/APIKeysContext';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

export const OpenAISettings: React.FC = () => {
  const { openaiApiKey, saveOpenaiApiKey } = useAPIKeys();
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  useEffect(() => {
    // Set the input value from context
    if (openaiApiKey) {
      setApiKey(openaiApiKey);
    }
  }, [openaiApiKey]);

  const handleSaveKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      await saveOpenaiApiKey(apiKey);
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      await saveOpenaiApiKey('');
      setApiKey('');
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clear API key');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1A1B23] transition-all duration-200 ease-in-out">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center">
            OpenAI API Key
            <Tooltip title="Your API key is stored securely in your browser's local storage and never sent to our servers." arrow>
              <IconButton size="small" sx={{ color: 'gray', ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Enter your OpenAI API key to use your own account for AI features
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <TextField
            fullWidth
            label="OpenAI API Key"
            variant="outlined"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            placeholder="sk-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowApiKey}
                    edge="end"
                    sx={{ color: 'gray' }}
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2,
              bgcolor: '#1C1B23',
              border: '2px solid',
              borderColor: error ? 'error.main' : '#2A2D3E',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: error ? 'error.main' : '#2A2D3E',
                },
                '&:hover fieldset': {
                  borderColor: '#383B4D',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'gray',
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '&:hover': {
                bgcolor: '#1A1B23',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            error={!!error}
            helperText={error || (success ? 'API key saved successfully!' : '')}
            FormHelperTextProps={{
              sx: { color: error ? 'error.main' : success ? 'success.main' : 'inherit' }
            }}
          />
          
          <div className="flex space-x-4 mt-4">
            <Button 
              variant="contained" 
              onClick={handleSaveKey}
              disabled={isLoading}
              sx={{
                bgcolor: '#4F46E5',
                '&:hover': {
                  bgcolor: '#4338CA',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleClearKey}
              disabled={isLoading || !apiKey}
              sx={{
                borderColor: '#4F46E5',
                color: '#4F46E5',
                '&:hover': {
                  borderColor: '#4338CA',
                  color: '#4338CA',
                  bgcolor: 'rgba(79, 70, 229, 0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Clear API Key
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p>This API key will be used for all AI features in StockPilot, including the AI assistant and any other OpenAI-powered features.</p>
          <p className="mt-2">Don't have an API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Get one from OpenAI</a></p>
        </div>
      </div>
    </div>
  );
};
