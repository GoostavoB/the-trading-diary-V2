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

  // Validate productType
  const validProductTypes: Array<CheckoutParams['productType']> = [
    'subscription_monthly',
    'subscription_annual',
    'credits_starter',
    'credits_pro'
  ];
  
  if (!validProductTypes.includes(productType)) {
    const error = `Invalid productType: "${productType}". Must be one of: ${validProductTypes.join(', ')}`;
    console.error('❌', error);
    throw new Error(error);
  }

  // Verify user is authenticated (non-blocking)
  console.log('🔐 Checking authentication (non-blocking)...');
  try {
    const sessionResult: any = await Promise.race([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, error: null }), 2000))
    ]);
    const session = sessionResult?.data?.session || null;
    console.log('🔐 Session (optional):', session ? 'Found' : 'Not yet');
  } catch (e) {
    console.warn('⚠️ Auth check skipped due to timeout');
  }


  // Set default URLs if not provided
  const frontendUrl = window.location.origin;
  const defaultSuccessUrl = `${frontendUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = `${frontendUrl}/#pricing-section`;

  // Call Edge Function to create Stripe checkout session
  // Build request body - only include upsellCredits if defined
  const requestBody: any = {
    priceId,
    productType,
    successUrl: successUrl || defaultSuccessUrl,
    cancelUrl: cancelUrl || defaultCancelUrl,
  };
  
  if (upsellCredits !== undefined) {
    requestBody.upsellCredits = upsellCredits;
  }

  console.log('📞 Calling edge function with body:', requestBody);
  
  const invokePromise = supabase.functions.invoke('create-stripe-checkout', {
    body: requestBody,
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Checkout request timed out (60s)')), 60000)
  );

  console.log('⏳ Waiting for response...');
  const { data, error } = await Promise.race([invokePromise, timeout]) as any;

  console.log('📦 Response received:', { data, error });

  if (error) {
    console.error('❌ Checkout error:', error);
    // Surface the exact error from the backend
    const errorMessage = error.message || data?.error || 'Failed to create checkout session';
    throw new Error(errorMessage);
  }

  if (!data?.url) {
    console.error('❌ No checkout URL in response:', data);
    const errorMessage = data?.error || 'No checkout URL received from server';
    throw new Error(errorMessage);
  }

  // Track checkout initiation (before redirect)
  const amount = parseFloat(priceId.includes('annual') ? '99' : priceId.includes('monthly') ? '29' : '0');
  console.info('📊 Tracking checkout initiation');
  trackCheckoutFunnel.initiateCheckout(productType, priceId, amount);

  // Detect if running in iframe (like Lovable preview)
  const isInIframe = window.self !== window.top;
  console.info('🔗 Received Stripe checkout URL:', data.url);
  console.info('🖼️ Running in iframe:', isInIframe);
  
  // For iframe environments, open in new tab (most reliable method)
  if (isInIframe) {
    console.info('🔄 Opening checkout in new tab (iframe-friendly)...');
    const opened = window.open(data.url, '_blank');
    if (!opened) {
      console.warn('⚠️ Popup blocked - returning URL for manual redirect');
    } else {
      console.info('✅ Checkout opened in new tab');
    }
    // Always return URL so CheckoutRedirect can show manual button
    return data.url;
  }
  
  // For non-iframe, try normal redirects
  let redirected = false;
  
  try {
    console.info('🔄 Attempting same-window redirect...');
    window.location.href = data.url;
    redirected = true;
    console.info('✅ Same-window redirect initiated');
  } catch (e) {
    console.warn('⚠️ Redirect failed:', e);
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
