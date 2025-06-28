import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
let firebaseInitialized = false;
let db;

if (!getApps().length) {
  try {
    // Check if all required environment variables are present
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase environment variables:', { 
        hasProjectId: !!projectId, 
        hasClientEmail: !!clientEmail, 
        hasPrivateKey: !!privateKey 
      });
    } else {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      firebaseInitialized = true;
      console.log('Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Don't throw the error, just log it
    // This allows the function to still handle requests even if Firebase init fails
  }
}

// Only get Firestore if Firebase was initialized successfully
if (firebaseInitialized) {
  db = getFirestore();
}

export async function onRequest(context) {
  // Get the request object
  const { request } = context;
  
  console.log('Received request:', {
    path: new URL(request.url).pathname,
    method: request.method,
  });

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, accept, x-user-id, x-shop-domain, x-shopify-access-token, x-store-id',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {
    // Get user ID from headers (will be needed for all paths)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      console.error('No user ID provided in headers');
      return new Response(JSON.stringify({ error: 'User ID not provided' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Check for Shopify access token directly in the headers
    const shopifyAccessToken = request.headers.get('x-shopify-access-token');
    const shopDomain = request.headers.get('x-shop-domain');
    const storeId = request.headers.get('x-store-id');
    
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
          return makeShopifyRequest(request, userId, storeData.shopUrl, token);
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
      return makeShopifyRequest(request, userId, shopDomain, shopifyAccessToken);
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
        return makeShopifyRequest(request, userId, storeData.shopUrl, storeData.apiToken);
      } else {
        console.error('No active Shopify store found for user:', userId);
        return new Response(JSON.stringify({ error: 'No active Shopify store found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching store data:', err);
      return new Response(JSON.stringify({
        error: 'Failed to retrieve Shopify credentials', 
        details: err.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Shopify proxy error:', {
      message: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({
      error: error.message,
      details: error.response?.data,
    }), {
      status: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function makeShopifyRequest(request, userId, shopUrl, apiToken) {
  const cleanShopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Extract the path components to identify the endpoint and API version
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
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
  
  // Parse and forward query parameters from the URL
  const searchParams = new URL(request.url).searchParams;
  
  // Add default parameters if not specified in the query
  if (!searchParams.has('limit')) {
    searchParams.append('limit', '250'); // Maximum allowed by Shopify
  }
  if (endpoint === 'orders' && !searchParams.has('status')) {
    searchParams.append('status', 'any');
  }
  
  // Construct the full Shopify API URL
  const shopifyUrl = `https://${cleanShopUrl}/admin/api/${apiVersion}/${endpoint}.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  console.log('Making Shopify request:', {
    method: request.method,
    url: shopifyUrl,
    hasToken: !!apiToken,
    endpoint,
    apiVersion
  });

  // Make request to Shopify
  const requestOptions = {
    method: request.method,
    headers: {
      'X-Shopify-Access-Token': apiToken,
      'Content-Type': 'application/json',
    }
  };

  // Add request body for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const bodyText = await request.text();
      requestOptions.body = bodyText;
    }
  }

  try {
    const shopifyResponse = await fetch(shopifyUrl, requestOptions);
    
    if (!shopifyResponse.ok) {
      throw new Error(`Shopify API error: ${shopifyResponse.status}`);
    }
    
    const responseData = await shopifyResponse.json();
    
    console.log('Shopify response received:', {
      status: shopifyResponse.status,
      hasData: !!responseData
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error making Shopify API request:', error);
    return new Response(JSON.stringify({
      error: 'Error making Shopify API request',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
