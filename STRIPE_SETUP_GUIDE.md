# Stripe Integration Setup Guide

## Overview

This guide will walk you through setting up Stripe payments for TheTradingDiary.com. The integration allows users to:
- Upgrade from Free to Pro or Elite plans
- Upgrade from Pro to Elite plan
- Complete purchases through Stripe Checkout
- Receive automatic subscription updates via webhooks

## Files Created/Modified

### New Files
1. **`supabase/functions/create-checkout-session/index.ts`** - Edge function that creates Stripe checkout sessions
2. **`supabase/functions/stripe-webhook/index.ts`** - Webhook handler for Stripe events
3. **`src/utils/stripe.ts`** - Client-side helper functions for checkout

### Modified Files
1. **`src/components/layout/UserMenu.tsx`** - Added current plan display and upgrade button
2. **`src/components/PremiumPricingCard.tsx`** - Integrated Stripe checkout
3. **`src/components/Pricing.tsx`** - Integrated Stripe checkout

---

## Step 1: Create Stripe Account & Get API Keys

1. Go to [https://stripe.com](https://stripe.com) and create an account (if you don't have one)
2. Navigate to **Developers** → **API keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_test_...` for test mode)
   - **Secret key** (starts with `sk_test_...` for test mode)

---

## Step 2: Create Stripe Products & Prices

You need to create 3 products (Basic, Pro, Elite) with 2 price options each (Monthly and Annual).

### In Stripe Dashboard:

1. Go to **Products** → **Add Product**

### Basic Plan
- **Product Name:** Basic Plan
- **Monthly Price:** $15/month
  - Billing period: Monthly
  - Copy the **Price ID** (e.g., `price_1ABC...`)
- **Annual Price:** $144/year ($12/month)
  - Billing period: Yearly
  - Copy the **Price ID**

### Pro Plan
- **Product Name:** Pro Plan
- **Monthly Price:** $35/month
- **Annual Price:** $336/year ($28/month)

### Elite Plan
- **Product Name:** Elite Plan
- **Monthly Price:** $79/month
- **Annual Price:** $756/year ($63/month)

---

## Step 3: Set Environment Variables

### In Supabase Dashboard:

1. Go to **Project Settings** → **Edge Functions**
2. Add the following environment variables (secrets):

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs - Basic Plan
STRIPE_BASIC_MONTHLY_PRICE_ID=price_1ABC...
STRIPE_BASIC_ANNUAL_PRICE_ID=price_1DEF...

# Stripe Price IDs - Pro Plan
STRIPE_PRO_MONTHLY_PRICE_ID=price_1GHI...
STRIPE_PRO_ANNUAL_PRICE_ID=price_1JKL...

# Stripe Price IDs - Elite Plan
STRIPE_ELITE_MONTHLY_PRICE_ID=price_1MNO...
STRIPE_ELITE_ANNUAL_PRICE_ID=price_1PQR...

# App URL (for redirects)
APP_URL=https://www.thetradingdiary.com
```

**Note:** Use `http://localhost:54321` for `APP_URL` when testing locally.

---

## Step 4: Deploy Supabase Edge Functions

Deploy the two new edge functions:

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook
```

### Get Function URLs

After deployment, get your function URLs:
```bash
supabase functions list
```

You'll get URLs like:
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session`
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`

---

## Step 5: Configure Stripe Webhook

### In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add this to your Supabase environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 6: Test the Integration

### Test Flow:

1. **Local Testing:**
   ```bash
   # Start Supabase locally
   supabase start

   # Start your dev server
   npm run dev
   ```

2. **Test User Journey:**
   - Create a test account or log in
   - Click "Hello, [username]" in the header
   - Verify you see your current plan (should show "Free Plan")
   - Verify you see the "Upgrade Plan" button
   - Click the upgrade button → should redirect to /pricing
   - Click "Get Started" on any plan
   - Should redirect to Stripe Checkout

3. **Use Stripe Test Cards:**
   - Successful payment: `4242 4242 4242 4242`
   - Failed payment: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC
   - Any ZIP code

4. **After Successful Payment:**
   - Should redirect to `/dashboard?checkout=success`
   - Check your Supabase database → `subscriptions` table should have a new row
   - User's plan should be updated
   - Click user menu again → should show upgraded plan
   - "Upgrade" button should disappear if on Elite plan

---

## Step 7: Verify Database Updates

### Check Subscriptions Table:

```sql
-- View all subscriptions
SELECT * FROM subscriptions;

-- View a specific user's subscription
SELECT * FROM subscriptions WHERE user_id = 'USER_ID_HERE';
```

### Expected Fields:
- `plan_type`: 'basic', 'pro', or 'elite'
- `status`: 'active', 'canceled', 'past_due', etc.
- `stripe_customer_id`: Customer ID from Stripe
- `stripe_subscription_id`: Subscription ID from Stripe
- `billing_cycle`: 'monthly' or 'annual'
- `current_period_start` & `current_period_end`: Subscription period dates

---

## Step 8: Go Live (Production)

### When ready for production:

1. **Switch to Live Mode in Stripe:**
   - Go to Stripe Dashboard → Toggle **Test mode** to **Live mode**
   - Get new live API keys (start with `pk_live_...` and `sk_live_...`)

2. **Create Live Products:**
   - Recreate all products and prices in live mode
   - Get new live price IDs

3. **Update Environment Variables:**
   - Update all Supabase secrets with live keys and price IDs

4. **Update Webhook:**
   - Create a new webhook endpoint in live mode
   - Get new live webhook secret (`whsec_...` for live)

5. **Test with Real Cards:**
   - Use small amounts for initial testing
   - Test subscription cancellation flow
   - Verify refunds work correctly

---

## Troubleshooting

### Issue: "Failed to create checkout session"

**Possible causes:**
1. Missing or incorrect Stripe API keys
2. Price IDs don't exist or are incorrect
3. User not authenticated

**Solution:**
- Check Supabase logs: `supabase functions logs create-checkout-session`
- Verify all environment variables are set correctly
- Check Stripe dashboard for API errors

---

### Issue: Webhook not receiving events

**Possible causes:**
1. Webhook URL is incorrect
2. Webhook secret is wrong
3. Events not selected in Stripe dashboard

**Solution:**
- Check webhook logs in Stripe Dashboard → Webhooks → Click your endpoint
- Check Supabase logs: `supabase functions logs stripe-webhook`
- Verify webhook signature verification is passing

---

### Issue: Subscription not updating in database

**Possible causes:**
1. Webhook handler has errors
2. Database permissions issues
3. Metadata not passed correctly from checkout

**Solution:**
- Check Supabase logs for errors
- Verify the `subscriptions` table exists and has correct structure
- Check that user_id is being passed in metadata

---

## Security Best Practices

1. **Never expose Stripe Secret Key:**
   - Only use in edge functions (server-side)
   - Never commit to git
   - Use environment variables

2. **Verify Webhook Signatures:**
   - Already implemented in `stripe-webhook/index.ts`
   - Prevents unauthorized webhook calls

3. **Use Stripe Test Mode:**
   - Always test thoroughly before going live
   - Use test cards, not real payment methods

4. **Monitor Stripe Dashboard:**
   - Check for failed payments
   - Monitor subscription metrics
   - Set up alerts for issues

---

## Success Indicators

✅ User can see current plan in account dropdown
✅ Upgrade button shows for Free and Pro users only
✅ Clicking "Get Started" on pricing page initiates checkout
✅ Successful payment redirects to dashboard
✅ Database subscription record is created/updated
✅ User menu reflects new plan after upgrade
✅ Webhook events are being received and processed

---

## Support & Resources

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Stripe Webhooks Guide:** https://stripe.com/docs/webhooks

---

## Next Steps

1. Set up email notifications for successful purchases (Stripe has built-in receipts)
2. Add subscription management page where users can:
   - View billing history
   - Update payment method
   - Cancel subscription
   - View next billing date
3. Implement usage-based billing if needed
4. Add analytics to track conversion rates

---

**Congratulations!** 🎉 Your Stripe integration is complete. Users can now upgrade their plans seamlessly.
