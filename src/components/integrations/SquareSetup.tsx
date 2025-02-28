import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowRight, Store, Youtube, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function SquareSetup({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the application ID from environment variables
  const appId = import.meta.env.VITE_SQUARE_APP_ID;
  const redirectUri = `${window.location.origin}/square-callback`;

  // Check for messages from the popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin is from our own domain
      if (event.origin !== window.location.origin) return;
      
      // Check if this is a Square OAuth callback
      if (event.data?.type === 'SQUARE_OAUTH_CALLBACK' && event.data?.code) {
        handleSquareCallback(event.data.code);
        
        // Close popup if it's still open
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [popupWindow]);
  
  // Poll for popup window closure
  useEffect(() => {
    if (!popupWindow) return;
    
    const checkPopup = setInterval(() => {
      if (popupWindow && popupWindow.closed) {
        clearInterval(checkPopup);
        setPopupWindow(null);
        if (loading) {
          setLoading(false);
          setError('Connection was cancelled');
        }
      }
    }, 500);
    
    return () => clearInterval(checkPopup);
  }, [popupWindow, loading]);

  const handleSquareCallback = async (code: string) => {
    if (!user) {
      setError('You must be logged in to connect your store');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Exchange authorization code for access token
      const response = await fetch('/.netlify/functions/square-proxy/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to obtain access token');
      }

      const data = await response.json();
      
      // Get merchant information
      const merchantResponse = await fetch('/.netlify/functions/square-proxy/locations', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!merchantResponse.ok) {
        throw new Error('Failed to fetch location information');
      }

      const locationData = await merchantResponse.json();
      
      // Store Square credentials in Firestore
      if (locationData.locations && locationData.locations.length > 0) {
        const location = locationData.locations[0];
        const merchantInfo = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          merchantId: data.merchant_id,
          locationId: location.id,
          storeName: location.name,
          expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
          connected: true
        };
        
        // Save to Firestore
        const integrationsRef = collection(db, 'users', user.uid, 'integrations');
        await setDoc(doc(integrationsRef, 'square'), merchantInfo);
        
        setStoreName(location.name);
        setShowSuccess(true);
        
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error('No locations found for this merchant');
      }
    } catch (err) {
      console.error('Square connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Square');
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuthFlow = () => {
    // Define popup settings
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    
    // OAuth URL for Square
    const squareAuthUrl = `https://connect.squareupsandbox.com/oauth2/authorize?client_id=${appId}&scope=MERCHANT_PROFILE_READ ITEMS_READ ITEMS_WRITE INVENTORY_READ INVENTORY_WRITE ORDERS_READ ORDERS_WRITE&session=false&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    // Open popup window
    const popup = window.open(squareAuthUrl, 'SquareOAuth', features);
    
    // Store reference to popup
    setPopupWindow(popup);
    
    if (!popup || popup.closed) {
      setError('Popup was blocked by your browser. Please allow popups for this site.');
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
              <p className="text-gray-400">Successfully connected to {storeName}</p>
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
            Connect to Square to sync your inventory and orders
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-300">
            Click the button below to connect your Square account. A popup window will open for you to authorize access to your store data.
          </p>

          <button
            onClick={initiateOAuthFlow}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Connecting...' : 'Connect with Square'}</span>
            {!loading && <ExternalLink className="w-4 h-4" />}
          </button>

          <a
            href="https://developer.squareup.com/docs/oauth-api/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Youtube className="w-4 h-4 mr-1" />
            Learn more about Square integration
          </a>
        </div>
      </div>
    </div>
  );
}