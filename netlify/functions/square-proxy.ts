const { Handler } = require('@netlify/functions');
const { Client, Environment } = require('square');
const admin = require('firebase-admin');
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}
const db = admin.firestore();
const SQUARE_APP_ID = process.env.SQUARE_APP_ID || 'sandbox-sq0idb-jMUbBRSYF2qho07MU3DHnA';
const SQUARE_APP_SECRET = process.env.SQUARE_APP_SECRET || 'sandbox-sq0csb-5wywwnPBpxQVytmMvNv5w7LWwmDfvhQViOpLNknCWbs';
const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
// Handle OAuth callback
    if (event.httpMethod === 'GET' && event.queryStringParameters?.code) {
      const { code } = event.queryStringParameters;
      const { state } = event.queryStringParameters;

      if (!state) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing state parameter' }),
        };
      }

      const [userId, redirectUrl] = state.split('|');

      // Exchange code for access token
      const tokenResponse = await fetch('https://connect.squareup.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Square-Version': '2024-01-17',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: SQUARE_APP_ID,
          client_secret: SQUARE_APP_SECRET,
          code,
          grant_type: 'authorization_code'
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Error exchanging code for token:', tokenData);
        return {
          statusCode: 302,
          headers: {
            Location: `${redirectUrl}?error=${encodeURIComponent(tokenData.message || 'Failed to connect Square account')}`,
          },
        };
      }

      // Store the access token in Firestore
      await db.collection('users').doc(userId).collection('integrations').doc('square').set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        merchantId: tokenData.merchant_id,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (tokenData.expires_in * 1000)),
        connected: true,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Redirect back to the app
      return {
        statusCode: 302,
        headers: {
          Location: `${redirectUrl}?success=true`,
        },
      };
    }

// Handle API requests
    const { userId, action, accessToken } = JSON.parse(event.body);

    if (!userId || !action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

// Get access token from Firestore if not provided
    let token = accessToken;
    if (!token) {
      const squareDoc = await db.collection('users').doc(userId).collection('integrations').doc('square').get();
      if (!squareDoc.exists) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Square integration not found' }),
        };
      }
      token = squareDoc.data().accessToken;
    }

// Initialize Square client
    const client = new Client({
      bearerAuthCredentials: {
        accessToken: token
      },
      environment: Environment.Sandbox // Change to Environment.Production for production
    });

    let response;
    switch (action) {
      case 'getInventory': {
        // Get catalog items with inventory
        const catalogResponse = await client.catalogApi.searchCatalogItems({
          productTypes: ['REGULAR'],
        });

        const items = catalogResponse.result.items || [];
        const itemIds = items.map(item => item.id);

        // Get inventory counts for items
        const inventoryResponse = await client.inventoryApi.batchRetrieveInventoryCounts({
          catalogObjectIds: itemIds,
        });

        // Combine catalog and inventory data
        const inventory = items.map(item => {
          const inventoryCount = inventoryResponse.result.counts?.find(
              count => count.catalogObjectId === item.id
          );
          return {
            id: item.id,
            name: item.itemData?.name,
            sku: item.itemData?.variations?.[0]?.itemVariationData?.sku,
            price: item.itemData?.variations?.[0]?.itemVariationData?.priceMoney?.amount,
            quantity: inventoryCount?.quantity || 0,
          };
        });

        response = { inventory };
        break;
      }

      case 'getOrders': {
        // Get orders from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ordersResponse = await client.ordersApi.searchOrders({
          locationIds: ['*'], // All locations
          query: {
            filter: {
              dateTimeFilter: {
                createdAt: {
                  startAt: thirtyDaysAgo.toISOString(),
                },
              },
              stateFilter: {
                states: ['COMPLETED'],
              },
            },
          },
        });

        response = { orders: ordersResponse.result.orders || [] };
        break;
      }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }

// Store the data in Firestore
    const storeRef = db.collection('users').doc(userId).collection('stores').doc('square');
    await storeRef.set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      data: response,
    }, { merge: true });

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
exports.handler = handler;