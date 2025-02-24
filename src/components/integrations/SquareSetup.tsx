import React, { useEffect, useState } from 'react';
import { Button, Card, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
// Log the environment variable to debug
console.log('SQUARE_APP_ID from env:', import.meta.env.VITE_SQUARE_APP_ID);
const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APP_ID || 'sandbox-sq0idb-jMUbBRSYF2qho07MU3DHnA';
const SQUARE_OAUTH_URL = 'https://connect.squareup.com/oauth2/authorize';
// Log the final app ID being used
console.log('Final SQUARE_APP_ID:', SQUARE_APP_ID);
export function SquareSetup({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    // Handle OAuth callback
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const success = params.get('success');
    if (error) {
      setError(decodeURIComponent(error));
    } else if (success) {
      setSuccess(true);
    }
  }, [location]);
  const handleConnect = () => {
    if (!user) return;
// Generate state parameter with userId and redirect URL
    const redirectUrl = `${window.location.origin}/dashboard/integrations/square`;
    const state = `${user.uid}|${redirectUrl}`;

// Build OAuth URL with required parameters
    const params = new URLSearchParams({
      client_id: SQUARE_APP_ID,
      response_type: 'code',
      scope: 'ITEMS_READ INVENTORY_READ ORDERS_READ MERCHANT_PROFILE_READ',
      session: 'false',
      state,
    });

// Redirect to Square OAuth page
    const authUrl = `${SQUARE_OAUTH_URL}?${params.toString()}`;
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  };
  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="card card-hover max-w-md w-full relative bg-[#1C1B23] p-6 rounded-lg">
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <Card sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Connect Square Store
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              Connect your Square store to enable automatic inventory synchronization and sales analytics.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Successfully connected to Square! Your inventory data will begin syncing shortly.
                </Alert>
            )}

            <Button
                variant="contained"
                color="primary"
                onClick={handleConnect}
                disabled={success}
            >
              {success ? 'Connected' : 'Connect Square Store'}
            </Button>
          </Card>
        </div>
      </div>
  );
}