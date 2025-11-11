# Pricing Structure Update Summary

**Date:** January 10, 2025
**Status:** ✅ Complete

---

## New Pricing Structure

### STARTER (formerly "Basic")
- **Price:** FREE ($0/month)
- **Button:** "Start free"
- **Key Features:**
  - Onboarding gift: 5 free uploads (one-time)
  - Extra uploads: $5 per 10 uploads
  - Add trades manually
  - Widgets and metrics
  - Emotional, plans, and personal goals
  - Market data: long short ratio and open interest
  - Forecast tool
  - FII analysis to compare exchanges
  - Risk analysis
  - Trading journal
  - Spot wallet
  - Tax report
  - Achievements board
  - Themes: Default blue and Gold Rush only
  - No color customization

### PRO
- **Price:** $15/month or $12/month billed annually ($144/year)
- **Annual Savings:** $36/year (20% off)
- **Button:** "Go Pro"
- **Everything in Starter, plus:**
  - 30 uploads per month
  - Unused uploads roll over to next month
  - Extra uploads: $2 per 10 uploads (60% discount)
  - Full color customization: primary, secondary, and accent
  - Email support

### ELITE
- **Price:** $32/month or $28/month billed annually ($336/year)
- **Annual Savings:** $48/year (12.5% off)
- **Button:** "Get Elite"
- **Everything in Pro, plus:**
  - Unlimited uploads and trades
  - Priority customer support
  - First access to new widgets and new metrics
  - Full color customization

---

## Important Note
**1 upload = up to 10 trades**

**Starter's 5 free uploads are a one-time onboarding gift**

---

## Files Updated

### 1. [src/pages/PricingPage.tsx](src/pages/PricingPage.tsx:49-112)
- Updated plan names: "Basic" → "Starter", etc.
- Updated prices: Starter = $0, Pro = $15/$12, Elite = $32/$28
- Updated all feature lists with new structure
- Removed translation keys, using direct strings

### 2. [src/components/PremiumPricingCard.tsx](src/components/PremiumPricingCard.tsx:110-192)
- Updated to display "Free" for $0 price
- Updated button text to use direct plan CTA keys
- Updated feature display to use direct strings
- Added conditional display for pricing text

### 3. [src/components/Pricing.tsx](src/components/Pricing.tsx:48-261)
- Updated all plans with new pricing structure
- Updated feature lists for all three plans
- Changed display to show "Free" for Starter plan
- Added note: "1 upload = up to 10 trades"

### 4. [src/utils/stripe.ts](src/utils/stripe.ts:45-97)
- Updated `getPlanName()`: "Basic Plan" → "Starter", etc.
- Updated `getPlanPrice()`: Starter = $0, Pro = $15/$12, Elite = $32/$28
- Updated `getAnnualSavings()`: Adjusted for new pricing

### 5. [src/components/layout/UserMenu.tsx](src/components/layout/UserMenu.tsx:38-50)
- Updated `formatPlanName()`: "Free Plan" → "Starter"
- Pro and Elite simplified to just "Pro" and "Elite"

### 6. [src/components/PricingComparison.tsx](src/components/PricingComparison.tsx:15-61)
- Complete rewrite of comparison table
- New categories:
  - Uploads & Trades
  - Trading Tools & Analytics
  - Journaling & Reports
  - Customization
  - Support & Access
- Updated header: "Basic" → "Starter"
- Removed all translation functions
- Added detailed comparison of all features

---

## What's Different

### Pricing Changes
| Plan | Old Price (Monthly) | New Price (Monthly) | Change |
|------|-------------------|-------------------|--------|
| Basic/Starter | $15 | **$0 (FREE)** | -$15 |
| Pro | $35 | **$15** | -$20 |
| Elite | $79 | **$32** | -$47 |

### Annual Pricing Changes
| Plan | Old Annual | New Annual | Monthly Rate | Savings |
|------|-----------|-----------|--------------|---------|
| Starter | $144 | **$0** | $0/month | N/A |
| Pro | $336 | **$144** | $12/month | $36/year |
| Elite | $756 | **$336** | $28/month | $48/year |

### Feature Changes

**Starter (FREE) now includes:**
- 5 free one-time upload credits
- All core features (journal, widgets, analytics, reports)
- Limited themes (Blue & Gold Rush only)
- No color customization

**Pro differentiators:**
- 30 uploads/month with rollover
- Cheaper extra uploads ($2 vs $5)
- Full color customization
- Email support

