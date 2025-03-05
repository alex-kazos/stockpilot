import axios, { AxiosInstance } from 'axios';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ShopifyProduct, ShopifyOrder, ShopifyCustomer } from '../types/shopify';
import { getAuth } from 'firebase/auth';
import { logger } from '../utils/logger';

interface ShopifyCredentials {
  apiToken: string;
  shopUrl: string;
  userId: string;
  createdAt: string;
  storeId: string;
  isActive: boolean;
}

interface ShopifyResponse<T> {
  products?: T[];
  orders?: T[];
  customers?: T[];
  pageInfo?: {
    hasNextPage: boolean;
    endCursor: string;
  };
}

interface QueryParams {
  limit?: number;
  pageInfo?: string;
}

interface PaginationInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

class ShopifyService {
  private static instance: ShopifyService;
  private credentials: ShopifyCredentials | null = null;
  private readonly fileName = 'shopifyService.ts';
  private readonly shopifyApiVersion = '2024-04';

  private constructor() {
    logger.info('ShopifyService', 'Initializing service - direct API mode', {
      fileName: this.fileName
    });
  }

  static getInstance(): ShopifyService {
    if (!ShopifyService.instance) {
      ShopifyService.instance = new ShopifyService();
    }
    return ShopifyService.instance;
  }

  /**
   * Invalidates the cached credentials, forcing a refresh on the next API call.
   * This should be called whenever the user switches active stores.
   */
  public invalidateCache(): void {
    logger.debug('ShopifyService', 'Invalidating credentials cache', {
      fileName: this.fileName
    });
    this.credentials = null;
  }

  private async getCredentials(): Promise<ShopifyCredentials> {
    if (this.credentials) {
      logger.debug('ShopifyService', 'Using cached credentials', {
        fileName: this.fileName,
        shopUrl: this.credentials.shopUrl
      });
      return this.credentials;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      logger.error('ShopifyService', 'User not authenticated', { fileName: this.fileName });
      throw new Error('User not authenticated');
    }

    logger.debug('ShopifyService', 'Fetching Shopify credentials', {
      fileName: this.fileName,
      userId: user.uid
    });

    const db = getFirestore();
    
    // Get active store from the stores subcollection
    try {
      const storesRef = collection(db, 'users', user.uid, 'stores');
      const activeStoreQuery = query(storesRef, where('isActive', '==', true), limit(1));
      const activeStoreSnapshot = await getDocs(activeStoreQuery);
      
      if (!activeStoreSnapshot.empty) {
        const storeDoc = activeStoreSnapshot.docs[0];
        const storeData = storeDoc.data() as ShopifyCredentials;
        
        if (storeData.apiToken && storeData.shopUrl) {
          storeData.shopUrl = storeData.shopUrl.replace(/^https?:\/\//, '');
          storeData.storeId = storeDoc.id;
          
          this.credentials = storeData;
          
          logger.success('ShopifyService', 'Successfully loaded active Shopify store credentials', {
            fileName: this.fileName,
            userId: user.uid,
            shopUrl: storeData.shopUrl,
            storeId: storeData.storeId
          });
          
          return storeData;
        }
      }
      
      // If no active store is found
      logger.error('ShopifyService', 'No active Shopify store found', {
        fileName: this.fileName,
        userId: user.uid
      });
      throw new Error('No active Shopify store found');
    } catch (error) {
      logger.error('ShopifyService', 'Error fetching Shopify credentials', {
        fileName: this.fileName,
        error: (error as Error).message
      });
      throw new Error('Failed to fetch Shopify credentials: ' + (error as Error).message);
    }
  }

  private createShopifyClient(token: string, shopUrl: string, storeId?: string) {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    logger.debug('ShopifyService', 'Creating Shopify client', {
      fileName: this.fileName,
      userId,
      storeId: storeId || 'legacy'
    });
    
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'accept': 'application/json',
      'x-shopify-access-token': token,
      'x-user-id': userId,
      'x-shop-domain': shopUrl
    };
    
    // Add storeId header if available
    if (storeId) {
      headers['x-store-id'] = storeId;
    }
    
    return axios.create({
      baseURL: '/api/shopify',
      headers,
      timeout: 30000,
      validateStatus: (status) => {
        return status >= 200 && status < 300 && status !== 303;
      }
    });
  }

  private async testConnection(client: any): Promise<void> {
    try {
      const response = await client.get('/admin/api/2024-04/orders.json', {
        params: {
          limit: 1,
          status: 'any'
        }
      });
      
      logger.debug('ShopifyService', 'Connection test successful', {
        fileName: this.fileName,
        status: response.status,
        limit: response.headers['x-shopify-shop-api-call-limit']
      });
    } catch (error) {
      const axiosError = error as any;
      logger.error('ShopifyService', 'Connection test failed', {
        fileName: this.fileName,
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        responseData: axiosError.response?.data,
        headers: axiosError.response?.headers,
        url: axiosError.config?.url
      });
      
      if (axiosError.response?.status === 303) {
        throw new Error('Authentication required. Please check your Shopify access token.');
      } else if (axiosError.response?.status === 403) {
        throw new Error('Access forbidden. Please check your Shopify API credentials and permissions.');
      } else if (axiosError.response?.status === 401) {
        throw new Error('Invalid API credentials. Please check your access token.');
      } else if (axiosError.response?.status === 404) {
        throw new Error('Shop not found. Please check your shop URL.');
      }
      
      throw new Error('Failed to connect to Shopify. Please check your credentials.');
    }
  }

