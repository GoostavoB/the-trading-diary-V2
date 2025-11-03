/**
 * STRIPE CHECKOUT UTILITY
 * Unified function to initiate Stripe checkout for all product types
 * Handles subscriptions and credit purchases
 */

import { supabase } from '@/integrations/supabase/client';
import { trackCheckoutFunnel } from '@/utils/checkoutAnalytics';

export interface CheckoutParams {
  priceId: string;
  productType: 'subscription_monthly' | 'subscription_annual' | 'credits_starter' | 'credits_pro';
  successUrl?: string;
  cancelUrl?: string;
  upsellCredits?: number;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Initiates a Stripe checkout session and redirects user to Stripe
 * @param params Checkout configuration
 * @returns Promise that resolves with the checkout URL
 */
export const initiateStripeCheckout = async (params: CheckoutParams): Promise<string> => {
  console.log('🚀 initiateStripeCheckout called with:', params);
  const { priceId, productType, successUrl, cancelUrl, upsellCredits } = params;

  // Verify user is authenticated
  console.log('🔐 Checking authentication...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  console.log('🔐 Session:', session ? 'Found' : 'Not found', 'Error:', sessionError);
  
  if (sessionError || !session) {
    console.error('❌ Authentication failed:', sessionError);
    throw new Error('You must be logged in to make a purchase');
  }

  // Set default URLs if not provided
  const frontendUrl = window.location.origin;
  const defaultSuccessUrl = `${frontendUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = `${frontendUrl}/checkout-cancel`;

  // Call Edge Function to create Stripe checkout session
  console.log('📞 Calling edge function with body:', {
    priceId,
    productType,
    successUrl: successUrl || defaultSuccessUrl,
    cancelUrl: cancelUrl || defaultCancelUrl,
    upsellCredits,
  });
  
  const invokePromise = supabase.functions.invoke('create-stripe-checkout', {
    body: {
      priceId,
      productType,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      upsellCredits,
    },
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Checkout request timed out')), 15000)
  );

  console.log('⏳ Waiting for response...');
  const { data, error } = await Promise.race([invokePromise, timeout]) as any;

  console.log('📦 Response received:', { data, error });

  if (error) {
    console.error('❌ Checkout error:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }

  if (!data?.url) {
    console.error('❌ No checkout URL in response:', data);
    throw new Error('No checkout URL received from server');
  }

  // Track checkout initiation (before redirect)
  const amount = parseFloat(priceId.includes('annual') ? '99' : priceId.includes('monthly') ? '29' : '0');
  console.info('📊 Tracking checkout initiation');
  trackCheckoutFunnel.initiateCheckout(productType, priceId, amount);

  // Redirect with multiple strategies for iframe compatibility
  console.info('🔗 Received Stripe checkout URL:', data.url);
  
  // Try multiple redirect strategies with error handling
  let redirected = false;
  
  try {
    console.info('🔄 Attempting top-level window redirect...');
    if (window.top && window.top !== window.self) {
      window.top.location.href = data.url;
      redirected = true;
      console.info('✅ Top-level redirect initiated');
    }
  } catch (e) {
    console.warn('⚠️ Top-level redirect blocked:', e);
  }
  
  if (!redirected) {
    try {
      console.info('🔄 Attempting parent window redirect...');
      if (window.parent && window.parent !== window.self) {
        window.parent.location.href = data.url;
        redirected = true;
        console.info('✅ Parent redirect initiated');
      }
    } catch (e) {
      console.warn('⚠️ Parent redirect blocked:', e);
    }
  }
  
  if (!redirected) {
    console.info('🔄 Using same-window redirect as fallback...');
    window.location.href = data.url;
    console.info('✅ Same-window redirect initiated');
  }
  
  // Return the URL in case the component needs to handle redirect failure
  return data.url;
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
  
  await initiateStripeCheckout({
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
  
  await initiateStripeCheckout({
    priceId,
    productType,
  });
};
