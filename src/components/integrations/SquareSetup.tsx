import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowRight, Store, Youtube, CheckCircle } from 'lucide-react';

export function SquareSetup({ onClose }: { onClose: () => void }) {
  const [accessToken, setAccessToken] = useState('');
  const [locationId, setLocationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to connect your store');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store Square credentials in Firebase
      const docRef = doc(db, 'square_credentials', user.uid);
      const data = {
        accessToken,
        locationId,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(docRef, data);

      // Test the connection
      const response = await fetch('/api/square/locations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.statusText}`);
      }

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
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
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <CheckCircle className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Store Connected!</h3>
              <p className="text-gray-400">Successfully connected to your Square store.</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connect Your Square Store
          </h2>
          <p className="text-gray-400">
            Enter your Square access token and location ID to get started
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="sq0atp-..."
              className="bg-[#1F1D2A] block w-full px-3 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Location ID
            </label>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              placeholder="XXXXXXXXXXXXXX"
              className="bg-[#1F1D2A] block w-full px-3 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <a
            href="https://developer.squareup.com/docs/square-get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Youtube className="w-4 h-4 mr-1" />
            How to get your Square credentials?
          </a>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Connecting...' : 'Connect Store'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
} 