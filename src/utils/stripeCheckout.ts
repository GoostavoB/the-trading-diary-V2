/**
 * STRIPE CHECKOUT UTILITY
 * Unified function to initiate Stripe checkout for all product types
 * Handles subscriptions and credit purchases
 */

import { supabase } from '@/integrations/supabase/client';

export interface CheckoutParams {
  priceId: string;
  productType: 'subscription_monthly' | 'subscription_annual' | 'credits_starter' | 'credits_pro';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Initiates a Stripe checkout session and redirects user to Stripe
 * @param params Checkout configuration
 * @returns Promise that resolves when redirect happens
 */
export const initiateStripeCheckout = async (params: CheckoutParams): Promise<void> => {
  const { priceId, productType, successUrl, cancelUrl } = params;

  // Verify user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('You must be logged in to make a purchase');
  }

  // Set default URLs if not provided
  const frontendUrl = window.location.origin;
  const defaultSuccessUrl = `${frontendUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = `${frontendUrl}/checkout-cancel`;

  // Call Edge Function to create Stripe checkout session
  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: {
      priceId,
      productType,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
    },
  });

  if (error) {
    console.error('Checkout error:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }

  if (!data?.url) {
    throw new Error('No checkout URL received from server');
  }

  // Redirect to Stripe Checkout
  window.location.href = data.url;
};

/**
 * Convenience function for subscription checkout
 */
export const checkoutSubscription = async (
  tier: 'pro' | 'elite',
  interval: 'monthly' | 'annual',
  priceId: string
): Promise<void> => {
  const productType = interval === 'monthly' ? 'subscription_monthly' : 'subscription_annual';
  
  return initiateStripeCheckout({
    priceId,
    productType,
  });
};

/**
 * Convenience function for credit purchase checkout
 */
export const checkoutCredits = async (
  priceId: string,
  hasSubscription: boolean
): Promise<void> => {
  const productType = hasSubscription ? 'credits_pro' : 'credits_starter';
  
  return initiateStripeCheckout({
    priceId,
    productType,
  });
};
