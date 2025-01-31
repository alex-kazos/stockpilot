import { useState, useEffect } from 'react';
import { shopifyService } from '../services/shopifyService';
import { cacheService } from '../services/cacheService';
import { ShopifyProduct, ShopifyOrder, ShopifyCustomer } from '../types/shopify';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface UseShopifyDataOptions {
  fetchProducts?: boolean;
  fetchOrders?: boolean;
  fetchCustomers?: boolean;
}

interface UseShopifyDataReturn {
  products: ShopifyProduct[];
  orders: ShopifyOrder[];
  customers: ShopifyCustomer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useShopifyData = (options: UseShopifyDataOptions = {}): UseShopifyDataReturn => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [customers, setCustomers] = useState<ShopifyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug('useShopifyData', 'Starting data fetch', {
        userId: user.uid,
        options
      });

      const promises: Promise<void>[] = [];

      if (options.fetchProducts !== false) {  // Default to true if not specified
        logger.debug('useShopifyData', 'Fetching products', { userId: user.uid });
        promises.push(
          shopifyService.getProducts()
            .then(data => {
              logger.debug('useShopifyData', 'Products fetched successfully', {
                count: data.length,
                userId: user.uid,
                firstProduct: data[0]?.id
              });
              setProducts(data);
              cacheService.setData(user.uid, 'products', data);
            })
        );
      }

      if (options.fetchOrders !== false) {  // Default to true if not specified
        logger.debug('useShopifyData', 'Fetching orders', { userId: user.uid });
        promises.push(
          shopifyService.getOrders()
            .then(data => {
              logger.debug('useShopifyData', 'Orders fetched successfully', {
                count: data.length,
                userId: user.uid,
                firstOrder: data[0]?.id
              });
              setOrders(data);
              cacheService.setData(user.uid, 'orders', data);
            })
        );
      }

      await Promise.all(promises);
      logger.debug('useShopifyData', 'All data fetched successfully', {
        userId: user.uid,
        productsCount: products.length,
        ordersCount: orders.length
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Error fetching data';
      logger.error('useShopifyData', 'Error fetching data', {
        error: errorMessage,
        userId: user.uid
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid, options.fetchProducts, options.fetchOrders]);

  const refetch = async () => {
    await fetchData();
  };

  return {
    products,
    orders,
    customers,
    loading,
    error,
    refetch
  };
};