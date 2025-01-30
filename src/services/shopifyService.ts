import axios from 'axios';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { ShopifyProduct, ShopifyOrder, ShopifyCustomer } from '../types/shopify';
import { getAuth } from 'firebase/auth';
import { logger } from '../utils/logger';

interface ShopifyCredentials {
  apiToken: string;
  shopUrl: string;
  userId: string;
  createdAt: string;
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
    const credentialsDoc = await getDoc(doc(db, 'shopify_credentials', user.uid));
    
    if (!credentialsDoc.exists()) {
      logger.error('ShopifyService', 'Shopify credentials not found', {
        fileName: this.fileName,
        userId: user.uid
      });
      throw new Error('Shopify credentials not found in Firebase');
    }

    const data = credentialsDoc.data() as ShopifyCredentials;
    
    if (!data.apiToken || !data.shopUrl) {
      logger.error('ShopifyService', 'Invalid Shopify credentials', {
        fileName: this.fileName,
        userId: user.uid,
        hasToken: !!data.apiToken,
        hasShopUrl: !!data.shopUrl
      });
      throw new Error('Invalid Shopify credentials');
    }

    data.shopUrl = data.shopUrl.replace(/^https?:\/\//, '');
    
    this.credentials = data;

    logger.success('ShopifyService', 'Successfully loaded Shopify credentials', {
      fileName: this.fileName,
      userId: user.uid,
      shopUrl: data.shopUrl
    });

    return data;
  }

