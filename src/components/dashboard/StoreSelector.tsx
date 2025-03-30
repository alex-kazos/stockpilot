import React, { useState } from 'react';
import { ChevronDown, Plus, Store } from 'lucide-react';
import { ShopifySetup } from '../integrations/ShopifySetup';

interface StoreSelectorProps {
  currentStore: {
    id: string;
    name: string;
    type: 'shopify';
  };
  stores: Array<{
    id: string;
    name: string;
    type: 'shopify';
  }>;
  onStoreChange: (storeId: string) => void;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  currentStore,
  stores,
  onStoreChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShopifySetup, setShowShopifySetup] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#1F1D2B] px-4 py-2 rounded-lg hover:bg-[#2D2B3B] transition-colors"
      >
        <Store className="w-5 h-5 text-indigo-400" />
        <span className="text-white">{currentStore.name}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-72 bg-[#1F1D2B] rounded-lg shadow-lg py-2 z-50">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => {
                onStoreChange(store.id);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-[#2D2B3B] transition-colors flex items-center space-x-2"
            >
              <Store className={`w-4 h-4 text-indigo-400`} />
              <span className="text-white">{store.name}</span>
            </button>
          ))}
          
          <div className="border-t border-gray-700 mt-2 pt-2">
            <button
              onClick={() => setShowShopifySetup(true)}
              className="w-full px-4 py-2 text-left hover:bg-[#2D2B3B] transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span className="text-white">Add Shopify Store</span>
            </button>
          </div>
        </div>
      )}

      {showShopifySetup && (
        <ShopifySetup onClose={() => setShowShopifySetup(false)} />
      )}
    </div>
  );
};