import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowRight, Store, Youtube, CheckCircle } from 'lucide-react';

export function ShopifySetup({ onClose }: { onClose: () => void }) {
  const [shopUrl, setShopUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to connect your store');
      console.error('No user found in auth context');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting Shopify store connection...');
      console.log('Current user ID:', user.uid);
      
      // Store Shopify credentials in Firebase
      const docRef = doc(db, 'shopify_credentials', user.uid);
      const data = {
        shopUrl: shopUrl.includes('.myshopify.com') ? shopUrl : `${shopUrl}.myshopify.com`,
        apiToken,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      console.log('Attempting to write to Firestore...');
      await setDoc(docRef, data);
      console.log('Successfully wrote to Firestore');

      // Test the connection
      console.log('Testing API connection...');
      const response = await fetch('/api/shopify/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'x-shop-domain': data.shopUrl,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.statusText}`);
      }

      console.log('API connection successful');
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error during setup:', err);
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
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Shop Connected!</h3>
              <p className="text-gray-400">Successfully connected to your Shopify store.</p>
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
            <Store className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connect Your Shopify Store
          </h2>
          <p className="text-gray-400">
            Enter your Shopify store URL and Admin API token to get started
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
              Store URL
            </label>
            <input
              type="text"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              placeholder="your-store.myshopify.com"
              className="bg-[#1F1D2A] block w-full px-3 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Admin API Token
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="shpat_xxxxx"
              className="bg-[#1F1D2A] block w-full px-3 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <a
            href="https://www.youtube.com/watch?v=FQacvKAOWtc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Youtube className="w-4 h-4 mr-1" />
            Don't know how to create your Admin API?
          </a>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Connecting...' : 'Connect Store'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
