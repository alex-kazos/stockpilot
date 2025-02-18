export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  plan: 'free' | 'pro' | 'enterprise';
  startDate: string;
  endDate: string;
  features: string[];
} 