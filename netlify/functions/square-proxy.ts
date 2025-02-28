import { Handler } from '@netlify/functions';
import { Client, Environment, ApiError } from 'square';

const client = new Client({
  environment: process.env.NODE_ENV === 'production' 
    ? Environment.Production 
    : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
});

// Utility function to handle API errors
const handleSquareError = (error: unknown) => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({
        errors: error.errors,
        message: error.message
      })
    };
  }
  
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: 'An unknown error occurred',
      error: error instanceof Error ? error.message : String(error)
    })
  };
};

export const handler: Handler = async (event, context) => {
  // Add CORS headers to all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Use the access token from the Authorization header if present
  const authHeader = event.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.substring(7);
    client.accessToken = accessToken;
  }

  const path = event.path.replace('/.netlify/functions/square-proxy', '');
  
  try {
    // Location endpoints
    if (path === '/locations') {
      const { result } = await client.locationsApi.listLocations();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // OAuth endpoint for getting access token
    if (path === '/oauth/token' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { code } = body;
      
      if (!code) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Authorization code is required' })
        };
      }
      
      const response = await client.oAuthApi.obtainToken({
        clientId: process.env.SQUARE_APP_ID || '',
        clientSecret: process.env.SQUARE_APP_SECRET || '',
        code,
        grantType: 'authorization_code'
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response.result)
      };
    }
    
    // Add more endpoints as needed
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };
  } catch (error) {
    const errorResponse = handleSquareError(error);
    return {
      ...errorResponse,
      headers
    };
  }
};
