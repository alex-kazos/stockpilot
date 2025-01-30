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

      const promises: Promise<void>[] = [];

      if (options.fetchProducts) {
        const cachedProducts = cacheService.getData<ShopifyProduct>(user.uid, 'products');
        if (cachedProducts) {
          setProducts(cachedProducts);
          logger.debug('useShopifyData', 'Using cached products', {
            count: cachedProducts.length,
            userId: user.uid
          });
        } else {
          promises.push(
            shopifyService.getProducts()
              .then(data => {
                setProducts(data);
                cacheService.setData(user.uid, 'products', data);
              })
          );
        }
      }

      if (options.fetchOrders) {
        const cachedOrders = cacheService.getData<ShopifyOrder>(user.uid, 'orders');
        if (cachedOrders) {
          setOrders(cachedOrders);
          logger.debug('useShopifyData', 'Using cached orders', {
            count: cachedOrders.length,
            userId: user.uid
          });
        } else {
          promises.push(
            shopifyService.getOrders()
              .then(data => {
                setOrders(data);
                cacheService.setData(user.uid, 'orders', data);
              })
          );
        }
      }

      if (options.fetchCustomers) {
        const cachedCustomers = cacheService.getData<ShopifyCustomer>(user.uid, 'customers');
        if (cachedCustomers) {
          setCustomers(cachedCustomers);
          logger.debug('useShopifyData', 'Using cached customers', {
            count: cachedCustomers.length,
            userId: user.uid
          });
        } else {
          promises.push(
            shopifyService.getCustomers()
              .then(data => {
                setCustomers(data);
                cacheService.setData(user.uid, 'customers', data);
              })
          );
        }
      }

      await Promise.all(promises);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Shopify data';
      setError(errorMessage);
      logger.error('useShopifyData', 'Error fetching data', {
        error: errorMessage,
        userId: user.uid
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid, options.fetchProducts, options.fetchOrders, options.fetchCustomers]);

  const refetch = async () => {
    if (user?.uid) {
      cacheService.clearCache(user.uid);
      await fetchData();
    }
  };

  return { products, orders, customers, loading, error, refetch };
};