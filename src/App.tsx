/**
 * Main Application Component
 * 
 * Provides the core routing and authentication structure for the StockPilot application.
 * Implements protected routes and lazy loading for better performance.
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { APIKeysProvider } from './contexts/APIKeysContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { PrivateRoute } from './components/routing/PrivateRoute';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ROUTES } from './constants/routes';
import { darkTheme } from './theme/darkTheme';
import { MainPage } from './pages/MainPage'; // Make sure this import exists
import Header from './components/Header';
import Stats from './components/Stats';
import HowItWorks from './components/HowItWorks';
import Integrations from './components/Integrations';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import Pricing from './components/Pricing';
import SocialProof from './components/SocialProof';

/**
 * AppRoutes Component
 * 
 * Defines the application's routing structure.
 * Wrapped in Suspense for lazy loading support.
 */
const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={
          <main className="min-h-screen bg-[#1E1E2D] relative overflow-x-hidden">
            {/* Universal Background with Gradient and Mesh */}
            <div className="fixed inset-0 pointer-events-none">
              {/* Base gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-emerald-500/5 to-purple-500/5" />
              
              {/* Mesh overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E1E2D_1px,transparent_1px),linear-gradient(to_bottom,#1E1E2D_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />

              {/* Animated gradients */}
              <div className="absolute top-0 -left-[1000px] w-[2000px] h-[2000px] bg-gradient-to-br from-indigo-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl animate-pulse transform -translate-y-[1000px]" />
              <div className="absolute bottom-0 -right-[1000px] w-[2000px] h-[2000px] bg-gradient-to-tl from-purple-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl animate-pulse-delayed transform translate-y-[1000px]" />
            </div>

            {/* Content */}
            <div className="relative space-y-8">
              <Header />
              <Dashboard />
              <SocialProof />
              <HowItWorks />
              {/*<Pricing />*/}
              <Integrations />
              <Footer />
            </div>
          </main>
        } />

        {/* Authentication page */}
        <Route path={ROUTES.AUTH} element={<AuthPage />} />
        
        {/* Protected dashboard route */}
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            <PrivateRoute>
                <DashboardPage />
            </PrivateRoute>
          } 
        />
        
        {/* Protected settings route */}
        <Route 
          path={ROUTES.SETTINGS} 
          element={
            <PrivateRoute>
                <SettingsPage />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
};

/**
 * Root App Component
 * 
 * Wraps the entire application with necessary providers:
 * - Router: For client-side routing
 * - AuthProvider: For authentication state management
 * - APIKeysProvider: For managing API keys including OpenAI
 * - ThemeProvider: For Material UI theme management
 */
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <APIKeysProvider>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <AppRoutes />
          </ThemeProvider>
        </APIKeysProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;