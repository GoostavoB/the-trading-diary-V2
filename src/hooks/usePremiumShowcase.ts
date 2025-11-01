import { useSubscription } from '@/contexts/SubscriptionContext';

export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  requiredPlan: 'pro' | 'elite';
  benefits: string[];
  demoAvailable?: boolean;
}

export const usePremiumShowcase = () => {
  const { currentPlan, canAccessFeature } = useSubscription();

  const features: PremiumFeature[] = [
    {
      id: 'ai-insights',
      title: 'AI-Powered Trading Insights',
      description: 'Get personalized recommendations and pattern analysis',
      icon: '🤖',
      requiredPlan: 'pro',
      benefits: [
        'Pattern recognition across your trades',
        'Personalized improvement suggestions',
        'Risk analysis and alerts',
        'Market correlation insights'
      ],
      demoAvailable: true
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics Dashboard',
      description: 'Deep dive into your trading performance',
      icon: '📊',
      requiredPlan: 'pro',
      benefits: [
        'Custom metrics and KPIs',
        'Win rate by time of day',
        'Profit factor analysis',
        'Drawdown tracking'
      ]
    },
    {
      id: 'unlimited-history',
      title: 'Unlimited Trade History',
      description: 'Access your complete trading history',
      icon: '📚',
      requiredPlan: 'pro',
      benefits: [
        'No limits on stored trades',
        'Historical data analysis',
        'Long-term trend identification',
        'Performance over time'
      ]
    },
    {
      id: 'multi-account',
      title: 'Multiple Trading Accounts',
      description: 'Connect and manage multiple brokerage accounts',
      icon: '🔗',
      requiredPlan: 'elite',
      benefits: [
        'Connect up to 10 accounts',
        'Cross-account analytics',
        'Portfolio-level insights',
        'Unified performance tracking'
      ]
    },
    {
      id: 'advanced-backtesting',
      title: 'Advanced Backtesting',
      description: 'Test strategies against historical data',
      icon: '🔬',
      requiredPlan: 'elite',
      benefits: [
        'Strategy simulation',
        'What-if analysis',
        'Historical pattern matching',
        'Risk scenario testing'
      ]
    },
    {
      id: 'priority-support',
      title: 'Priority Support',
      description: 'Get help when you need it most',
      icon: '🎯',
      requiredPlan: 'elite',
      benefits: [
        '24/7 priority support',
        'Dedicated account manager',
        'Custom feature requests',
        'Early access to new features'
      ]
    }
  ];

  const getFeaturesByPlan = (plan: 'pro' | 'elite') => {
    return features.filter(f => f.requiredPlan === plan);
  };

  const getLockedFeatures = () => {
    return features.filter(f => !canAccessFeature(f.requiredPlan));
  };

  return {
    features,
    currentPlan,
    canAccessFeature,
    getFeaturesByPlan,
    getLockedFeatures
  };
};
