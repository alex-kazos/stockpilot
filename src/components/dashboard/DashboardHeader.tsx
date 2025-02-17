import React from 'react';
import { Store, Settings, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../LogoutButton';
import { ROUTES } from '../../constants/routes';
import { StoreSelector } from './StoreSelector';

interface DashboardHeaderProps {
  storeName: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  stores: Array<{
    id: string;
    name: string;
    type: 'shopify' | 'square';
  }>;
  currentStore: {
    id: string;
    name: string;
    type: 'shopify' | 'square';
  };
  onStoreChange: (storeId: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  storeName,
  onRefresh,
  isRefreshing,
  stores,
  currentStore,
  onStoreChange
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

      {/*<div className="text-gray-400 text-sm hidden sm:block">*/}
      {/*  Connected to: <span className="text-white">{storeName}</span>*/}
      {/*</div>*/}

      <div className="flex items-center gap-2 sm:gap-4">
        <StoreSelector
          currentStore={currentStore}
          stores={stores}
          onStoreChange={onStoreChange}
        />
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-[#1F1D2B] rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
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
