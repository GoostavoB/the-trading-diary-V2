import { supabase } from '@/integrations/supabase/client';

export interface CheckoutOptions {
  planId: 'basic' | 'pro' | 'elite';
  billingCycle: 'monthly' | 'annual';
}

/**
 * Creates a Stripe checkout session and redirects the user to Stripe
 */
export async function createCheckoutSession({ planId, billingCycle }: CheckoutOptions): Promise<void> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('You must be logged in to purchase a plan');
    }

    // Call Supabase edge function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planId,
        billingCycle,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned from server');
    }

    // Redirect to Stripe checkout
    window.location.href = data.url;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

/**
 * Gets the display name for a plan
 */
export function getPlanName(planId: string): string {
  switch (planId) {
    case 'basic':
      return 'Starter';
    case 'pro':
      return 'Pro';
    case 'elite':
      return 'Elite';
    default:
      return 'Unknown Plan';
  }
}

/**
 * Gets the price for a plan and billing cycle
 */
export function getPlanPrice(planId: string, billingCycle: 'monthly' | 'annual'): number {
  const prices: Record<string, Record<string, number>> = {
    basic: {
      monthly: 0,
      annual: 0,
    },
    pro: {
      monthly: 15,
      annual: 12, // per month when billed annually
    },
    elite: {
      monthly: 32,
      annual: 28,
    },
  };

  return prices[planId]?.[billingCycle] ?? 0;
}

/**
 * Calculates annual savings
 */
export function getAnnualSavings(planId: string): number {
  const prices: Record<string, { monthly: number; annual: number }> = {
    basic: { monthly: 0, annual: 0 },
    pro: { monthly: 15, annual: 144 },
    elite: { monthly: 32, annual: 336 },
  };

  const plan = prices[planId];
  if (!plan) return 0;

  return (plan.monthly * 12) - plan.annual;
}
