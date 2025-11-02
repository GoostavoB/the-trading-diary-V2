/**
 * CREDITS CHECKOUT COMPONENT
 * Allows users to purchase additional upload credits via Stripe
 * Uses Supabase Edge Functions for payment processing
 * 
 * Features:
 * - Tier-based pricing with discounts for Pro/Elite users
 * - Stripe Checkout integration
 * - Automatic credit addition after successful payment
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Zap, TrendingUp, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

export const CreditsCheckout = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan } = useSubscriptionContext();
  
  const [credits, setCredits] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pricing based on tier
  const getPricing = (userTier) => {
    if (userTier === 'pro' || userTier === 'elite') {
      return { 
        base: 2.00, // $2 for 10 credits
        perCredit: 0.20,
        discount: 60 // 60% discount
      };
    }
    return { 
      base: 5.00, // $5 for 10 credits
      perCredit: 0.50,
      discount: 0
    };
  };

  const pricing = getPricing(plan || 'basic');
  
  // Calculate total price (rounds to nearest 10 credits)
  const creditPacks = Math.ceil(credits / 10);
  const actualCredits = creditPacks * 10;
  const totalPrice = creditPacks * pricing.base;
  const savingsVsFree = plan && plan !== 'basic' ? (creditPacks * 5.00) - totalPrice : 0;

  const handlePurchase = async (e) => {
    e.preventDefault();
    
    if (credits < 1) {
      setError('Please enter a valid number of credits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please log in to purchase credits');
      }

      // Call Supabase Edge Function to create Stripe checkout session
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-stripe-checkout',
        {
          body: {
            type: 'credits',
            credits: actualCredits,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message);
      toast({
        title: 'Purchase Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Credit package options
  const packages = [
    { credits: 10, label: 'Starter', popular: false },
    { credits: 30, label: 'Popular', popular: true },
    { credits: 50, label: 'Pro', popular: false },
    { credits: 100, label: 'Ultimate', popular: false },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <CardTitle>Purchase AI Extraction Credits</CardTitle>
        </div>
        <CardDescription>
          Each credit allows one AI-powered trade extraction from screenshots
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tier Discount Banner */}
        {plan && plan !== 'basic' && (
          <Alert className="border-primary/50 bg-primary/10">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              <strong>{plan.toUpperCase()} Member Discount:</strong> Save {pricing.discount}% on all credit purchases!
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Selection Packages */}
        <div>
          <Label className="mb-3 block">Quick Selection</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {packages.map((pkg) => (
              <Button
                key={pkg.credits}
                variant={credits === pkg.credits ? 'default' : 'outline'}
                className="relative flex flex-col h-auto py-4"
                onClick={() => setCredits(pkg.credits)}
                type="button"
              >
                {pkg.popular && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <span className="text-2xl font-bold">{pkg.credits}</span>
                <span className="text-xs opacity-70">{pkg.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <Label htmlFor="credits">Or enter custom amount</Label>
          <div className="relative mt-2">
            <Input
              id="credits"
              type="number"
              min="1"
              max="1000"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 1)}
              className="pr-20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              credits
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Credits are sold in packs of 10. You'll receive {actualCredits} credits.
          </p>
        </div>

        {/* Price Breakdown */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-medium">{actualCredits} credits</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per 10 credits</span>
              <span className="font-medium">${pricing.base.toFixed(2)}</span>
            </div>

            {plan && plan !== 'basic' && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Your savings
                </span>
                <span className="font-medium">-${savingsVsFree.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                ${(totalPrice / actualCredits).toFixed(2)} per credit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Purchase Button */}
        <form onSubmit={handlePurchase}>
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading || credits < 1}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Purchase {actualCredits} Credits for ${totalPrice.toFixed(2)}
              </>
            )}
          </Button>
        </form>

        {/* Info Text */}
        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe. Credits never expire.
        </p>
      </CardContent>
    </Card>
  );
};

export default CreditsCheckout;
