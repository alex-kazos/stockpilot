const { Handler } = require('@netlify/functions');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

const db = admin.firestore();

const handler = async (event) => {
  console.log('Received request:', {
    path: event.path,
    httpMethod: event.httpMethod,
    headers: event.headers
  });

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type, accept, x-user-id, x-shop-domain, x-shopify-access-token, x-store-id',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
      },
    };
  }

  try {
    // Get user ID from headers (will be needed for all paths)
    const userId = event.headers['x-user-id'];
    if (!userId) {
      console.error('No user ID provided in headers');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'User ID not provided' }),
      };
    }

    // Check for Shopify access token directly in the headers
    const shopifyAccessToken = event.headers['x-shopify-access-token'];
    const shopDomain = event.headers['x-shop-domain'] || null;
    const storeId = event.headers['x-store-id'] || null;
    
    // If we have a specific storeId and userId, attempt to load that store
    if (storeId) {
      console.log(`Fetching specific store: ${storeId} for user: ${userId}`);
      try {
        const storeDoc = await db.doc(`users/${userId}/stores/${storeId}`).get();
        
        if (storeDoc.exists) {
          const storeData = storeDoc.data();
          console.log(`Found specific store: ${storeId}`);
          
          // If shopifyAccessToken is provided, use it instead of stored token
          const token = shopifyAccessToken || storeData.apiToken;
          return await makeShopifyRequest(event, userId, storeData.shopUrl, token);
        } else {
          console.error(`Store ID ${storeId} not found for user ${userId}`);
          // Continue with other credential fetching mechanisms
        }
      } catch (err) {
        console.error('Error fetching specific store:', err);
        // Continue with other credential fetching mechanisms
      }
    }
    
    // If we have a direct Shopify access token in headers, use it without querying Firestore
    if (shopifyAccessToken && shopDomain) {
      console.log('Using credentials from headers');
      return await makeShopifyRequest(event, userId, shopDomain, shopifyAccessToken);
    }
    
    console.log('Fetching credentials for user:', userId);

    // Get credentials from the stores subcollection
    try {
      // Try to get credentials from the multi-store structure
      const storesSnapshot = await db.collection(`users/${userId}/stores`)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      
      if (!storesSnapshot.empty) {
        const storeData = storesSnapshot.docs[0].data();
        console.log('Found active store:', storeData.storeId);
        return await makeShopifyRequest(event, userId, storeData.shopUrl, storeData.apiToken);
      } else {
        console.error('No active Shopify store found for user:', userId);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No active Shopify store found' }),
        };
      }
    } catch (err) {
      console.error('Error fetching store data:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to retrieve Shopify credentials',
          details: err.message
        }),
      };
    }
  } catch (error) {
    console.error('Shopify proxy error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data,
      }),
    };
  }
};

async function makeShopifyRequest(event, userId, shopUrl, apiToken) {
  const cleanShopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Extract the path components to identify the endpoint and API version
  const pathSegments = event.path.split('/');
  let apiVersion = '2024-01'; // Default API version
  let endpoint = '';
  
  // Find the API version in the path
  for (let i = 0; i < pathSegments.length; i++) {
    if (pathSegments[i] === 'api' && pathSegments[i+1] && /^\d{4}-\d{2}$/.test(pathSegments[i+1])) {
      apiVersion = pathSegments[i+1];
      // The endpoint should be the segment after the API version
      if (pathSegments[i+2]) {
        endpoint = pathSegments[i+2];
      }
      break;
    }
  }
  
  // If we couldn't identify the endpoint from the path structure, use the last segment
  if (!endpoint) {
    endpoint = pathSegments[pathSegments.length - 1];
  }
  
  // Parse and forward query parameters
  const queryString = event.queryStringParameters ? 
    Object.entries(event.queryStringParameters)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&') : '';
  
  // Add default parameters if not specified in the query
  const defaultParams = new URLSearchParams();
  if (!queryString.includes('limit=')) {
    defaultParams.append('limit', '250'); // Maximum allowed by Shopify
  }
  if (endpoint === 'orders' && !queryString.includes('status=')) {
    defaultParams.append('status', 'any');
  }
  
  // Combine query parameters
  const combinedQuery = queryString 
    ? `${queryString}&${defaultParams.toString()}`
    : defaultParams.toString();
  
  // Construct the full Shopify API URL
  const shopifyUrl = `https://${cleanShopUrl}/admin/api/${apiVersion}/${endpoint}.json${combinedQuery ? `?${combinedQuery}` : ''}`;
  
  console.log('Making Shopify request:', {
    method: event.httpMethod,
    url: shopifyUrl,
    hasToken: !!apiToken,
    endpoint,
    apiVersion
  });

  // Make request to Shopify
  const response = await axios({
    method: event.httpMethod,
    url: shopifyUrl,
    headers: {
      'x-shopify-access-token': apiToken,
      'content-type': 'application/json',
    },
    data: event.body ? JSON.parse(event.body) : undefined,
  });

  console.log('Shopify response received:', {
    status: response.status,
    hasData: !!response.data
  });

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
    body: JSON.stringify(response.data),
  };
}

// Fix the CommonJS export in ESM environment
export { handler };
