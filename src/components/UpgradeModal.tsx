import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PremiumPricingCard } from '@/components/PremiumPricingCard';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { CreditCard, Lock, Rocket, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type UpgradeIllustration = 'credits' | 'lock' | 'rocket' | 'chart' | 'palette';
export type UpgradeSource =
  | 'upload_zero_credits'
  | 'feature_lock'
  | 'rate_limit'
  | 'manual'
  | 'batch_upload_zero_credits'
  | 'theme_locked'
  | 'custom_theme_locked'
  | 'background_color_locked';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: UpgradeSource;
  title?: string;
  message?: string;
  illustration?: UpgradeIllustration;
  requiredPlan?: 'basic' | 'pro' | 'elite';
  onPlanSelected?: (planId: string) => void;
}

const illustrations = {
  credits: CreditCard,
  lock: Lock,
  rocket: Rocket,
  chart: TrendingUp,
  palette: Sparkles,
};

const defaultTitles: Record<UpgradeSource, string> = {
  upload_zero_credits: 'Out of AI Credits',
  batch_upload_zero_credits: 'Out of AI Credits',
  feature_lock: 'Premium Feature',
  rate_limit: 'Rate Limit Reached',
  manual: 'Upgrade Your Plan',
  theme_locked: 'Unlock Premium Themes',
  custom_theme_locked: 'Create Custom Themes',
  background_color_locked: 'Background Color Control',
};

const defaultMessages: Record<UpgradeSource, string> = {
  upload_zero_credits: "You've used your monthly AI budget. Upgrade to continue using automatic trade extraction.",
  batch_upload_zero_credits: "You've used your monthly AI budget. Upgrade to process multiple images at once.",
  feature_lock: 'This feature requires a premium subscription. Upgrade to unlock advanced analytics and insights.',
  rate_limit: "You've reached your hourly limit. Upgrade for higher limits and priority processing.",
  manual: 'Choose a plan that fits your trading journey.',
  theme_locked: 'This theme requires a premium subscription.',
  custom_theme_locked: 'Custom themes require a premium subscription.',
  background_color_locked: 'Background color control is available for Elite users.',
};

export const UpgradeModal = ({
  open,
  onOpenChange,
  source,
  title,
  message,
  illustration = 'credits',
  requiredPlan,
  onPlanSelected,
}: UpgradeModalProps) => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const IllustrationIcon = illustrations[illustration];
  const displayTitle = title || defaultTitles[source];
  const displayMessage = message || defaultMessages[source];

  const plans = [
    {
      id: 'starter',
      nameKey: 'pricing.plans.starter.name',
      descriptionKey: 'pricing.plans.starter.description',
      monthlyPrice: 0,
      annualPrice: 0,
      annualTotal: 0,
      features: [
        'AI Extracts for fast trade logging',
        'Unlimited manual uploads',
        'Anti duplicate trade detection',
        'Capital tracking',
        'Simple dashboard',
        'Basic charts',
        'Basic journal',
        'Fee analytics',
        'CSV export',
        'Social features',
      ],
      ctaKey: 'pricing.plans.cta',
      popular: false,
    },
    {
      id: 'pro',
      nameKey: 'pricing.plans.pro.name',
      descriptionKey: 'pricing.plans.pro.description',
      monthlyPrice: 18,
      annualPrice: 14.4,
      annualTotal: 172.8,
      features: [
        '200 AI uploads/month',
        'AI-powered trade analysis',
        'Trading plan builder',
        'Goals & targets tracking',
        'Rich journal with attachments',
        'Custom dashboard widgets',
        'Full social features',
        'Everything in Starter',
      ],
      ctaKey: 'pricing.plans.cta',
      popular: true,
    },
    {
      id: 'elite',
      nameKey: 'pricing.plans.elite.name',
      descriptionKey: 'pricing.plans.elite.description',
      monthlyPrice: 30,
      annualPrice: 24,
      annualTotal: 288,
      features: [
        'Unlimited AI uploads',
        'Advanced AI analysis',
        'Trade replay & visualization',
        'Position size calculator',
        'Risk management dashboard',
        'Advanced performance alerts',
        'Everything in Pro',
      ],
      ctaKey: 'pricing.plans.cta',
      popular: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-4 rounded-full bg-primary/10 p-4"
            >
              <IllustrationIcon className="h-12 w-12 text-primary" />
            </motion.div>
            <DialogTitle className="text-2xl md:text-3xl font-bold mb-2">
              {displayTitle}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground max-w-md">
              {displayMessage}
            </DialogDescription>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center rounded-lg bg-muted p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  Annual
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Save 20%
                  </span>
                </span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {plans.map((plan, index) => (
            <PremiumPricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              index={index}
              t={t}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 7-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
