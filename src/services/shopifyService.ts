import axios, { AxiosInstance } from 'axios';
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
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    logger.debug('ShopifyService', 'Creating Shopify client', {
      fileName: this.fileName,
      userId
    });
    
    return axios.create({
      baseURL: '/api/shopify',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Access-Token': token,
        'X-User-ID': userId
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

  private async getAllPages<T>(client: AxiosInstance, endpoint: string, dataKey: string): Promise<T[]> {
    let allItems: T[] = [];
    let hasNextPage = true;
    let nextPageInfo = '';

    while (hasNextPage) {
      const url = nextPageInfo 
        ? `${endpoint}?page_info=${nextPageInfo}`
        : endpoint;

      const response = await client.get(url);
      const items = response.data[dataKey] || [];
      allItems = [...allItems, ...items];

      // Check for next page in Link header
      const linkHeader = response.headers['link'];
      if (linkHeader) {
        const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
        if (nextLink) {
          const pageInfoMatch = nextLink.match(/page_info=([^>&"]*)/);
          nextPageInfo = pageInfoMatch ? pageInfoMatch[1] : '';
          hasNextPage = true;
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      logger.debug('ShopifyService', `Fetched page of ${dataKey}`, {
        fileName: this.fileName,
        itemCount: items.length,
        totalCount: allItems.length,
        hasNextPage
      });
    }

    return allItems;
  }

  async getProducts(params: QueryParams = {}): Promise<ShopifyProduct[]> {
    try {
      logger.debug('ShopifyService', 'Fetching all products', {
        fileName: this.fileName,
        params
      });

      const { apiToken, shopUrl } = await this.getCredentials();
      const client = this.createShopifyClient(apiToken, shopUrl);

      // Get all pages of products
      const allProducts = await this.getAllPages<ShopifyProduct>(client, '/api/shopify/products', 'products');
      
      logger.debug('ShopifyService', 'All products fetched successfully', {
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

      const { apiToken, shopUrl } = await this.getCredentials();
      const client = this.createShopifyClient(apiToken, shopUrl);

      // Get all pages of orders
      const allOrders = await this.getAllPages<ShopifyOrder>(client, '/api/shopify/orders', 'orders');
      
      logger.debug('ShopifyService', 'All orders fetched successfully', {
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