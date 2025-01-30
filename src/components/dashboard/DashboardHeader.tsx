import React from 'react';
import { Store, Settings, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../LogoutButton';
import { ROUTES } from '../../constants/routes';

interface DashboardHeaderProps {
  storeName: string;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  storeName, 
  onRefresh,
  isRefreshing = false 
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-3 sm:p-4 mb-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="p-2 bg-[#1C1B23] border-2 border-gray-800 rounded-lg text-gray-400 hover:bg-[#1A1B23] transition-all duration-200 ease-in-out"
        >
          <Store className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white">StockPilot</h1>
      </div>

      <div className="text-gray-400 text-sm hidden sm:block">
        Connected to: <span className="text-white">{storeName}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg hover:bg-gray-700 transition-colors ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Refresh data"
          >
            <RefreshCw 
              className={`w-5 h-5 text-gray-400 ${
                isRefreshing ? 'animate-spin' : ''
              }`} 
            />
          </button>
        )}
        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
        <LogoutButton />
      </div>
    </div>
  );
};
