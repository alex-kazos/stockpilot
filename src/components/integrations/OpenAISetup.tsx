import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { openAIService } from '../../services/openAIService';

export function OpenAISetup({ onClose }: { onClose: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user already has an API key stored
    const checkExistingKey = async () => {
      if (!user) return;
      
      try {
        await openAIService.getAPIKey();
        setHasExistingKey(true);
      } catch (err) {
        // No existing key, that's fine
        setHasExistingKey(false);
      }
    };
    
    checkExistingKey();
  }, [user]);

  const handleVerifyKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const isValid = await openAIService.verifyAPIKey(apiKey);
      
      if (isValid) {
        setError(null);
        return true;
      } else {
        setError('Invalid API key. Please check and try again.');
        return false;
      }
    } catch (err) {
      setError('Failed to verify API key. Please try again.');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to save your API key');
      console.error('No user found in auth context');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Verifying OpenAI API key...');
      const isValid = await handleVerifyKey();
      
      if (!isValid) {
        return;
      }
      
      console.log('Saving OpenAI API key...');
      await openAIService.saveAPIKey(apiKey);
      
      console.log('API key saved successfully');
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error during setup:', err);
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card card-hover max-w-md w-full relative bg-[#1C1B23] p-6 rounded-lg">
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1C1B23] rounded-lg z-10">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">OpenAI API Key Saved!</h3>
              <p className="text-gray-400">Your API key has been securely stored.</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Connect OpenAI API</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-violet-900/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold">OpenAI API Key</h3>
              <p className="text-sm text-gray-400">
                {hasExistingKey 
                  ? 'You already have an API key stored. Enter a new one to update it.' 
                  : 'Enter your OpenAI API key to use with StockPilot AI.'}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                OpenAI API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={loading || verifying}
              />
              <p className="mt-1 text-xs text-gray-400">
                Your API key is stored securely and never shared.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={handleVerifyKey}
                disabled={loading || verifying || !apiKey.trim()}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify Key'}
              </button>
              
              <button
                type="submit"
                disabled={loading || verifying || !apiKey.trim()}
                className="flex-1 py-2 px-4 bg-violet-700 hover:bg-violet-800 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save API Key'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-sm text-gray-400 mt-6 border-t border-gray-800 pt-4">
          <p>Don't have an OpenAI API key?</p>
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-violet-500 hover:text-violet-400"
          >
            Get one from the OpenAI platform →
          </a>
        </div>
      </div>
    </div>
  );
}
