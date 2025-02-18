/**
 * DashboardPage Component
 * 
 * Main dashboard interface for the StockPilot application that displays various
 * analytics, inventory data, and AI-powered recommendations for store management.
 * Integrates with Shopify to fetch and display store data.
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShopifyData } from '../hooks/useShopifyData';
import { useShopifyCredentials } from '../hooks/useShopifyCredentials';
import { logger } from '../utils/logger';
import { mergeProductsBySku, transformForRecommendations } from '../utils/productMerger';
import { ShopifySetup } from '../components/integrations/ShopifySetup';
import { MetricCards } from '../components/analytics/MetricCards';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { LoadingState } from '../components/shared/LoadingState';
import { ErrorState } from '../components/shared/ErrorState';
import { subscriptionService } from '../services/subscriptionService';
import { SUBSCRIPTION_URLS } from '../services/subscriptionService';
import { AIAssistantButton } from '../components/assistant/AIAssistantButton';
import { AIAssistantPanel } from '../components/assistant/AIAssistantPanel';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreSetupWizard } from '../components/onboarding/StoreSetupWizard';
import { AIAssistantProvider } from '../contexts/AIAssistantContext';

interface Store {
  id: string;
  name: string;
  type: 'shopify' | 'square';
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { credentials, loading: credentialsLoading } = useShopifyCredentials();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.email) {
        const sub = await subscriptionService.getUserSubscription(user.email);
        setSubscription(sub);
      }
      setSubscriptionLoading(false);
    };
    checkSubscription();
  }, [user]);

  // Fetch all stores for the current user
  useEffect(() => {
    const fetchStores = async () => {
      if (!user) return;

      try {
        // Fetch Shopify stores
        const shopifyQuery = query(
          collection(db, 'shopify_credentials'),
          where('userId', '==', user.uid)
        );
        const shopifyDocs = await getDocs(shopifyQuery);
        const shopifyStores = shopifyDocs.docs.map(doc => ({
          id: doc.id,
          name: doc.data().shopUrl,
          type: 'shopify' as const
        }));

        // Fetch Square stores
        const squareQuery = query(
          collection(db, 'square_credentials'),
          where('userId', '==', user.uid)
        );
        const squareDocs = await getDocs(squareQuery);
        const squareStores = squareDocs.docs.map(doc => ({
          id: doc.id,
          name: `Square Store ${doc.data().locationId}`,
          type: 'square' as const
        }));

        const allStores = [...shopifyStores, ...squareStores];
        setStores(allStores);

        // Set the first store as current if none is selected
        if (allStores.length > 0 && !currentStore) {
          setCurrentStore(allStores[0]);
        }
      } catch (error) {
        logger.error('DashboardPage', 'Error fetching stores', { error });
      }
    };

    fetchStores();
  }, [user]);

  // Transform Shopify products to dashboard format
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

  // Transform and memoize products data for AI recommendations
  const transformedProducts = useMemo(() => {
    logger.debug('DashboardPage', 'Preparing AI recommendations', {
      hasProducts: !!products?.length,
      productsCount: products?.length || 0,
      hasOrders: !!orders?.length,
      ordersCount: orders?.length || 0
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

  // Loading states
  const isLoading = dataLoading || subscriptionLoading;
  
  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  // Show setup wizard if no stores
  if (stores.length === 0) {
    return <StoreSetupWizard />;
  }

  // Show error state
  if (dataError) {
    return <ErrorState error={dataError} onRetry={refetch} />;
  }

  // Show subscription required state
  if (!subscriptionService.isSubscriptionActive(subscription)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-3 md:p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
          Subscription Required
        </h1>
        <p className="text-gray-400 text-center mb-4 sm:mb-6 px-2 sm:px-0">
          Please subscribe to access the dashboard and all features.
        </p>
        <a
          href={SUBSCRIPTION_URLS.UPGRADE}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Upgrade Now
        </a>
      </div>
    );
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
      
      <MetricCards products={products || []} orders={orders || []} />
      
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
