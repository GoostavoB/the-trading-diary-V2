import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { planId, billingCycle } = await req.json();

    if (!planId || !billingCycle) {
      throw new Error('Missing required parameters: planId and billingCycle');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Define Stripe price IDs for each plan and billing cycle
    // TODO: Replace these with your actual Stripe Price IDs from your Stripe Dashboard
    const priceIds: Record<string, Record<string, string>> = {
      basic: {
        monthly: Deno.env.get('STRIPE_BASIC_MONTHLY_PRICE_ID') ?? 'price_basic_monthly',
        annual: Deno.env.get('STRIPE_BASIC_ANNUAL_PRICE_ID') ?? 'price_basic_annual',
      },
      pro: {
        monthly: Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') ?? 'price_pro_monthly',
        annual: Deno.env.get('STRIPE_PRO_ANNUAL_PRICE_ID') ?? 'price_pro_annual',
      },
      elite: {
        monthly: Deno.env.get('STRIPE_ELITE_MONTHLY_PRICE_ID') ?? 'price_elite_monthly',
        annual: Deno.env.get('STRIPE_ELITE_ANNUAL_PRICE_ID') ?? 'price_elite_annual',
      },
    };

    const priceId = priceIds[planId]?.[billingCycle];

    if (!priceId) {
      throw new Error(`Invalid plan or billing cycle: ${planId} / ${billingCycle}`);
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('APP_URL') ?? 'https://www.thetradingdiary.com'}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL') ?? 'https://www.thetradingdiary.com'}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
