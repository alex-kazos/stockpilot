import { logger } from './logger';
import { filterProductsByQueryContext } from './queryAnalyzer';
import { QueryContext } from './queryAnalyzer';

interface Product {
  id: string;
  name: string;
  stock: number;
  sales: number;
  product_type: string;
  sku: string;
  variants?: Array<{
    sku: string;
    inventory_quantity: number;
  }>;
}

interface Recommendation {
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'RESTOCK' | 'WARNING' | 'OPPORTUNITY';
  prediction: string;
  product_type: string;
  sku: string;
}

interface RecommendationResponse {
  recommendations: Recommendation[];
}

export const generateRecommendations = async (products: Product[], apiKey?: string): Promise<RecommendationResponse> => {
  // If no API key is provided, return an empty response
  if (!apiKey) {
    logger.warning('OpenAI', 'No API key provided for OpenAI', {
      fileName: 'openai.ts'
    });
    return { recommendations: [] };
  }

  // Process products to ensure SKU is available
  const processedProducts = products.map(product => ({
    ...product,
    sku: product.sku || product.variants?.[0]?.sku || 'N/A'
  }));

  // Filter products to only include those that need attention
  // This prevents sending the entire inventory to the API
  
  // First, get low stock items (most critical)
  const lowStockContext: QueryContext = { 
    type: 'LOW_STOCK',
    limit: 7 // Only include top 7 low stock items 
  };
  const lowStockProducts = filterProductsByQueryContext(processedProducts, [], lowStockContext);
  
  // Then, get best selling items
  const bestSellingContext: QueryContext = { 
    type: 'BEST_SELLING',
    limit: 7 // Only include top 7 best selling items
  };
  const bestSellingProducts = filterProductsByQueryContext(processedProducts, [], bestSellingContext);
  
  // Finally, get overstocked items
  const overstockedContext: QueryContext = { 
    type: 'OVERSTOCKED',
    limit: 6 // Only include top 6 overstocked items
  };
  const overstockedProducts = filterProductsByQueryContext(processedProducts, [], overstockedContext);
  
  // Combine the filtered products, removing duplicates
  const combinedProducts: Product[] = [];
  const addedIds = new Set<string>();
  
  // Helper to add products without duplicates
  const addProductsToList = (productsList: Product[]) => {
    productsList.forEach(product => {
      if (!addedIds.has(product.id)) {
        combinedProducts.push(product);
        addedIds.add(product.id);
      }
    });
  };
  
  // Add products in order of importance
  addProductsToList(lowStockProducts);       // Critical needs first
  addProductsToList(bestSellingProducts);    // Then popular items
  addProductsToList(overstockedProducts);    // Then overstocked items
  
  // Cap at 20 products total to avoid token limit issues
  const reducedProducts = combinedProducts.slice(0, 20);
  
  logger.debug('OpenAI', 'Preparing recommendations with filtered products', {
    fileName: 'openai.ts',
    totalProducts: products.length,
    filteredProducts: reducedProducts.length,
    lowStockCount: lowStockProducts.length,
    bestSellingCount: bestSellingProducts.length,
    overstockedCount: overstockedProducts.length
  });

  const prompt = `Analyze the following product data and provide inventory management recommendations. For each recommendation, specify a priority (HIGH, MEDIUM, LOW) and type (RESTOCK, WARNING, OPPORTUNITY). Also include a prediction field with potential financial impact.

Product Data:
${reducedProducts.map(p => `- ${p.name} (${p.product_type}): ${p.stock} in stock, ${p.sales} sales, SKU: ${p.sku}`).join('\n')}

Provide recommendations in the following JSON format:
{
  "recommendations": [
    {
      "message": "string",
      "priority": "HIGH|MEDIUM|LOW",
      "type": "RESTOCK|WARNING|OPPORTUNITY",
      "prediction": "string (e.g., 'Potential revenue increase of $25,000')",
      "product_type": "string (category of the product)",
      "sku": "string (SKU of the related product)"
    }
  ]
}

Focus on:
1. Low stock items that need reordering
2. Products with high sales but low stock
3. Overstocked items
4. Sales trends and opportunities
5. Potential risks or warnings

For each recommendation, include:
1. A specific prediction about potential financial impact
2. The product category (product_type) the recommendation relates to
3. The specific SKU the recommendation is about, if applicable
Provide up to 5 actionable recommendations.`;

  const messages = [
    {
      role: "system",
      content: "You are an AI inventory management assistant. Analyze product data and provide actionable recommendations in JSON format with financial predictions."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  // Function to make OpenAI request with retry
  const makeOpenAIRequest = async (retries = 1): Promise<any> => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages,
          max_tokens: 1024,
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      
      logger.debug('OpenAI', 'Received response from OpenAI', {
        fileName: 'openai.ts',
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error calling OpenAI API');
      }

      return data;
    } catch (error) {
      if (retries > 0) {
        logger.warning('OpenAI', 'Retrying OpenAI request', {
          fileName: 'openai.ts',
          retriesLeft: retries - 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return makeOpenAIRequest(retries - 1);
      }
      throw error;
    }
  };

  const data = await makeOpenAIRequest(2);
  const content = data.choices[0].message.content;
  const parsedRecommendations = JSON.parse(content);

  if (!parsedRecommendations.recommendations || !Array.isArray(parsedRecommendations.recommendations)) {
    throw new Error('Invalid response format from OpenAI');
  }

  return parsedRecommendations;
};

export type { Product, Recommendation, RecommendationResponse };
