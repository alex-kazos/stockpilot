import axios from 'axios';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY || '', {
  apiVersion: import.meta.env.VITE_STRIPE_API_VERSION,
});

export interface Subscription {
  id: string;
  type: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  customerId: string | null;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
}

export const SUBSCRIPTION_URLS = {
  MANAGE_SUBSCRIPTION: import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL,
  NEW_SUBSCRIPTION: {
    MONTHLY: import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_URL,
    YEARLY: import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_URL,
  },
};

export const PRICE_IDS = {
  MONTHLY: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY,
  YEARLY: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY,
};

export const PRODUCT_ID = import.meta.env.VITE_STRIPE_PRODUCT_ID;

export const subscriptionService = {
  async getUserSubscription(userEmail: string): Promise<Subscription | null> {
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return null;
      }

      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length === 0) {
        return {
          id: '',
          type: 'monthly',
          status: 'canceled',
          customerId: customer.id,
          priceId: null,
          currentPeriodEnd: null,
          trialEnd: null,
        };
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;
      const productId = subscription.items.data[0].price.product as string;

      // Return null if subscription is for a different product
      if (productId !== PRODUCT_ID) {
        return null;
      }

      return {
        id: subscription.id,
        type: priceId === PRICE_IDS.MONTHLY ? 'monthly' : 'yearly',
        status: subscription.status === 'trialing' ? 'trialing' : subscription.status,
        customerId: customer.id,
        priceId: priceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  },

  isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;
    return subscription.status === 'active' || subscription.status === 'trialing';
  },

  wasCustomer(subscription: Subscription | null): boolean {
    return subscription !== null;
  },

  getSubscriptionUrl(subscription: Subscription | null, preferredPlan: 'monthly' | 'yearly' = 'monthly'): string {
    if (!subscription) {
      return preferredPlan === 'monthly' 
        ? SUBSCRIPTION_URLS.NEW_SUBSCRIPTION.MONTHLY 
        : SUBSCRIPTION_URLS.NEW_SUBSCRIPTION.YEARLY;
    }
    return SUBSCRIPTION_URLS.MANAGE_SUBSCRIPTION;
  }
};