**Elite differentiators:**
- Unlimited uploads
- Priority support
- Early access to new features

---

## User Journey Updates

### For Free Users (Starter):
1. Sign up → Get 5 free uploads
2. Use core features indefinitely
3. Buy additional uploads at $5/10 uploads
4. See "Upgrade Plan" button in account menu
5. Can upgrade to Pro or Elite anytime

### For Pro Users:
1. Get 30 uploads/month
2. Unused uploads roll over
3. Extra uploads cost 60% less ($2 vs $5)
4. Full color customization
5. Can upgrade to Elite

### For Elite Users:
1. Unlimited uploads and trades
2. Priority support
3. Early access to new features
4. No "Upgrade" button (already on top tier)

---

## Stripe Configuration Updates Needed

⚠️ **IMPORTANT:** You need to update your Stripe products and prices!

### In Stripe Dashboard:

1. **Update/Create Starter Product:**
   - Name: "Starter"
   - Price: $0 (FREE)
   - **Note:** Free plan doesn't need Stripe checkout, handle in-app

2. **Update Pro Product:**
   - Monthly: Change from $35 to **$15**
   - Annual: Change from $336 to **$144** ($12/month)
   - Get new Price IDs

3. **Update Elite Product:**
   - Monthly: Change from $79 to **$32**
   - Annual: Change from $756 to **$336** ($28/month)
   - Get new Price IDs

### Update Supabase Environment Variables:

```bash
# Pro Plan (new prices)
STRIPE_PRO_MONTHLY_PRICE_ID=price_NEW_PRO_MONTHLY_ID
STRIPE_PRO_ANNUAL_PRICE_ID=price_NEW_PRO_ANNUAL_ID

# Elite Plan (new prices)
STRIPE_ELITE_MONTHLY_PRICE_ID=price_NEW_ELITE_MONTHLY_ID
STRIPE_ELITE_ANNUAL_PRICE_ID=price_NEW_ELITE_ANNUAL_ID

# Starter doesn't need Stripe (it's free)
```

---

## Testing Checklist

### Visual Testing:
- [ ] Pricing page displays all three plans correctly
- [ ] Starter shows "Free" instead of "$0"
- [ ] Pro shows $15/month or $12/month annual
- [ ] Elite shows $32/month or $28/month annual
- [ ] All feature lists match new structure
- [ ] Comparison table shows correct features
- [ ] User menu shows "Starter" for free users

### Functionality Testing:
- [ ] Free users can access all Starter features
- [ ] "Start free" button works for Starter
- [ ] "Go Pro" button initiates checkout for $15 (or $12 annual)
- [ ] "Get Elite" button initiates checkout for $32 (or $28 annual)
- [ ] User menu shows correct plan name
- [ ] Upgrade button shows for Starter and Pro users only

### Stripe Testing:
- [ ] Update Stripe products with new prices
- [ ] Get new Price IDs
- [ ] Update Supabase environment variables
- [ ] Test Pro checkout with test card
- [ ] Test Elite checkout with test card
- [ ] Verify webhooks update subscriptions correctly

---

## Important Notes

1. **Starter is FREE:** Users on the "basic" plan_type in database are now on the free Starter plan
2. **Upload Credits:** The 5 free uploads are a one-time gift, not recurring
3. **Rollover:** Only Pro and Elite plans have upload rollover functionality
4. **Support:** Email support is Pro+ only, Priority support is Elite only
5. **Theming:** Basic themes for Starter, full customization for Pro+

---

## Migration Strategy

If you have existing paid users on the old pricing:

1. **Grandfather existing users:**
   - Keep their current pricing (honor their original subscription)
   - Don't force migration to new pricing

2. **New users:**
   - All new signups use new pricing structure
   - Starter is default for free signups

3. **Upgrade pricing:**
   - Existing Pro users can upgrade to Elite at new pricing
   - Existing Basic users upgrade to new Pro pricing ($15/mo)

---

## Success! 🎉

Your pricing structure has been completely updated to reflect:
- ✅ Starter plan is now FREE
- ✅ Pro plan is now $15/month
- ✅ Elite plan is now $32/month
- ✅ All feature lists updated
- ✅ Comparison table updated
- ✅ User menu updated
- ✅ Stripe helper functions updated

**Next Step:** Update your Stripe products with the new pricing and get new Price IDs!
