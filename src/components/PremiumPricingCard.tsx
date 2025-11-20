import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { MagneticButton } from './MagneticButton';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PricingPlan {
  id: string;
  nameKey: string;
  descriptionKey: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualTotal: number | null;
  features: string[];
  ctaKey: string;
  popular: boolean;
  comingSoon?: boolean;
}

interface PremiumPricingCardProps {
  plan: PricingPlan;
  billingCycle: 'monthly' | 'annual';
  index: number;
  t: (key: string, params?: any) => string;
}

export const PremiumPricingCard = ({ plan, billingCycle, index, t }: PremiumPricingCardProps) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  
  const handleCTA = () => {
    if (plan.comingSoon) return;
    const authPath = currentLang === 'en' ? '/auth?mode=signup' : `/${currentLang}/auth?mode=signup`;
    navigate(authPath);
  };
  
  const getDisplayPrice = () => {
    if (plan.monthlyPrice === null || plan.annualPrice === null) return null;
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = () => {
    if (plan.monthlyPrice === null || plan.annualTotal === null) return 0;
    return (plan.monthlyPrice * 12) - plan.annualTotal;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.45,
        delay: index * 0.09,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="h-full"
    >
      <GlassCard 
        elevated={plan.popular}
        className={`group p-8 h-full flex flex-col relative ${plan.popular ? 'scale-105' : ''}`}
        style={plan.popular ? {
          boxShadow: 'inset 0 -2px 0 0 rgba(255,255,255,0.15), 0 0 60px rgba(200, 220, 240, 0.08), 0 24px 70px -15px rgba(0, 0, 0, 0.5)'
        } : undefined}
      >
        {plan.popular && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="absolute -top-3 right-6 px-6 py-2 bg-gradient-to-r from-primary via-accent to-primary bg-size-200 animate-gradient rounded-full text-xs font-bold tracking-wider text-primary-foreground shadow-lg shadow-primary/25"
          >
            {t('pricing.mostPopular')}
          </motion.div>
        )}

        {plan.comingSoon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="absolute -top-3 right-6 px-6 py-2 bg-gradient-to-r from-accent via-primary to-accent bg-size-200 animate-gradient rounded-full text-xs font-bold tracking-wider text-primary-foreground shadow-lg shadow-accent/25"
          >
            Coming Soon
          </motion.div>
        )}

        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
            {plan.comingSoon ? plan.nameKey : t(plan.nameKey)}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground/70 leading-relaxed">
            {plan.comingSoon ? plan.descriptionKey : t(plan.descriptionKey)}
          </p>
        </div>

        <div className="mb-8">
          {getDisplayPrice() !== null ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <motion.span 
                  key={`${billingCycle}-${getDisplayPrice()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl font-bold tracking-tight tabular-nums"
                  style={{ 
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em'
                  }}
                >
                  ${getDisplayPrice()}
                </motion.span>
                <span className="text-sm text-muted-foreground dark:text-muted-foreground/70">
                  /{billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perMonthBilledAnnually')}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.28 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                >
                  <span className="text-sm font-bold text-primary">
                    {t('pricing.savingsAmount', { amount: getSavings() })}
                  </span>
                </motion.div>
              )}
            </>
          ) : (
            <div className="text-3xl font-bold tracking-tight mb-2">
              Custom Pricing
            </div>
          )}
        </div>

        <MagneticButton
          onClick={handleCTA}
          variant={plan.popular ? 'default' : 'outline'}
          className={`w-full mb-8 py-6 text-base font-medium ${plan.comingSoon ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {plan.comingSoon ? plan.ctaKey : t(plan.ctaKey)}
        </MagneticButton>

        <ul className="space-y-4 flex-1">
          {plan.features.map((feature, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.28,
                delay: index * 0.09 + i * 0.05,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="flex items-start gap-3"
            >
              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-all duration-280 ease-premium">
                <Check size={14} className="text-accent" />
              </div>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground/70 leading-relaxed group-hover:text-foreground transition-colors duration-280 ease-premium">
                {plan.comingSoon ? feature : feature}
              </span>
            </motion.li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
};
