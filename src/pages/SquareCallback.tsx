import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SquareCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get the authorization code from URL
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');
    
    // Send a message to the opener (parent) window
    if (window.opener) {
      if (code) {
        // Send success message with the code
        window.opener.postMessage({
          type: 'SQUARE_OAUTH_CALLBACK',
          code
        }, window.location.origin);
      } else if (error) {
        // Send error message
        window.opener.postMessage({
          type: 'SQUARE_OAUTH_ERROR',
          error
        }, window.location.origin);
      }
      
      // Close this window after a short delay to ensure message is received
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // If opened directly (not as popup), redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121118]">
      <div className="card p-8 bg-[#1C1B23] rounded-lg shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <h2 className="text-xl font-semibold text-white">Connecting to Square...</h2>
          <p className="text-gray-400 text-center">
            Please wait while we complete the connection process.
          </p>
        </div>
      </div>
    </div>
  );
}
