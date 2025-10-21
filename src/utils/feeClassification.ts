export interface FeeClassification {
  tier: string;
  label: string;
  color: string;
  bgColor: string;
  minPercent: number;
  maxPercent?: number;
  description: string;
  recommendation: string;
}

export const FEE_TIERS: FeeClassification[] = [
  { 
    tier: 'super-low', 
    label: 'Super Low', 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/20 border-green-500/30',
    minPercent: 0, 
    maxPercent: 0.02, 
    description: 'VIP tier rates from major exchanges',
    recommendation: 'Excellent fee structure - maintain this level'
  },
  { 
    tier: 'very-low', 
    label: 'Very Low', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
    minPercent: 0.02, 
    maxPercent: 0.10, 
    description: 'Maker rates on premium exchanges',
    recommendation: 'Great rates - optimal for active trading'
  },
  { 
    tier: 'low', 
    label: 'Low', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    minPercent: 0.10, 
    maxPercent: 0.30, 
    description: 'Standard taker rates',
    recommendation: 'Good rates - acceptable for most strategies'
  },
  { 
    tier: 'ok', 
    label: 'OK/Fair', 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    minPercent: 0.30, 
    maxPercent: 0.50, 
    description: 'Budget-friendly exchanges like BingX',
    recommendation: 'Acceptable - consider upgrading for high-frequency trading'
  },
  { 
    tier: 'high', 
    label: 'High', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    minPercent: 0.50, 
    maxPercent: 1.0, 
    description: 'DEX or exotic pairs',
    recommendation: 'High fees - only use for specific strategies'
  },
  { 
    tier: 'abusive', 
    label: 'Abusive', 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/20 border-red-500/30',
    minPercent: 1.0, 
    description: 'Excessive fees - avoid these exchanges',
    recommendation: '⚠️ Avoid! These fees will destroy profitability'
  },
];

export const classifyFee = (feePercent: number): FeeClassification => {
  const tier = FEE_TIERS.find(t => 
    feePercent >= t.minPercent && (!t.maxPercent || feePercent < t.maxPercent)
  );
  return tier || FEE_TIERS[FEE_TIERS.length - 1];
};

// Context-aware fee thresholds based on trade type
export interface FeeThresholds {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

export const FEE_THRESHOLDS: Record<string, FeeThresholds> = {
  spot: {
    excellent: 0.10,
    good: 0.20,
    acceptable: 0.30,
    poor: 0.50,
  },
  futures: {
    excellent: 0.02,
    good: 0.05,
    acceptable: 0.10,
    poor: 0.20,
  },
  dex: {
    excellent: 0.30,
    good: 0.50,
    acceptable: 1.0,
    poor: 2.0,
  },
};

// Strategy-based fee targets
export interface StrategyFeeTarget {
  maxFee: number;
  reason: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export const STRATEGY_FEE_TARGETS: Record<string, StrategyFeeTarget> = {
  scalping: { 
    maxFee: 0.05, 
    reason: 'Tight margins require ultra-low fees',
    impact: 'critical'
  },
  'day trading': { 
    maxFee: 0.15, 
    reason: 'Multiple trades need efficient execution',
    impact: 'high'
  },
  daytrading: { 
    maxFee: 0.15, 
    reason: 'Multiple trades need efficient execution',
    impact: 'high'
  },
  'swing trading': { 
    maxFee: 0.30, 
    reason: 'Fees less critical for larger moves',
    impact: 'medium'
  },
  swingtrading: { 
    maxFee: 0.30, 
    reason: 'Fees less critical for larger moves',
    impact: 'medium'
  },
  'position trading': { 
    maxFee: 0.50, 
    reason: 'Long-term holds minimize fee impact',
    impact: 'low'
  },
  positiontrading: { 
    maxFee: 0.50, 
    reason: 'Long-term holds minimize fee impact',
    impact: 'low'
  },
  default: { 
    maxFee: 0.20, 
    reason: 'General trading requires balanced fees',
    impact: 'medium'
  },
};

export const getStrategyFeeTarget = (setup?: string | null): StrategyFeeTarget => {
  if (!setup) return STRATEGY_FEE_TARGETS.default;
  const normalizedSetup = setup.toLowerCase().trim();
  return STRATEGY_FEE_TARGETS[normalizedSetup] || STRATEGY_FEE_TARGETS.default;
};

export const getContextualThreshold = (tradeType: string = 'futures'): FeeThresholds => {
  return FEE_THRESHOLDS[tradeType] || FEE_THRESHOLDS.futures;
};
