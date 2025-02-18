import React, { createContext, useContext, useState, useCallback } from 'react';
import { DashboardProduct, DashboardOrder } from '../types/dashboard';
import { logger } from '../utils/logger';

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
  const initialSystemMessage = {
    role: 'system' as const,
    content: 'You are a stock and sales expert who, based on product data, can make various suggestions and inform the business owner about their stock, products, and future sales. Keep your answers short and focused on actionable insights.'
  };

  const [messages, setMessages] = useState<Message[]>([initialSystemMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startNewChat = useCallback(() => {
    setMessages([initialSystemMessage]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to the conversation
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Calculate some basic analytics for context
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentOrders = orders.filter(order => 
        new Date(order.created_at) >= last30Days
      );

      const productSalesMap = new Map<string, number>();
      const productRevenueMap = new Map<string, number>();

      recentOrders.forEach(order => {
        order.line_items?.forEach(item => {
          const currentSales = productSalesMap.get(item.product_id?.toString() || '') || 0;
          const currentRevenue = productRevenueMap.get(item.product_id?.toString() || '') || 0;
          
          productSalesMap.set(
            item.product_id?.toString() || '', 
            currentSales + (item.quantity || 0)
          );
          productRevenueMap.set(
            item.product_id?.toString() || '', 
            currentRevenue + ((parseFloat(item.price) || 0) * (item.quantity || 0))
          );
        });
      });

      // Prepare the context for the AI
      const contextMessage = {
        role: 'system',
        content: `Current inventory and sales data:

Product Inventory:
${products.map(p => {
  const sales = productSalesMap.get(p.id) || 0;
  const revenue = productRevenueMap.get(p.id) || 0;
  return `- ${p.name}:
  • Current stock: ${p.stock} units
  • SKU: ${p.sku}
  • Product type: ${p.product_type}
  • 30-day sales: ${sales} units
  • 30-day revenue: $${revenue.toFixed(2)}
  • Price: $${p.price}
  • Stock status: ${p.stock < 10 ? 'LOW STOCK' : p.stock > 50 ? 'WELL STOCKED' : 'MODERATE'}`
}).join('\n')}

Recent Order Activity (Last 30 Days):
• Total orders: ${recentOrders.length}
• Average order value: $${recentOrders.length > 0 
  ? (recentOrders.reduce((sum, order) => 
      sum + (order.total_price ? parseFloat(order.total_price) : 0), 0) / recentOrders.length).toFixed(2)
  : '0.00'}
• Most recent orders:
${orders.slice(0, 5).map(o => 
  `  - Order ${o.order_number} (${new Date(o.created_at).toLocaleDateString()}):
    • Items: ${o.line_items?.length || 0}
    • Total: $${o.total_price || '0.00'}
    • Status: ${o.financial_status || 'unknown'}`
).join('\n')}

Please analyze this data to provide insights and recommendations about inventory management, sales trends, and potential opportunities.`
      };

      // Make the API request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [...messages, contextMessage, userMessage],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
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
  }, [products, orders, messages]);

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
        startNewChat
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