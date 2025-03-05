import React, { useState } from 'react';
import { Store } from 'lucide-react';
import { ShopifySetup } from '../integrations/ShopifySetup';

export function StoreSetupWizard() {
  const [showSetup, setShowSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupClick = () => {
    setIsLoading(true);
    setShowSetup(true);
  };

  if (showSetup) {
    return <ShopifySetup onClose={() => {
      setShowSetup(false);
      setIsLoading(false);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#13111C] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex p-4 bg-indigo-500/10 rounded-full mb-6">
          <Store className="w-10 h-10 text-indigo-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          Connect Your Shopify Store
        </h1>
        <p className="text-gray-400 mb-8">
          Get started by connecting your Shopify store to manage inventory and track sales
        </p>

        <button
          onClick={handleSetupClick}
          disabled={isLoading}
          className="w-full p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <Store className="w-5 h-5" />
              Connect Shopify Store
            </>
          )}
        </button>
      </div>
    </div>
  );
}