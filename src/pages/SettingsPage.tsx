import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Store } from 'lucide-react';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { EmailSettings } from '../components/settings/EmailSettings';
import { OpenAISettings } from '../components/settings/OpenAISettings';
import { SubscriptionSettings } from '../components/settings/SubscriptionSettings';
import { ROUTES } from '../constants/routes';
import LogoutButton from '../components/LogoutButton';

/**
 * SettingsPage component
 * 
 * This component renders the settings page of the application.
 * It contains links to all the different settings categories.
 */
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#13111c] p-3 sm:p-4 md:p-6">
      <Container maxWidth="lg">
        <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 hover:bg-[#1A1B23] transition-all duration-200 ease-in-out">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="p-1.5 sm:p-2 bg-[#1C1B23] border-2 border-gray-800 rounded-lg text-gray-400 hover:bg-[#1A1B23] transition-all duration-200 ease-in-out"
              >
                <ArrowBackIcon />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Store className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
                <h1 className="text-xl sm:text-2xl font-bold text-white">StockPilot</h1>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <ProfileSettings />
          <EmailSettings />
          <OpenAISettings />
        </div>
      </Container>
    </div>
  );
};

export default SettingsPage;