  private createShopifyClient(token: string, shopUrl: string) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    return axios.create({
      baseURL: `${baseURL}/api/shopify`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Access-Token': token
      },
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

  private parsePaginationHeaders(linkHeader?: string): { hasNextPage: boolean; endCursor: string | null } {
    if (!linkHeader) {
      return { hasNextPage: false, endCursor: null };
    }

    const pageInfoMatch = linkHeader.match(/page_info=([^>&"]+)/);
    if (pageInfoMatch && pageInfoMatch[1]) {
      try {
        return { hasNextPage: true, endCursor: pageInfoMatch[1] };
      } catch (error) {
        logger.error('ShopifyService', 'Failed to parse pagination token', { error });
      }
    }

    return { hasNextPage: false, endCursor: null };
  }

  async getProducts(params: QueryParams = {}): Promise<ShopifyProduct[]> {
    try {
      const { apiToken, shopUrl } = await this.getCredentials();
      
      // Log credentials
      logger.debug('ShopifyService', 'Using credentials for products request:', {
        hasToken: !!apiToken,
        shopUrl,
        fileName: this.fileName
      });

      const client = this.createShopifyClient(apiToken, shopUrl);
      
      await this.testConnection(client);

      // Use a higher limit to get all products at once
      const queryParams: Record<string, string> = {
        limit: '250', // Maximum allowed by Shopify
        status: 'active', // Only get active products
        fields: 'id,title,variants,product_type,created_at,updated_at'
      };

      // Log request details
      logger.debug('ShopifyService', 'Making products request:', {
        endpoint: `/admin/api/${this.shopifyApiVersion}/products.json`,
        params: queryParams,
        fileName: this.fileName
      });

      // Try to fetch products from admin API
      const response = await client.get(`/admin/api/${this.shopifyApiVersion}/products.json`, {
        params: queryParams,
        headers: {
          'X-Shopify-Access-Scope': 'read_products,read_orders,read_inventory',
        }
      });

      // Log raw response
      logger.debug('ShopifyService', 'Raw products response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data),
        responseData: response.data,
        headers: response.headers,
        fileName: this.fileName
      });

      const products = response.data.products;
      if (!Array.isArray(products)) {
        logger.error('ShopifyService', 'Invalid products response format:', {
          responseData: response.data,
          fileName: this.fileName
        });
        throw new Error('Invalid response format: products is not an array');
      }

      // Add debug logging
      logger.debug('ShopifyService', 'Fetched products successfully', {
        count: products.length,
        firstProduct: products[0],
        fileName: this.fileName
      });

      // Apply the user's limit if specified
      return params.limit ? products.slice(0, params.limit) : products;

    } catch (error: any) {
      logger.error('ShopifyService', 'Failed to fetch products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        headers: error.response?.headers,
        config: error.config,
        fileName: this.fileName
      });

      // Check for specific permission errors
      if (error.response?.status === 403) {
        logger.error('ShopifyService', 'Permission denied - check app scopes', {
          fileName: this.fileName,
          requiredScopes: ['read_products', 'read_orders', 'read_inventory']
        });
      }

      this.handleApiError(error);
      throw error;
    }
  }

  async getOrders(params: QueryParams = {}): Promise<ShopifyOrder[]> {
    try {
      const { apiToken, shopUrl } = await this.getCredentials();
      
      // Log credentials
      logger.debug('ShopifyService', 'Using credentials for orders request:', {
        hasToken: !!apiToken,
        shopUrl,
        fileName: this.fileName
      });

      const client = this.createShopifyClient(apiToken, shopUrl);
      
      await this.testConnection(client);

      // Use a higher limit to get all orders at once
      const queryParams: Record<string, string> = {
        limit: '250', // Maximum allowed by Shopify
        status: 'any'
      };

      // Log request details
      logger.debug('ShopifyService', 'Making orders request:', {
        endpoint: `/admin/api/${this.shopifyApiVersion}/orders.json`,
        params: queryParams,
        fileName: this.fileName
      });

      const response = await client.get(`/admin/api/${this.shopifyApiVersion}/orders.json`, {
        params: queryParams
      });

      const orders = response.data.orders;
      if (!Array.isArray(orders)) {
        throw new Error('Invalid response format: orders is not an array');
      }

      // Add debug logging
      logger.debug('ShopifyService', 'Fetched orders successfully', {
        count: orders.length,
        firstOrder: orders[0],
        fileName: this.fileName
      });

      // Apply the user's limit if specified
      return params.limit ? orders.slice(0, params.limit) : orders;

    } catch (error) {
      logger.error('ShopifyService', 'Failed to fetch orders', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: this.fileName
      });
      this.handleApiError(error);
      throw error;
    }
  }

  async getCustomers(params: QueryParams = {}): Promise<ShopifyCustomer[]> {
    try {
      logger.info('ShopifyService', 'Starting customers fetch', { fileName: this.fileName });
      const { apiToken, shopUrl } = await this.getCredentials();
      
      // Log credentials
      logger.debug('ShopifyService', 'Using credentials for customers request:', {
        hasToken: !!apiToken,
        shopUrl,
        fileName: this.fileName
      });

      const client = this.createShopifyClient(apiToken, shopUrl);
      let allCustomers: ShopifyCustomer[] = [];
      let hasNextPage = true;
      let currentPageInfo = params.pageInfo;

      while (hasNextPage) {
        const queryParams = new URLSearchParams({
          limit: (params.limit || 50).toString()
        });

        if (currentPageInfo) {
          queryParams.append('page_info', currentPageInfo);
        }

        logger.debug('ShopifyService', 'Making API request', {
          fileName: this.fileName,
          shopUrl,
          pageInfo: currentPageInfo
        });

        const response = await client.get(`/admin/api/${this.shopifyApiVersion}/customers.json?${queryParams.toString()}`);

        allCustomers = [...allCustomers, ...response.data.customers];
        
        const paginationInfo = this.parsePaginationHeaders(response.headers.link);
        hasNextPage = paginationInfo.hasNextPage;
        currentPageInfo = paginationInfo.endCursor;

        logger.debug('ShopifyService', 'Fetched page of customers', {
          fileName: this.fileName,
          count: response.data.customers.length,
          totalCount: allCustomers.length,
          hasNextPage
        });
      }

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
}

export const shopifyService = ShopifyService.getInstance();