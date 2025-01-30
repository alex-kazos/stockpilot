import { logger } from './logger';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('Missing VITE_OPENAI_API_KEY environment variable');
}

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

export const generateRecommendations = async (products: Product[]): Promise<RecommendationResponse> => {
  // Process products to ensure SKU is available
  const processedProducts = products.map(product => ({
    ...product,
    sku: product.sku || product.variants?.[0]?.sku || 'N/A'
  }));

  const prompt = `Analyze the following product data and provide inventory management recommendations. For each recommendation, specify a priority (HIGH, MEDIUM, LOW) and type (RESTOCK, WARNING, OPPORTUNITY). Also include a prediction field with potential financial impact.

Product Data:
${processedProducts.map(p => `- ${p.name} (${p.product_type}): ${p.stock} in stock, ${p.sales} sales, SKU: ${p.sku}`).join('\n')}

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