  private parsePaginationHeaders(linkHeader?: string): PaginationInfo {
    if (!linkHeader) {
      return { hasNextPage: false, endCursor: null };
    }

    const links = linkHeader.split(',');
    const nextLink = links.find(link => link.includes('rel="next"'));

    if (!nextLink) {
      return { hasNextPage: false, endCursor: null };
    }

    const pageInfoMatch = nextLink.match(/page_info=([^>&"]+)/);
    return {
      hasNextPage: true,
      endCursor: pageInfoMatch ? pageInfoMatch[1] : null
    };
  }

  private async getAllPages<T>(client: AxiosInstance, endpoint: string, dataKey: string): Promise<T[]> {
    let allItems: T[] = [];
    let hasNextPage = true;
    let nextPageInfo = '';
    const limit = 250; // Shopify's maximum limit per page

    while (hasNextPage) {
      try {
        const queryParams = new URLSearchParams({
          limit: limit.toString()
        });

        if (nextPageInfo) {
          queryParams.append('page_info', nextPageInfo);
        }

        const url = `${endpoint}?${queryParams.toString()}`;
        
        logger.debug('ShopifyService', 'Fetching page', {
          fileName: this.fileName,
          url,
          currentCount: allItems.length
        });

        const response = await client.get(url);
        const items = response.data[dataKey] || [];
        allItems = [...allItems, ...items];

        // Parse Link header for pagination
        const linkHeader = response.headers['link'];
        const paginationInfo = this.parsePaginationHeaders(linkHeader);
        
        hasNextPage = paginationInfo.hasNextPage;
        nextPageInfo = paginationInfo.endCursor || '';

        logger.debug('ShopifyService', `Fetched page of ${dataKey}`, {
          fileName: this.fileName,
          pageItemCount: items.length,
          totalCount: allItems.length,
          hasNextPage,
          rateLimit: response.headers['x-shopify-shop-api-call-limit']
        });

        // Add a small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        logger.error('ShopifyService', `Error fetching ${dataKey} page`, {
          fileName: this.fileName,
          error: error.message,
          status: error.response?.status,
          currentCount: allItems.length
        });
        throw error;
      }
    }

    return allItems;
  }

  async getProducts(params: QueryParams = {}): Promise<ShopifyProduct[]> {
    try {
      logger.debug('ShopifyService', 'Fetching all products', {
        fileName: this.fileName,
        params
      });

      const { apiToken, shopUrl, storeId } = await this.getCredentials();
      const client = this.createShopifyClient(apiToken, shopUrl, storeId);

      // Get all pages of products using the admin API endpoint
      const allProducts = await this.getAllPages<ShopifyProduct>(
        client, 
        `/admin/api/${this.shopifyApiVersion}/products`,
        'products'
      );
      
      logger.success('ShopifyService', 'All products fetched successfully', {
        fileName: this.fileName,
        count: allProducts.length
      });

      return allProducts;
    } catch (error: any) {
      logger.error('ShopifyService', 'Failed to fetch products', {
        fileName: this.fileName,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        responseData: error.response?.data
      });
      throw new Error(`Shopify API Error: ${error.message}`);
    }
  }

  async getOrders(params: QueryParams = {}): Promise<ShopifyOrder[]> {
    try {
      logger.debug('ShopifyService', 'Fetching all orders', {
        fileName: this.fileName,
        params
      });

      const { apiToken, shopUrl, storeId } = await this.getCredentials();
      const client = this.createShopifyClient(apiToken, shopUrl, storeId);

      // Get all pages of orders using the admin API endpoint
      const allOrders = await this.getAllPages<ShopifyOrder>(
        client, 
        `/admin/api/${this.shopifyApiVersion}/orders`,
        'orders'
      );
      
      logger.success('ShopifyService', 'All orders fetched successfully', {
        fileName: this.fileName,
        count: allOrders.length
      });

      return allOrders;
    } catch (error: any) {
      logger.error('ShopifyService', 'Failed to fetch orders', {
        fileName: this.fileName,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        responseData: error.response?.data
      });
      throw new Error(`Shopify API Error: ${error.message}`);
    }
  }

  async getCustomers(params: QueryParams = {}): Promise<ShopifyCustomer[]> {
    try {
      logger.info('ShopifyService', 'Starting customers fetch', { fileName: this.fileName });
      const { apiToken, shopUrl, storeId } = await this.getCredentials();
      const client = this.createShopifyClient(apiToken, shopUrl, storeId);

      // Get all pages of customers using the admin API endpoint
      const allCustomers = await this.getAllPages<ShopifyCustomer>(
        client,
        `/admin/api/${this.shopifyApiVersion}/customers`,
        'customers'
      );

      logger.success('ShopifyService', 'Successfully fetched all customers', {
        fileName: this.fileName,
        totalCount: allCustomers.length,
        shopUrl
      });

      return allCustomers;
    } catch (error: unknown) {
      const axiosError = error as any;
      logger.error('ShopifyService', 'Failed to fetch customers', {
        fileName: this.fileName,
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        url: axiosError.config?.url,
        responseData: axiosError.response?.data
      });
      throw new Error(`Shopify API Error: ${axiosError.message}`);
    }
  }

  /**
   * Tests the connection to a specific Shopify store without affecting the current active connection.
   * @param apiToken The Shopify API token
   * @param shopUrl The Shopify store URL
   * @param storeId Optional store ID for multi-store setups
   * @returns A promise that resolves when the connection is successful, or rejects with an error
   */
  async testStoreConnection(apiToken: string, shopUrl: string, storeId?: string): Promise<void> {
    logger.debug('ShopifyService', 'Testing connection to specific store', {
      fileName: this.fileName,
      shopUrl,
      storeId: storeId || 'temporary'
    });
    
    shopUrl = shopUrl.replace(/^https?:\/\//, '');
    const client = this.createShopifyClient(apiToken, shopUrl, storeId);
    return this.testConnection(client);
  }
}

export const shopifyService = ShopifyService.getInstance();