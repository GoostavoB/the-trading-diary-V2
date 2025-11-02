/**
 * STRIPE PRODUCTS CONFIGURATION
 * Centralized configuration for all Stripe products and pricing
 * 
 * Product Types:
 * - Subscriptions: Pro and Elite tiers (monthly/annual)
 * - Credits: Starter and Pro credit packs
 */

export type SubscriptionInterval = 'monthly' | 'annual';
export type SubscriptionTier = 'pro' | 'elite';
export type CreditPackType = 'starter' | 'pro';

export interface StripeProduct {
  priceId: string;
  productType: string;
  name: string;
  description: string;
  price: number;
  interval?: SubscriptionInterval;
  features?: string[];
}

/**
 * Subscription Products
 * Pro: $9.99/mo or $99.99/year (save $19.89)
 * Elite: $24.99/mo or $249.99/year (save $49.89)
 */
export const SUBSCRIPTION_PRODUCTS: Record<SubscriptionTier, Record<SubscriptionInterval, StripeProduct>> = {
  pro: {
    monthly: {
      priceId: 'price_1SOxY4FqnRj6eB66dXzsrUqY',
      productType: 'subscription_monthly',
      name: 'Pro Monthly',
      description: 'Premium features, billed monthly',
      price: 9.99,
      interval: 'monthly',
      features: [
        'Unlimited AI extractions',
        'Advanced analytics',
        'Priority support',
        '60% discount on credits'
      ]
    },
    annual: {
      priceId: 'price_1SOxbDFqnRj6eB66rE1d5YLP',
      productType: 'subscription_annual',
      name: 'Pro Annual',
      description: 'Premium features, billed annually',
      price: 8.33, // $99.99/year = $8.33/month
      interval: 'annual',
      features: [
        'Unlimited AI extractions',
        'Advanced analytics',
        'Priority support',
        '60% discount on credits',
        'Save $19.89 per year'
      ]
    }
  },
  elite: {
    monthly: {
      priceId: 'price_1SOxusFqnRj6eB66rjh4qAjN',
      productType: 'subscription_monthly',
      name: 'Elite Monthly',
      description: 'All premium features plus exclusive tools',
      price: 24.99,
      interval: 'monthly',
      features: [
        'Everything in Pro',
        'AI trading assistant',
        'Custom dashboards',
        'API access',
        'White-glove support'
      ]
    },
    annual: {
      priceId: 'price_1SOxwHFqnRj6eB66kqtJVPZy',
      productType: 'subscription_annual',
      name: 'Elite Annual',
      description: 'All premium features plus exclusive tools',
      price: 20.83, // $249.99/year = $20.83/month
      interval: 'annual',
      features: [
        'Everything in Pro',
        'AI trading assistant',
        'Custom dashboards',
        'API access',
        'White-glove support',
        'Save $49.89 per year'
      ]
    }
  }
};

/**
 * Credit Packs
 * Both packs give 10 credits for $2
 * Different tracking for free vs subscribed users
 */
export const CREDIT_PRODUCTS: Record<CreditPackType, StripeProduct> = {
  starter: {
    priceId: 'price_1SOxpUFqnRj6eB66kn8f9Kzs',
    productType: 'credits_starter',
    name: 'Starter Credits',
    description: '10 AI extraction credits for free users',
    price: 2.00,
    features: ['10 AI extraction credits', 'Never expires']
  },
  pro: {
    priceId: 'price_1SOxyYFqnRj6eB66CnowBEBN',
    productType: 'credits_pro',
    name: 'Pro Credits',
    description: '10 AI extraction credits for Pro/Elite members',
    price: 2.00,
    features: ['10 AI extraction credits', 'Never expires', 'Pro member pricing']
  }
};

/**
 * Helper function to get subscription product by tier and interval
 */
export const getSubscriptionProduct = (
  tier: SubscriptionTier,
  interval: SubscriptionInterval
): StripeProduct => {
  return SUBSCRIPTION_PRODUCTS[tier][interval];
};

/**
 * Helper function to get credit product based on user's subscription status
 */
export const getCreditProduct = (hasSubscription: boolean): StripeProduct => {
  return hasSubscription ? CREDIT_PRODUCTS.pro : CREDIT_PRODUCTS.starter;
};

/**
 * Calculate annual savings
 */
export const calculateAnnualSavings = (tier: SubscriptionTier): number => {
  const monthly = SUBSCRIPTION_PRODUCTS[tier].monthly;
  const annual = SUBSCRIPTION_PRODUCTS[tier].annual;
  return (monthly.price * 12) - (annual.price * 12);
};
