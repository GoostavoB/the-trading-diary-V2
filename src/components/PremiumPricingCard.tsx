import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { MagneticButton } from './MagneticButton';
import { useNavigate } from 'react-router-dom';

interface PricingPlan {
  id: string;
  nameKey: string;
  descriptionKey: string;
  monthlyPrice: number;
  annualPrice: number;
  annualTotal: number;
  featuresKeys: string[];
  ctaKey: string;
  popular: boolean;
}

interface PremiumPricingCardProps {
  plan: PricingPlan;
  billingCycle: 'monthly' | 'annual';
  index: number;
  t: (key: string, params?: any) => string;
}

export const PremiumPricingCard = ({ plan, billingCycle, index, t }: PremiumPricingCardProps) => {
  const navigate = useNavigate();
  
  const getDisplayPrice = () => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = () => {
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
        className={`p-8 h-full flex flex-col ${plan.popular ? 'scale-105' : ''}`}
      >
        {plan.popular && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-accent/80 to-primary/80 rounded-full text-xs font-semibold tracking-wide"
          >
            {t('pricing.mostPopular')}
          </motion.div>
        )}

        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
            {t(plan.nameKey)}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(plan.descriptionKey)}
          </p>
        </div>

        <div className="mb-8">
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
            <span className="text-sm text-muted-foreground">
              /{billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perMonthBilledAnnually')}
            </span>
          </div>
          {billingCycle === 'annual' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.28 }}
              className="text-xs text-green-400 font-medium"
            >
              {t('pricing.savingsAmount', { amount: getSavings() })}
            </motion.div>
          )}
        </div>

        <MagneticButton
          onClick={() => navigate('/auth')}
          variant={plan.popular ? 'default' : 'outline'}
          className="w-full mb-8 py-6 text-base font-medium"
        >
          {t(plan.ctaKey)}
        </MagneticButton>

        <ul className="space-y-4 flex-1">
          {plan.featuresKeys.map((featureKey, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.28,
                delay: index * 0.09 + i * 0.05,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="flex items-start gap-3 group"
            >
              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-all duration-280 ease-premium">
                <Check size={14} className="text-accent" />
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-280 ease-premium">
                {t(featureKey)}
              </span>
            </motion.li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
};
