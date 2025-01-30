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

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { credentials, loading: credentialsLoading } = useShopifyCredentials();
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Add debug logging
  useEffect(() => {
    logger.debug('DashboardPage', 'Subscription and credentials state', {
      hasCredentials: !!credentials,
      subscriptionStatus: subscription?.status,
      isSubscriptionActive: subscriptionService.isSubscriptionActive(subscription),
      willFetchProducts: !!credentials && subscriptionService.isSubscriptionActive(subscription)
    });
  }, [credentials, subscription]);

  const { 
    products, 
    orders, 
    loading: dataLoading, 
    error: dataError,
    refetch 
  } = useShopifyData({
    fetchProducts: !!credentials, // Temporarily remove subscription check
    fetchOrders: !!credentials // Temporarily remove subscription check
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

  // Transform Shopify products to dashboard format
  const dashboardProducts = useMemo(() => {
    if (!products || !orders) return [];

    return products.map(product => {
      // Get all line items for this product
      const productLineItems = orders.flatMap(order => 
        order.line_items.filter(item => item.product_id === product.id)
      );

      // Calculate total sales quantity
      const totalSales = productLineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      // Calculate revenue
      const revenue = productLineItems.reduce((sum, item) => 
        sum + (parseFloat(item.price || '0') * (item.quantity || 0)), 0
      );

      return {
        id: product.id.toString(),
        name: product.title,
        sku: product.variants[0]?.sku || product.id.toString(),
        stock: product.variants[0]?.inventory_quantity || 0,
        product_type: product.product_type || 'Uncategorized',
        sales: totalSales,
        revenue: revenue,
        variants: product.variants,
        created_at: product.created_at,
        updated_at: product.updated_at,
        status: product.status,
        vendor: product.vendor,
        price: product.variants[0]?.price || '0',
        compare_at_price: product.variants[0]?.compare_at_price || '0'
      };
    });
  }, [products, orders]);

  // Transform and memoize products data for AI recommendations
  const transformedProducts = useMemo(() => {
    logger.debug('DashboardPage', 'Transforming products', {
      hasProducts: !!products,
      productsCount: products?.length,
      hasOrders: !!orders,
      ordersCount: orders?.length
    });

    if (!products || !orders) return [];
    
    try {
      const mergedProducts = mergeProductsBySku(products, orders);

      logger.debug('DashboardPage', 'Products merged', {
        mergedCount: mergedProducts.length,
        firstMerged: mergedProducts[0]
      });

      const transformed = transformForRecommendations(mergedProducts);

      logger.debug('DashboardPage', 'Products transformed', {
        transformedCount: transformed.length,
        firstTransformed: transformed[0]
      });

      return transformed;
    } catch (error) {
      logger.error('DashboardPage', 'Error transforming products', { error });
      return [];
    }
  }, [products, orders]);

  // Loading states
  const isLoading = credentialsLoading || dataLoading || subscriptionLoading;
  
  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  // Show error state
  if (dataError) {
    return <ErrorState error={dataError} onRetry={refetch} />;
  }

  // Show setup if no credentials
  if (!credentials) {
    return <ShopifySetup />;
  }

  if (!subscriptionService.isSubscriptionActive(subscription)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-3 md:p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Subscription Required</h1>
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
        storeName={credentials.shopUrl} 
        onRefresh={async () => {
          setIsRefreshing(true);
          await refetch();
          setIsRefreshing(false);
        }}
        isRefreshing={isRefreshing || dataLoading}
      />
      
      <MetricCards products={dashboardProducts} orders={orders || []} />
      
      <DashboardGrid 
        products={dashboardProducts} 
        orders={orders || []} 
        transformedProducts={transformedProducts}
      />

      <AIAssistantButton
        isOpen={isAssistantOpen}
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
      />
      
      <AIAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        products={dashboardProducts}
        orders={orders || []}
      />
    </div>
  );
};
