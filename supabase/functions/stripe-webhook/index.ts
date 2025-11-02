import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )

    console.log('Webhook event received:', event.type)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      // Subscription events
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)

        const userId = session.metadata?.user_id || session.client_reference_id
        const productType = session.metadata?.product_type

        if (!userId) {
          console.error('No user_id found in session')
          break
        }

        // Handle subscription checkouts
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          // Determine tier and interval from metadata
          const tier = productType?.includes('elite') ? 'elite' : 'pro'
          const interval = productType?.includes('annual') ? 'year' : 'month'

          // Upsert subscription record
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0].price.id,
                status: subscription.status,
                tier: tier,
                interval: interval,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              },
              { onConflict: 'user_id' }
            )

          if (subError) {
            console.error('Error upserting subscription:', subError)
          } else {
            console.log('Subscription created/updated for user:', userId)
          }

          // Update profile with subscription tier
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              subscription_tier: tier,
              subscription_status: subscription.status
            })
            .eq('id', userId)

          if (profileError) {
            console.error('Error updating profile:', profileError)
          }
        }

        // Handle credit purchases
        if (session.mode === 'payment' && session.metadata?.credit_type) {
          const creditAmount = parseInt(session.metadata.credit_amount || '0')
          const creditType = session.metadata.credit_type

          if (creditAmount > 0) {
            // Add credits to user's balance
            const { error: creditError } = await supabase.rpc('add_credits', {
              p_user_id: userId,
              p_amount: creditAmount
            })

            if (creditError) {
              console.error('Error adding credits:', creditError)
            } else {
              console.log(`Added ${creditAmount} credits to user ${userId}`)
            }

            // Record transaction
            const { error: txError } = await supabase
              .from('transactions')
              .insert({
                user_id: userId,
                type: 'credit_purchase',
                amount: session.amount_total ? session.amount_total / 100 : 0,
                credits: creditAmount,
                stripe_payment_intent_id: session.payment_intent as string,
                description: `Purchased ${creditAmount} credits (${creditType})`,
                status: 'completed'
              })

            if (txError) {
              console.error('Error recording transaction:', txError)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', subscription.id)

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id, tier')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSub) {
          // Determine interval from subscription
          const interval = subscription.items.data[0].price.recurring?.interval === 'year' ? 'year' : 'month'

          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              interval: interval,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error updating subscription:', error)
          }

          // Update profile status
          await supabase
            .from('profiles')
            .update({ subscription_status: subscription.status })
            .eq('id', existingSub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', subscription.id)

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSub) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error canceling subscription:', error)
          }

          // Update profile to free tier
          await supabase
            .from('profiles')
            .update({ 
              subscription_tier: 'free',
              subscription_status: 'canceled'
            })
            .eq('id', existingSub.user_id)

          console.log('Subscription canceled for user:', existingSub.user_id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)

        if (invoice.subscription) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id, tier')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (sub) {
            // Record transaction
            await supabase
              .from('transactions')
              .insert({
                user_id: sub.user_id,
                type: 'subscription_payment',
                amount: invoice.amount_paid / 100,
                stripe_invoice_id: invoice.id,
                description: `${sub.tier} subscription payment`,
                status: 'completed'
              })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)

        if (invoice.subscription) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (sub) {
            // Update subscription status
            await supabase
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('stripe_subscription_id', invoice.subscription)

            // Update profile status
            await supabase
              .from('profiles')
              .update({ subscription_status: 'past_due' })
              .eq('id', sub.user_id)
          }
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
