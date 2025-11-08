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
  const startTime = performance.now();
  console.log('🚀 initiateStripeCheckout called with:', params);
  const { priceId, productType, successUrl, cancelUrl, upsellCredits } = params;

  // Import error tracker
  const { checkoutErrorTracker } = await import('./checkoutErrorTracking');
  const browserContext = checkoutErrorTracker.getBrowserContext();

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
    
    // Track validation error
    checkoutErrorTracker.trackCheckoutError({
      step: 'validation',
      errorType: 'validation_error',
      errorMessage: error,
      priceId,
      productType,
      browserContext,
      performance: { timeToError: performance.now() - startTime }
    });
    
    throw new Error(error);
  }

  // Verify user is authenticated (non-blocking)
  console.log('🔐 Checking authentication (non-blocking)...');
  let userId: string | undefined;
  let userEmail: string | undefined;
  
  try {
    const sessionResult: any = await Promise.race([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, error: null }), 2000))
    ]);
    const session = sessionResult?.data?.session || null;
    userId = session?.user?.id;
    userEmail = session?.user?.email;
    console.log('🔐 Session (optional):', session ? 'Found' : 'Not yet');
  } catch (e) {
    console.warn('⚠️ Auth check skipped due to timeout');
    
    // Track auth timeout
    checkoutErrorTracker.trackCheckoutError({
      step: 'authentication',
      errorType: 'timeout_error',
      errorMessage: 'Authentication check timed out',
      priceId,
      productType,
      browserContext,
      performance: { timeToError: performance.now() - startTime }
    });
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
  
  // CRITICAL FIX: Use direct fetch() instead of supabase.functions.invoke()
  // This bypasses the broken Supabase SDK and calls the edge function directly
  const invokePromise = fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(requestBody),
    }
  ).then(async (response) => {
    console.log('📥 Response received:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Edge function returned error:', errorData);
      throw new Error(errorData.error || `Edge function failed with status ${response.status}`);
    }

    const result = await response.json();
    return { data: result, error: null };
  }).catch((err) => {
    console.error('❌ Fetch error:', err);
    return { data: null, error: { message: err.message || 'Unknown error' } };
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Checkout request timed out (60s)')), 60000)
  );

  console.log('⏳ Waiting for response...');
  
  let data: any;
  let error: any;
  
  try {
    const result = await Promise.race([invokePromise, timeout]) as any;
    data = result.data;
    error = result.error;
  } catch (e) {
    // Timeout occurred
    const timeoutError = 'Checkout request timed out (60s)';
    console.error('❌', timeoutError);
    
    checkoutErrorTracker.trackCheckoutError({
      step: 'api_call',
      errorType: 'timeout_error',
      errorMessage: timeoutError,
      priceId,
      productType,
      userId,
      userEmail,
      browserContext,
      performance: { timeToError: performance.now() - startTime }
    });
    
    throw new Error(timeoutError);
  }

  console.log('📦 Response received:', { data, error });

  if (error) {
    console.error('❌ Checkout error:', error);
    
    // Categorize error type
    let errorType: 'stripe_error' | 'network_error' | 'unknown_error' = 'unknown_error';
    const errorMessage = error.message || data?.error || 'Failed to create checkout session';
    
    if (errorMessage.includes('No such price')) {
      errorType = 'stripe_error';
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorType = 'network_error';
    } else if (error.status === 400 || error.status === 404) {
      errorType = 'stripe_error';
    }
    
    checkoutErrorTracker.trackCheckoutError({
      step: 'api_call',
      errorType,
      errorMessage,
      priceId,
      productType,
      userId,
      userEmail,
      browserContext,
      performance: { timeToError: performance.now() - startTime }
    });
    
    throw new Error(errorMessage);
  }

  if (!data?.url) {
    console.error('❌ No checkout URL in response:', data);
    const errorMessage = data?.error || 'No checkout URL received from server';
    
    checkoutErrorTracker.trackCheckoutError({
      step: 'api_call',
      errorType: 'stripe_error',
      errorMessage,
      priceId,
      productType,
      userId,
      userEmail,
      browserContext,
      performance: { timeToError: performance.now() - startTime }
    });
    
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
      
      checkoutErrorTracker.trackPopupBlocked({
        priceId,
        productType,
        userId,
        userEmail,
        browserContext,
      });
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
    
    checkoutErrorTracker.trackCheckoutError({
      step: 'redirect',
      errorType: 'unknown_error',
      errorMessage: `Redirect failed: ${e}`,
      priceId,
      productType,
      userId,
      userEmail,
      browserContext,
      performance: { timeToError: performance.now() - startTime }
    });
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
