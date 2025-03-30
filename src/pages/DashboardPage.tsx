/**
 * DashboardPage Component
 * 
 * Main dashboard interface for the StockPilot application that displays various
 * analytics, inventory data, and AI-powered recommendations for store management.
 * Integrates with Shopify to fetch and display store data.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShopifyData } from '../hooks/useShopifyData';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreSetupWizard } from '../components/onboarding/StoreSetupWizard';
import { logger } from '../utils/logger';
import { LoadingState } from '../components/shared/LoadingState';
import { ErrorState } from '../components/shared/ErrorState';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { AIAssistantButton } from '../components/assistant/AIAssistantButton';
import { AIAssistantPanel } from '../components/assistant/AIAssistantPanel';
import { AIAssistantProvider } from '../contexts/AIAssistantContext';
import { mergeProductsBySku, transformForRecommendations } from '../utils/productMerger';

// Define store interface for different platform integrations
interface Store {
  id: string;
  name: string;
  type: 'shopify' | 'square';
  isActive?: boolean;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // Store state management
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [storesLoaded, setStoresLoaded] = useState(false);
  
  // UI state management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Shopify credentials and data loading
  const { 
    products, 
    orders, 
    loading: dataLoading, 
    error: dataError,
    refetch 
  } = useShopifyData({
    fetchProducts: currentStore?.type === 'shopify',
    fetchOrders: currentStore?.type === 'shopify'
  });

  useEffect(() => {
    const fetchStores = async () => {
      if (!user) return;

      try {
        const shopifyStoresRef = collection(db, 'users', user.uid, 'stores');
        const shopifyStoresDocs = await getDocs(shopifyStoresRef);
        const shopifyStores = shopifyStoresDocs.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.shopUrl,
            type: 'shopify' as const,
            isActive: data.isActive
          };
        });

        const squareStores: Store[] = []; 

        const allStores = [...shopifyStores, ...squareStores];
        setStores(allStores);

        if (allStores.length > 0 && !currentStore) {
          setCurrentStore(allStores[0]);
        }
      } catch (error) {
        logger.error('DashboardPage', 'Error fetching stores', { error });
      } finally {
        setStoresLoaded(true);
      }
    };

    fetchStores();
  }, [user]);

  useEffect(() => {
    if (stores.length > 0) {
      const activeStore = stores.find(store => store.isActive) || stores[0];
      setCurrentStore(activeStore);
      
      logger.info('DashboardPage', 'Set current store', {
        storeId: activeStore.id,
        storeName: activeStore.name,
        isActive: activeStore.isActive
      });
    }
  }, [stores]);

  const dashboardProducts = useMemo(() => {
    if (!products?.length) return [];

    return products.map(product => ({
      id: product.id?.toString() || '',
      name: product.title || 'Untitled Product',
      sku: product.variants?.[0]?.sku || product.id?.toString() || '',
      stock: Number(product.variants?.[0]?.inventory_quantity) || 0,
      product_type: product.product_type || 'Uncategorized',
      sales: 0,
      revenue: 0,
      variants: product.variants || [],
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString(),
      status: 'active',
      vendor: product.vendor || '',
      price: product.variants?.[0]?.price || '0',
      compare_at_price: product.variants?.[0]?.compare_at_price || '0'
    }));
  }, [products]);

  const transformedProducts = useMemo(() => {
    logger.debug('DashboardPage', 'Preparing AI recommendations', {
      hasProducts: !!products?.length,
      productsCount: products?.length || 0,
      hasOrders: !!orders?.length,
      ordersCount: orders?.length || 0,
      fileName: 'DashboardPage.tsx'
    });

    if (!products?.length || !orders?.length) return [];
    
    try {
      const mergedProducts = mergeProductsBySku(products, orders);

      logger.debug('DashboardPage', 'Products merged for AI', {
        mergedCount: mergedProducts.length,
        firstMerged: mergedProducts[0]
      });

      const transformed = transformForRecommendations(mergedProducts);

      logger.debug('DashboardPage', 'Products transformed for AI', {
        transformedCount: transformed.length,
        firstTransformed: transformed[0]
      });

      return transformed;
    } catch (error) {
      logger.error('DashboardPage', 'Error transforming products for AI', { error });
      return [];
    }
  }, [products, orders]);

  const isLoading = dataLoading || !storesLoaded;
  
  if (isLoading) {
    let loadingMessage = "Loading dashboard data...";
    
    if (!storesLoaded) {
      loadingMessage = "Checking connected stores...";
    } else if (dataLoading) {
      loadingMessage = "Loading inventory data...";
    }
    
    return <LoadingState message={loadingMessage} />;
  }

  if (storesLoaded && stores.length === 0) {
    return <StoreSetupWizard />;
  }

  if (dataError) {
    return <ErrorState error={dataError} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-[#13111c] text-white p-3 sm:p-4 md:p-6">
      <DashboardHeader 
        storeName={currentStore?.name || 'No store selected'} 
        onRefresh={async () => {
          setIsRefreshing(true);
          await refetch();
          setIsRefreshing(false);
        }}
        isRefreshing={isRefreshing || dataLoading}
        stores={stores}
        currentStore={currentStore || {
          id: '',
          name: 'No store selected',
          type: 'shopify'
        }}
        onStoreChange={(storeId) => {
          const store = stores.find(s => s.id === storeId);
          if (store) {
            setCurrentStore(store);
          }
        }}
      />
      
      <DashboardGrid 
        products={dashboardProducts} 
        orders={orders || []} 
        transformedProducts={transformedProducts}
      />

      <AIAssistantProvider products={dashboardProducts} orders={orders || []}>
        <AIAssistantButton
          isOpen={isAssistantOpen}
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          products={dashboardProducts}
          orders={orders || []}
        />
        
        <AIAssistantPanel
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          products={dashboardProducts}
          orders={orders || []}
        />
      </AIAssistantProvider>
    </div>
  );
};
