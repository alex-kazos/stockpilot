import React, { createContext, useContext, useState, useCallback } from 'react';
import { DashboardProduct, DashboardOrder } from '../types/dashboard';
import { logger } from '../utils/logger';
import { useAPIKeys } from './APIKeysContext';
import { analyzeQuery, filterProductsByQueryContext, generateContextDescription } from '../utils/queryAnalyzer';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIAssistantContextType {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  startNewChat: () => void;
  hasValidApiKey: boolean;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

interface AIAssistantProviderProps {
  children: React.ReactNode;
  products: DashboardProduct[];
  orders: DashboardOrder[];
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ 
  children,
  products,
  orders
}) => {
  const { openaiApiKey } = useAPIKeys();

  const initialSystemMessage = {
    role: 'system' as const,
    content: 'You are a helpful stock and sales assistant who provides information about inventory and sales data. Only share information that is directly related to what the user is asking about. Never provide recommendations or insights unless specifically requested. Respond based on the specific data provided in each context message and only answer the exact question asked by the user. Keep your answers short and focused.'
  };

  const [messages, setMessages] = useState<Message[]>([initialSystemMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a valid API key
  const hasValidApiKey = !!openaiApiKey;

  const startNewChat = useCallback(() => {
    setMessages([initialSystemMessage]);
    setError(null);
  }, []);

  // Helper function to calculate average order value
  const calculateAverageOrderValue = (filterOrders: DashboardOrder[]): string => {
    if (filterOrders.length === 0) return '0.00';

    const totalValue = filterOrders.reduce((sum, order) => 
      sum + (order.total_price ? parseFloat(order.total_price) : 0), 0);
      
    return (totalValue / filterOrders.length).toFixed(2);
  };

  const sendMessage = useCallback(async (content: string) => {
    try {
      // If no API key, don't attempt to send a message
      if (!openaiApiKey) {
        setError("No OpenAI API key provided. Please add your key in Settings.");
        return;
      }

      setIsLoading(true);
      setError(null);

      // Add user message to the conversation
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Analyze query to understand what data is needed
      const queryContext = analyzeQuery(content);
      
      // Get recent orders (last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentOrders = orders.filter(order => 
        new Date(order.created_at) >= last30Days
      );

      // Filter products based on the query context
      const relevantProducts = filterProductsByQueryContext(
        products, 
        orders, // Use all orders, not just recent ones, for product metrics
        queryContext
      );
      
      // Generate context description with only the relevant products
      const contextDescription = generateContextDescription(queryContext, relevantProducts);

      // Create a map of order items to make lookup easier
      const orderItemsMap = new Map<string, { products: string[], totalValue: number }>();
      
      orders.forEach(order => {
        const productIds = order.line_items?.map(item => item.product_id?.toString() || '') || [];
        const totalValue = order.total_price ? parseFloat(order.total_price) : 0;
        
        orderItemsMap.set(order.id.toString(), {
          products: productIds.filter(Boolean),
          totalValue
        });
      });

      // Prepare the context for the AI with detailed order information
      const contextMessage = {
        role: 'system' as const,
        content: `${contextDescription}

Recent Order Activity (Last 30 Days):
• Total orders: ${recentOrders.length}
• Average order value: $${calculateAverageOrderValue(recentOrders)}

Detailed Order Information:
${orders.slice(0, 10).map(o => {
  const orderItems = orderItemsMap.get(o.id.toString());
  const productNames = orderItems?.products.map(pid => {
    const product = products.find(p => p.id === pid);
    return product ? product.name : 'Unknown Product';
  }).join(', ');
  
  return `- Order ${o.order_number || o.id} (${new Date(o.created_at).toLocaleDateString()}):
    • Items: ${o.line_items?.length || 0}
    • Products: ${productNames || 'No products'}
    • Total: $${o.total_price || '0.00'}
    • Status: ${o.financial_status || 'unknown'}`;
}).join('\n')}

Order-Product Relationships:
${relevantProducts.slice(0, 10).map(product => {
  const productOrders = orders
    .filter(order => order.line_items?.some(item => item.product_id?.toString() === product.id))
    .slice(0, 5);
  
  return `- ${product.name} (${product.sku}):
    • Total orders: ${productOrders.length}
    • Recent orders: ${productOrders.map(o => o.order_number || o.id).join(', ')}`;
}).join('\n')}

REMEMBER: Only answer the user's specific question. Do not provide recommendations or insights unless explicitly asked. Do not summarize this data unless requested.`
      };

      // Log what we're sending to the API for debugging
      logger.debug('AIAssistant', 'Sending context to AI', {
        fileName: 'AIAssistantContext.tsx',
        queryType: queryContext.type,
        productCount: relevantProducts.length,
        contextLength: contextMessage.content.length
      });

      // Make the API request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [...messages, contextMessage, userMessage],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from AI');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      logger.debug('AIAssistant', 'Received AI response', {
        fileName: 'AIAssistantContext.tsx',
        messageContent: assistantMessage.content
      });

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('AIAssistant', 'Error in AI conversation', {
        fileName: 'AIAssistantContext.tsx',
        error: err
      });
    } finally {
      setIsLoading(false);
    }
  }, [products, orders, messages, openaiApiKey]);

  const clearMessages = useCallback(() => {
    setMessages([initialSystemMessage]);
    setError(null);
  }, []);

  return (
    <AIAssistantContext.Provider 
      value={{ 
        messages, 
        isLoading, 
        error, 
        sendMessage,
        clearMessages,
        startNewChat,
        hasValidApiKey
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
}; 