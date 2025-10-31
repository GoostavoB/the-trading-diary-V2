/**
 * Centralized XP calculation engine for all streak-related XP awards
 * Ensures consistency between frontend and backend calculations
 */

export type XPEventType = 'login' | 'trade' | 'combo_bonus' | 'milestone';

interface XPCalculationConfig {
  baseXP: number;
  growthRate: number;
  maxMultiplier: number;
}

const XP_CONFIGS: Record<XPEventType, XPCalculationConfig> = {
  login: {
    baseXP: 50,
    growthRate: 0.05, // 5% per day
    maxMultiplier: 2.0, // Caps at 2x (Day 21+)
  },
  trade: {
    baseXP: 150,
    growthRate: 0.10, // 10% per day
    maxMultiplier: 3.0, // Caps at 3x (Day 21+)
  },
  combo_bonus: {
    baseXP: 500,
    growthRate: 0,
    maxMultiplier: 1.0,
  },
  milestone: {
    baseXP: 100,
    growthRate: 0,
    maxMultiplier: 1.0,
  },
};

/**
 * Calculate XP for a given streak type and length
 * Formula: baseXP * min(1 + growthRate * (streak - 1), maxMultiplier)
 */
export const calculateXP = (
  type: XPEventType,
  streak: number = 1
): number => {
  const config = XP_CONFIGS[type];
  
  if (!config) {
    console.error(`Invalid XP type: ${type}`);
    return 0;
  }
  
  // Special cases for non-streak events
  if (type === 'combo_bonus' || type === 'milestone') {
    return config.baseXP;
  }
  
  const multiplier = Math.min(
    1 + config.growthRate * (streak - 1),
    config.maxMultiplier
  );
  
  return Math.floor(config.baseXP * multiplier);
};

/**
 * Calculate XP for login streak
 */
export const calculateLoginXP = (loginStreak: number): number => {
  return calculateXP('login', loginStreak);
};

/**
 * Calculate XP for trade tracking streak
 */
export const calculateTradeXP = (tradeStreak: number): number => {
  return calculateXP('trade', tradeStreak);
};

/**
 * Get the XP multiplier for a given streak
 */
export const getStreakMultiplier = (
  type: 'login' | 'trade',
  streak: number
): number => {
  const config = XP_CONFIGS[type];
  return Math.min(
    1 + config.growthRate * (streak - 1),
    config.maxMultiplier
  );
};

/**
 * Calculate milestone bonus XP based on streak length
 */
export const calculateMilestoneXP = (streakDay: number): number => {
  if (streakDay === 7) return 100;
  if (streakDay === 14) return 250;
  if (streakDay === 30) return 500;
  if (streakDay === 100) return 1000;
  return 0;
};

/**
 * Check if a combo bonus should be awarded
 * Requires both streaks >= 7 days
 */
export const shouldAwardComboBonus = (
  loginStreak: number,
  tradeStreak: number,
  lastComboBonusDate?: string | null
): boolean => {
  if (loginStreak < 7 || tradeStreak < 7) return false;
  
  if (!lastComboBonusDate) return true;
  
  const daysSinceLastBonus = Math.floor(
    (Date.now() - new Date(lastComboBonusDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceLastBonus >= 7;
};

/**
 * Get a human-readable description of current XP multipliers
 */
export const getXPMultiplierDescription = (
  loginStreak: number,
  tradeStreak: number
): string => {
  const loginMult = getStreakMultiplier('login', loginStreak);
  const tradeMult = getStreakMultiplier('trade', tradeStreak);
  
  return `Login: ${loginMult.toFixed(2)}x • Trade: ${tradeMult.toFixed(2)}x`;
};

/**
 * Predict XP for the next day
 */
export const predictNextDayXP = (
  loginStreak: number,
  tradeStreak: number
): { login: number; trade: number; total: number } => {
  const loginXP = calculateLoginXP(loginStreak + 1);
  const tradeXP = calculateTradeXP(tradeStreak + 1);
  
  return {
    login: loginXP,
    trade: tradeXP,
    total: loginXP + tradeXP,
  };
};

/**
 * XP Tier System - Phase 1
 * 5-tier progression system for monetization
 */

export const TIER_THRESHOLDS = [0, 1000, 4000, 10000, 25000] as const;

export const TIER_NAMES = ['Starter', 'Skilled', 'Advanced', 'Pro', 'Elite'] as const;

export const TIER_DAILY_XP_CAPS = [750, 750, 1500, 1500, 999999] as const;

export const TIER_DAILY_UPLOAD_LIMITS = [1, 1, 5, 5, 20] as const;

export type TierLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Calculate user's tier based on total XP earned
 */
export const calculateTier = (totalXP: number): TierLevel => {
  if (totalXP >= TIER_THRESHOLDS[4]) return 4;
  if (totalXP >= TIER_THRESHOLDS[3]) return 3;
  if (totalXP >= TIER_THRESHOLDS[2]) return 2;
  if (totalXP >= TIER_THRESHOLDS[1]) return 1;
  return 0;
};

/**
 * Get tier name from tier number
 */
export const getTierName = (tier: TierLevel): string => {
  return TIER_NAMES[tier];
};

/**
 * Get XP required to reach next tier
 */
export const getXPToNextTier = (totalXP: number): number | null => {
  const currentTier = calculateTier(totalXP);
  
  // Max tier reached
  if (currentTier === 4) return null;
  
  const nextTierThreshold = TIER_THRESHOLDS[currentTier + 1];
  return nextTierThreshold - totalXP;
};

/**
 * Get daily XP cap for a tier
 */
export const getDailyXPCap = (tier: TierLevel): number => {
  return TIER_DAILY_XP_CAPS[tier];
};

/**
 * Get daily upload limit for a tier
 */
export const getDailyUploadLimit = (tier: TierLevel): number => {
  return TIER_DAILY_UPLOAD_LIMITS[tier];
};

/**
 * Calculate progress percentage to next tier
 */
export const getTierProgress = (totalXP: number): number => {
  const currentTier = calculateTier(totalXP);
  
  // Max tier reached
  if (currentTier === 4) return 100;
  
  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[currentTier + 1];
  const xpInCurrentTier = totalXP - currentThreshold;
  const xpNeededForNextTier = nextThreshold - currentThreshold;
  
  return Math.floor((xpInCurrentTier / xpNeededForNextTier) * 100);
};

/**
 * Check if user can earn more XP today
 */
export const canEarnXP = (dailyXPEarned: number, dailyXPCap: number): boolean => {
  return dailyXPEarned < dailyXPCap;
};

/**
 * Get remaining XP that can be earned today
 */
export const getRemainingDailyXP = (dailyXPEarned: number, dailyXPCap: number): number => {
  return Math.max(0, dailyXPCap - dailyXPEarned);
};
