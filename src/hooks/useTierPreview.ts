import { useMemo } from 'react';
import { useUserTier } from './useUserTier';

export type TierLevel = 'free' | 'basic' | 'pro' | 'elite';

export interface TierBenefit {
  feature: string;
  description: string;
  icon: string;
}

export interface TierInfo {
  level: TierLevel;
  name: string;
  xpRequired: number;
  color: string;
  benefits: TierBenefit[];
  unlocks: string[];
}

const mapTierNumberToLevel = (tierNum: number): TierLevel => {
  switch (tierNum) {
    case 1: return 'free';
    case 2: return 'basic';
    case 3: return 'pro';
    case 4: return 'elite';
    default: return 'free';
  }
};

export const useTierPreview = () => {
  const { tierLevel: tierNum, totalXP, xpToNextTier, isLoading } = useUserTier();
  const tierLevel = mapTierNumberToLevel(tierNum);

  const tierData: TierInfo[] = useMemo(() => [
    {
      level: 'free',
      name: 'Apprentice Trader',
      xpRequired: 0,
      color: 'hsl(var(--muted))',
      benefits: [
        { feature: 'Basic Analytics', description: 'Track your trades and basic metrics', icon: '📊' },
        { feature: '1 Connected Account', description: 'Connect one trading account', icon: '🔗' },
        { feature: 'Manual Trade Entry', description: 'Manually log your trades', icon: '✍️' },
        { feature: 'Basic Dashboard', description: 'Essential trading overview', icon: '📈' },
      ],
      unlocks: ['Trade logging', 'Basic metrics', 'Single account']
    },
    {
      level: 'basic',
      name: 'Skilled Trader',
      xpRequired: 1000,
      color: 'hsl(var(--chart-2))',
      benefits: [
        { feature: 'Advanced Analytics', description: 'Deep insights into your trading patterns', icon: '📈' },
        { feature: '3 Connected Accounts', description: 'Manage multiple trading accounts', icon: '🔗' },
        { feature: 'CSV Imports', description: 'Bulk import trades from brokers', icon: '📁' },
        { feature: 'Custom Metrics', description: 'Create your own performance metrics', icon: '⚙️' },
        { feature: 'Trade Tags', description: 'Organize trades with custom tags', icon: '🏷️' },
      ],
      unlocks: ['Multiple accounts', 'Bulk imports', 'Custom metrics', 'Trade organization']
    },
    {
      level: 'pro',
      name: 'Expert Trader',
      xpRequired: 5000,
      color: 'hsl(var(--accent))',
      benefits: [
        { feature: 'AI Trade Analysis', description: 'AI-powered insights on your trades', icon: '🤖' },
        { feature: 'Unlimited Accounts', description: 'Connect as many accounts as needed', icon: '∞' },
        { feature: 'Advanced Charting', description: 'Professional-grade charts', icon: '📊' },
        { feature: 'Risk Management Tools', description: 'Advanced risk assessment', icon: '🛡️' },
        { feature: 'Performance Predictions', description: 'AI forecasts based on your patterns', icon: '🔮' },
        { feature: 'Priority Support', description: 'Get help faster', icon: '⚡' },
      ],
      unlocks: ['AI insights', 'Unlimited accounts', 'Advanced tools', 'Priority support']
    },
    {
      level: 'elite',
      name: 'Master Trader',
      xpRequired: 15000,
      color: 'hsl(var(--primary))',
      benefits: [
        { feature: 'Custom Dashboard', description: 'Fully customizable trading dashboard', icon: '🎨' },
        { feature: 'API Access', description: 'Programmatic access to your data', icon: '🔌' },
        { feature: 'White Label Reports', description: 'Branded performance reports', icon: '📄' },
        { feature: 'Personal AI Assistant', description: 'Dedicated AI trading coach', icon: '🧠' },
        { feature: 'Advanced Automation', description: 'Automate your trading workflow', icon: '⚙️' },
        { feature: 'Exclusive Community', description: 'Access to elite trader network', icon: '👥' },
        { feature: 'Early Feature Access', description: 'Beta features before anyone else', icon: '🚀' },
      ],
      unlocks: ['Full customization', 'API access', 'Elite community', 'All features']
    }
  ], []);

  const currentTierInfo = useMemo(() => 
    tierData.find(t => t.level === tierLevel) || tierData[0],
    [tierLevel, tierData]
  );

  const nextTierInfo = useMemo(() => {
    const currentIndex = tierData.findIndex(t => t.level === tierLevel);
    return currentIndex < tierData.length - 1 ? tierData[currentIndex + 1] : null;
  }, [tierLevel, tierData]);

  const progressToNextTier = useMemo(() => {
    if (!nextTierInfo) return 100;
    const currentTierXP = currentTierInfo.xpRequired;
    const nextTierXP = nextTierInfo.xpRequired;
    const xpInCurrentTier = totalXP - currentTierXP;
    const xpNeededForNext = nextTierXP - currentTierXP;
    return Math.min(100, Math.max(0, (xpInCurrentTier / xpNeededForNext) * 100));
  }, [totalXP, currentTierInfo, nextTierInfo]);

  return {
    tierData,
    currentTierInfo,
    nextTierInfo,
    progressToNextTier,
    xpToNextTier,
    currentXP: totalXP,
    isLoading,
    isMaxTier: tierLevel === 'elite'
  };
};
