import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'

// Helper function to send order confirmation email
async function sendOrderConfirmationEmail(
  email: string,
  name: string | null,
  orderDetails: any,
  productType: string,
  invoicePdfUrl?: string
) {
  try {
    console.log(`Sending confirmation email to ${email}`)
    const response = await fetch(`${supabaseUrl}/functions/v1/send-checkout-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email,
        name: name || 'Valued Customer',
        orderDetails,
        productType,
        invoicePdfUrl,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send confirmation email:', error)
    } else {
      console.log('Confirmation email sent successfully')
    }
  } catch (error: any) {
    console.error('Error sending confirmation email:', error.message)
  }
}

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
          const monthlyCredits = tier === 'elite' ? 150 : 30

          // Upsert subscription record with monthly credits
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0].price.id,
                status: subscription.status,
                plan_type: tier,
                tier: tier,
                interval: interval,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                upload_credits_balance: monthlyCredits,
                monthly_upload_limit: monthlyCredits,
              },
              { onConflict: 'user_id' }
            )

          if (subError) {
            console.error('Error upserting subscription:', subError)
          } else {
            console.log(`Subscription created/updated for user: ${userId}, awarded ${monthlyCredits} credits`)
          }

          // Update profile with subscription tier and complete onboarding
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              subscription_tier: tier,
              subscription_status: subscription.status,
              plan_started_at: new Date().toISOString(),
              onboarding_completed: true,
            })
            .eq('id', userId)

          if (profileError) {
            console.error('Error updating profile:', profileError)
          }
          
          // Log analytics
          try {
            await supabase.from('user_analytics_events').insert({
              user_id: userId,
              event_name: 'subscription_created',
              event_params: { plan: tier, credits_awarded: monthlyCredits, amount: session.amount_total ? session.amount_total / 100 : 0 }
            })
          } catch (err: any) {
            console.log('Analytics logging skipped:', err.message)
          }

          // Save order to orders table
          try {
            await supabase.from('orders').insert({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_invoice_id: session.invoice as string,
              amount_total: session.amount_total || 0,
              currency: session.currency || 'usd',
              customer_email: session.customer_details?.email || '',
              customer_name: session.customer_details?.name || null,
              payment_status: session.payment_status || 'unpaid',
              product_type: productType || 'subscription',
              product_name: `${tier.toUpperCase()} ${interval === 'year' ? 'Annual' : 'Monthly'} Subscription`,
              quantity: 1,
              metadata: { mode: session.mode, interval, tier }
            })
            console.log('Order saved successfully')

            // Fetch invoice PDF URL if available
            let invoicePdfUrl: string | undefined
            if (session.invoice) {
              try {
                const invoice = await stripe.invoices.retrieve(session.invoice as string)
                invoicePdfUrl = invoice.invoice_pdf || undefined
                console.log('Invoice PDF URL retrieved:', invoicePdfUrl)
              } catch (err: any) {
                console.error('Error fetching invoice PDF:', err.message)
              }
            }

            // Send confirmation email
            await sendOrderConfirmationEmail(
              session.customer_details?.email || '',
              session.customer_details?.name || null,
              {
                amount: session.amount_total || 0,
                currency: session.currency || 'usd',
                sessionId: session.id,
                items: [{
                  description: `${tier.toUpperCase()} ${interval === 'year' ? 'Annual' : 'Monthly'} Subscription`,
                  amount_total: session.amount_total || 0
                }]
              },
              productType || 'subscription',
              invoicePdfUrl
            )
          } catch (err: any) {
            console.error('Error saving order:', err)
          }
        }

        // Handle credit purchases
        if (session.mode === 'payment' && session.metadata?.product_type?.includes('credits')) {
          const creditQuantity = parseInt(session.metadata.credit_quantity || '0')

          if (creditQuantity > 0) {
            // Add credits using new RPC function
            const { error: creditError } = await supabase.rpc('increment_upload_credits', {
              p_user_id: userId,
              p_credits: creditQuantity
            })

            if (creditError) {
              console.error('Error adding credits:', creditError)
            } else {
              console.log(`Added ${creditQuantity} credits to user ${userId}`)
            }

            // Log analytics
            await supabase.from('user_analytics_events').insert({
              user_id: userId,
              event_name: 'credits_purchased',
              event_params: { credits: creditQuantity, amount: session.amount_total ? session.amount_total / 100 : 0 }
            })

            // Record transaction if table exists
            try {
              await supabase
                .from('transactions')
                .insert({
                  user_id: userId,
                  type: 'credit_purchase',
                  amount: session.amount_total ? session.amount_total / 100 : 0,
                  credits: creditQuantity,
                  stripe_payment_intent_id: session.payment_intent as string,
                  description: `Purchased ${creditQuantity} credits`,
                  status: 'completed'
                })
              console.log('Transaction recorded')
            } catch (err: any) {
              console.log('Transaction recording skipped (table may not exist):', err.message)
            }

            // Save order to orders table
            try {
              await supabase.from('orders').insert({
                user_id: userId,
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                stripe_invoice_id: session.invoice as string,
                amount_total: session.amount_total || 0,
                currency: session.currency || 'usd',
                customer_email: session.customer_details?.email || '',
                customer_name: session.customer_details?.name || null,
                payment_status: session.payment_status || 'unpaid',
                product_type: productType || 'credits',
                product_name: `${creditQuantity} Upload Credits`,
                quantity: creditQuantity,
                metadata: { mode: session.mode, credits: creditQuantity }
              })
              console.log('Order saved successfully')

              // Fetch invoice PDF URL if available
              let invoicePdfUrl: string | undefined
              if (session.invoice) {
                try {
                  const invoice = await stripe.invoices.retrieve(session.invoice as string)
                  invoicePdfUrl = invoice.invoice_pdf || undefined
                  console.log('Invoice PDF URL retrieved:', invoicePdfUrl)
                } catch (err: any) {
                  console.error('Error fetching invoice PDF:', err.message)
                }
              }

              // Send confirmation email
              await sendOrderConfirmationEmail(
                session.customer_details?.email || '',
                session.customer_details?.name || null,
                {
                  amount: session.amount_total || 0,
                  currency: session.currency || 'usd',
                  sessionId: session.id,
                  items: [{
                    description: `${creditQuantity} Upload Credits`,
                    amount_total: session.amount_total || 0
                  }]
                },
                productType || 'credits',
                invoicePdfUrl
              )
            } catch (err: any) {
              console.error('Error saving order:', err)
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
            // Renew monthly credits
            const monthlyCredits = sub.tier === 'elite' ? 150 : 30;
            
            await supabase
              .from('subscriptions')
              .update({
                upload_credits_balance: monthlyCredits,
                upload_credits_used_this_month: 0,
              })
              .eq('user_id', sub.user_id);
            
            console.log(`Renewed ${monthlyCredits} credits for user ${sub.user_id}`);

            // Record transaction
            try {
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
            } catch (err: any) {
              console.log('Transaction recording skipped:', err.message)
            }
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
