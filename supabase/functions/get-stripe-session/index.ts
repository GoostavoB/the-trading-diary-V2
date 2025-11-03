/**
 * GET STRIPE SESSION DETAILS
 * Retrieves customer email from a completed Stripe checkout session
 * Used for guest checkout → signup flow
 * 
 * Endpoint: POST /functions/v1/get-stripe-session
 * Body: { "sessionId": "cs_xxx" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: 'Stripe not configured' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }

  try {
    const { sessionId } = await req.json()
    
    if (!sessionId) {
      throw new Error('Missing sessionId parameter')
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log('Retrieved Stripe session:', {
      id: session.id,
      email: session.customer_email,
      customer: session.customer,
      payment_status: session.payment_status
    })

    return new Response(
      JSON.stringify({
        email: session.customer_email || session.customer_details?.email,
        customerName: session.customer_details?.name,
        paymentStatus: session.payment_status,
        customerId: session.customer,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error retrieving Stripe session:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to retrieve session' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
