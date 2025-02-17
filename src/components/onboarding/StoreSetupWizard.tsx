import React from 'react';
import { Store, Square } from 'lucide-react';
import { ShopifySetup } from '../integrations/ShopifySetup';
import { SquareSetup } from '../integrations/SquareSetup';

export function StoreSetupWizard() {
  const [selectedPlatform, setSelectedPlatform] = React.useState<'shopify' | 'square' | null>(null);

  if (selectedPlatform === 'shopify') {
    return <ShopifySetup onClose={() => setSelectedPlatform(null)} />;
  }

  if (selectedPlatform === 'square') {
    return <SquareSetup onClose={() => setSelectedPlatform(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#13111C] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Choose Your Store Platform
          </h1>
          <p className="text-gray-400">
            Select the platform you want to connect with your dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setSelectedPlatform('shopify')}
            className="p-6 bg-[#1C1B23] rounded-lg hover:bg-[#2D2B3B] transition-colors group"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                <Store className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Shopify</h3>
            <p className="text-gray-400 text-sm">
              Connect your Shopify store to manage inventory and track sales
            </p>
          </button>

          <button
            onClick={() => setSelectedPlatform('square')}
            className="p-6 bg-[#1C1B23] rounded-lg hover:bg-[#2D2B3B] transition-colors group"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                <Square className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Square</h3>
            <p className="text-gray-400 text-sm">
              Connect your Square store to manage inventory and track sales
            </p>
          </button>
        </div>
      </div>
    </div>
  );
} 