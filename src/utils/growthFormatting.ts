/**
 * Formats growth values with intelligent display logic
 * @param value - Growth value as decimal (e.g., 0.0117 for 1.17% growth, 6.8 for 680% growth)
 * @param useMultiplier - Whether to use "x" notation for values >= 1
 * @returns Formatted string with appropriate suffix
 */
export const formatGrowth = (value: number, useMultiplier: boolean = false): string => {
  // Handle invalid values
  if (isNaN(value) || !isFinite(value)) {
    return "—";
  }

  // Handle extreme values — we never display ∞ or a true -100% wipe-out
  // because those are almost always overflow / mathematical artifacts of
  // compounding small-sample statistics over years.
  if (value > 49) {
    return "50×+";
  }

  if (value < -0.94) {
    return "−95%+";
  }

  // Convert to percentage
  const percentValue = value * 100;

  // For multiplier notation (when growth is >= 100%)
  if (useMultiplier && value >= 1) {
    const multiplier = 1 + value;
    if (multiplier >= 1000) {
      return `${(multiplier / 1000).toFixed(1)}Kx`;
    }
    return `${multiplier.toFixed(1)}x`;
  }

  // Standard percentage formatting
  if (Math.abs(percentValue) < 0.01) {
    return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(3)}%`;
  }
  
  if (Math.abs(percentValue) < 1) {
    return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(2)}%`;
  }
  
  if (Math.abs(percentValue) < 10) {
    return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(1)}%`;
  }
  
  if (Math.abs(percentValue) < 100) {
    return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(0)}%`;
  }

  // For large percentages, use comma formatting
  if (Math.abs(percentValue) < 10000) {
    return `${percentValue >= 0 ? '+' : ''}${Math.round(percentValue).toLocaleString()}%`;
  }

  // For very large values, show multiplier
  const multiplier = 1 + value;
  if (multiplier >= 1000) {
    return `${(multiplier / 1000).toFixed(1)}Kx`;
  }
  return `${multiplier.toFixed(0)}x`;
};

/**
 * Calculate growth from daily rate using proper compounding over TRADING DAYS
 * (21/month, 252/year, 1260/5-year) with realism caps applied so the result
 * never reads ∞ or -100%. Input is a daily growth fraction like +0.02 = +2%/day.
 */
const GROWTH_DISPLAY_CAP = 50;      // 50× ceiling
const GROWTH_DISPLAY_FLOOR = -0.95; // −95% floor

const clampMultiple = (m: number) => {
  if (!isFinite(m)) return GROWTH_DISPLAY_CAP;
  return Math.max(GROWTH_DISPLAY_FLOOR, Math.min(GROWTH_DISPLAY_CAP, m));
};

export const calculateGrowth = (dailyGrowthDecimal: number) => {
  const tradingDaysMonth = 21;
  const tradingDaysYear = 252;
  const tradingDaysFiveYear = 1260;

  const monthlyGrowth = clampMultiple(Math.pow(1 + dailyGrowthDecimal, tradingDaysMonth) - 1);
  const annualGrowth = clampMultiple(Math.pow(1 + dailyGrowthDecimal, tradingDaysYear) - 1);
  const fiveYearGrowth = clampMultiple(Math.pow(1 + dailyGrowthDecimal, tradingDaysFiveYear) - 1);

  return {
    monthlyGrowth,
    annualGrowth,
    fiveYearGrowth,
  };
};

/**
 * Get tooltip text for each metric
 */
export const getMetricTooltip = (metric: string): string => {
  const tooltips: Record<string, string> = {
    daily: "Average change in capital per trading day based on your recent performance.",
    monthly: "Compounded growth if daily results repeated for 30 days.",
    annual: "Compounded growth over 365 days. Shows overall yearly performance multiplier.",
    fiveYear: "Long-term projection assuming the same average daily performance for five years. Not a guarantee.",
  };
  return tooltips[metric] || "";
};

/**
 * Format a number with appropriate abbreviation (K, M, B)
 */
export const formatLargeNumber = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return "—";
  
  const absValue = Math.abs(value);
  const sign = value >= 0 ? '+' : '-';
  
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  }
  return `${sign}${absValue.toFixed(0)}`;
};
