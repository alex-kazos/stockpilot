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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    };
  }

  try {
    // Get user ID from headers
    const userId = event.headers['x-user-id'];
    if (!userId) {
      console.error('No user ID provided in headers');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'User ID not provided' }),
      };
    }

    console.log('Fetching credentials for user:', userId);

    // Get Shopify credentials from Firestore
    const credentialsDoc = await db.collection('shopify_credentials').doc(userId).get();
    if (!credentialsDoc.exists) {
      console.error('No Shopify credentials found for user:', userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Shopify credentials not found' }),
      };
    }

    const data = credentialsDoc.data();
    const { apiToken, shopUrl } = data;
    
    if (!apiToken || !shopUrl) {
      console.error('Invalid credentials for user:', userId);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Shopify credentials' }),
      };
    }

    const cleanShopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    // Extract the endpoint (products, orders, etc.) from the path
    const endpoint = event.path.split('/').pop();
    
    // Add pagination parameters for maximum items
    const queryParams = new URLSearchParams({
      limit: '250', // Maximum allowed by Shopify
      status: 'any'
    });
    
    console.log('Making Shopify request:', {
      method: event.httpMethod,
      url: `https://${cleanShopUrl}/admin/api/2024-01/${endpoint}.json?${queryParams}`,
      hasToken: !!apiToken,
      endpoint
    });

    // Make request to Shopify
    const response = await axios({
      method: event.httpMethod,
      url: `https://${cleanShopUrl}/admin/api/2024-01/${endpoint}.json?${queryParams}`,
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json',
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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.data),
    };
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

exports.handler = handler;
