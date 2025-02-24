import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
export interface SquareInventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}
export interface SquareOrder {
  id: string;
  createdAt: string;
  totalMoney: {
    amount: number;
    currency: string;
  };
  lineItems: Array<{
    name: string;
    quantity: string;
    totalMoney: {
      amount: number;
      currency: string;
    };
  }>;
}
export const squareService = {
  async getInventory(userId: string): Promise<SquareInventoryItem[]> {
    try {
      const response = await fetch('/.netlify/functions/square-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'getInventory',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      return data.inventory;
    } catch (error) {
      console.error('Error fetching Square inventory:', error);
      throw error;
    }
  },
  async getOrders(userId: string): Promise<SquareOrder[]> {
    try {
      const response = await fetch('/.netlify/functions/square-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'getOrders',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      return data.orders;
    } catch (error) {
      console.error('Error fetching Square orders:', error);
      throw error;
    }
  },
  async isConnected(userId: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'users', userId, 'integrations', 'square');
      const docSnap = await getDoc(docRef);
      return docSnap.exists() && docSnap.data()?.connected === true;
    } catch (error) {
      console.error('Error checking Square connection:', error);
      return false;
    }
  },
};