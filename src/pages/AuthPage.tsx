import React, { useState } from 'react';
import { Store, Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleButton } from '../components/auth/GoogleButton';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTrial = searchParams.get('trial') === 'true';
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Handle authentication
      let authUserId;
      if (isSignUp) {
        authUserId = await signUp(email, password);
      } else {
        authUserId = await signIn(email, password);
      }
      setUserId(authUserId);

      // Check for Shopify credentials
      const db = getFirestore();
      const credentialsRef = doc(db, 'shopify_credentials', authUserId);
      const credentialsDoc = await getDoc(credentialsRef);

      if (!credentialsDoc.exists()) {
        // Show credentials wizard if no credentials exist
        setShowCredentialsModal(true);
        setLoading(false);
        return;
      }

      // If credentials exist, proceed to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (credentials: { shopName: string; accessToken: string }) => {
    if (!userId) return;

    try {
      setLoading(true);
      const db = getFirestore();
      const credentialsRef = doc(db, 'shopify_credentials', userId);
      await setDoc(credentialsRef, {
        ...credentials,
        createdAt: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    navigate('/demo');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-[#13111c] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-[#1C1A27] p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <Store className="w-12 h-12 text-indigo-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          {isTrial && (
            <p className="mt-2 text-center text-sm text-gray-400">
              Start your 14-day free trial
            </p>
          )}
        </div>

        {showCredentialsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-[#1F1D2B] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-white mb-4">Shopify Credentials Required</h2>
              <p className="text-gray-400 mb-4">Please set up your Shopify credentials in the settings page to continue.</p>
              <button
                onClick={() => navigate('/settings')}
                className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
              >
                Go to Settings
              </button>
            </div>
          </div>
        )}

        <div className="card card-hover">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-[#1F1D2A] block w-full pl-10 pr-3 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#1F1D2A] block w-full pl-10 pr-3 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#1F1D2A] block w-full pl-10 pr-10 py-2 border border-[#2D2B3B] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2D2B3B]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1C1A27] text-gray-400">or</span>
              </div>
            </div>

            <GoogleButton />
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-400 hover:text-indigo-500 text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}