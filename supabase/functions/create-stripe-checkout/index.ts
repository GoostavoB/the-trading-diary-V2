/**
 * STRIPE CHECKOUT SESSION CREATION V2
 * Creates Stripe checkout sessions for subscriptions (monthly/annual) and credit purchases
 * 
 * Endpoint: POST /functions/v1/create-stripe-checkout
 * 
 * Body:
 * {
 *   "priceId": "price_xxx",
 *   "productType": "subscription_monthly" | "subscription_annual" | "credits_starter" | "credits_pro",
 *   "successUrl": "optional",
 *   "cancelUrl": "optional"
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔵 create-stripe-checkout: Function invoked');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders })
  }

  // Check Stripe key immediately
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  console.log('🔐 Stripe key status:', stripeKey ? '✅ Found' : '❌ MISSING');
  
  if (!stripeKey) {
    console.error('❌ CRITICAL: STRIPE_SECRET_KEY not configured in Supabase');
    return new Response(
      JSON.stringify({ error: 'Stripe configuration error. Please contact support.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Try to identify the user (optional)
    let user: any = null
    try {
      const { data, error } = await supabaseClient.auth.getUser()
      if (error) {
        console.warn('Auth getUser error (non-blocking):', error.message)
      } else {
        user = data?.user ?? null
      }
    } catch (e) {
      console.warn('Auth check failed (non-blocking)', e)
    }

    const { priceId, productType, successUrl, cancelUrl, upsellCredits } = await req.json()

    if (!priceId || !productType) {
      throw new Error('Missing required parameters: priceId and productType')
    }

    console.log('Creating checkout session for:', {
      userId: user?.id || 'guest',
      email: user?.email || 'guest',
      priceId,
      productType,
    })

    // Build line items - start with the main subscription/product
    const lineItems: any[] = [
      {
        price: priceId,
        quantity: 1,
      },
    ];

    // If upsellCredits is provided (annual upgrade promo), add discounted credit packs
    if (upsellCredits && upsellCredits > 0) {
      const creditPacks = Math.floor(upsellCredits / 10); // Each pack is 10 credits
      if (creditPacks > 0) {
        lineItems.push({
          price: 'price_annual_upsell_credits', // Stripe price ID for $1/10 credits
          quantity: creditPacks,
        });
        console.log('Adding upsell credits:', { creditPacks, totalCredits: upsellCredits });
      }
    }

    // Determine session configuration based on product type
    let sessionConfig: any = {
      customer_email: user?.email,
      client_reference_id: user?.id,
      line_items: lineItems,
      mode: 'payment', // Default to payment mode
      success_url: successUrl || `${Deno.env.get('FRONTEND_URL')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${Deno.env.get('FRONTEND_URL')}/#pricing-section`,
      metadata: {
        user_id: user?.id || '',
        product_type: productType,
        upsell_credits: upsellCredits || 0,
      },
    }

    // Configure based on product type
    switch (productType) {
      case 'subscription_monthly':
      case 'subscription_annual':
        sessionConfig.mode = 'subscription'
        sessionConfig.metadata.subscription_type = productType
        // Enable customer portal access for subscriptions
        sessionConfig.subscription_data = {
          metadata: {
            user_id: user?.id || '',
          },
        }
        break

      case 'credits_starter':
      case 'credits_pro':
        sessionConfig.mode = 'payment'
        sessionConfig.metadata.credit_type = productType
        // Both give 10 credits, price differs
        const creditAmount = 10
        sessionConfig.metadata.credit_amount = creditAmount.toString()
        break

      default:
        throw new Error(`Unknown product type: ${productType}`)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('Checkout session created:', session.id)

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
