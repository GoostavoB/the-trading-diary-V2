import type { Trade } from '@/types/trade';
import { calculateTradePnL } from './pnl';

export interface TimeBasedPerformance {
  hour: number;
  wins: number;
  losses: number;
  totalPnL: number;
  winRate: number;
}

export interface DayPerformance {
  day: string;
  wins: number;
  losses: number;
  totalPnL: number;
  winRate: number;
  tradeCount: number;
}

export interface BestWorstDay {
  date: string;
  totalPnL: number;
  tradeCount: number;
  winRate: number;
}

/**
 * Returns the average trade duration in MINUTES (or null if not enough data).
 * Tries, in order:
 *   1. Stored `duration_minutes` on the trade row
 *   2. Derived from `duration_hours`
 *   3. Computed from (closed_at/exit_date) - (opened_at/entry_date)
 */
export const calculateAvgHoldingTime = (trades: Trade[]): number | null => {
  if (!trades || trades.length === 0) return null;

  const minutesPerTrade: number[] = [];
  for (const t of trades) {
    // 1) direct column
    if (typeof t.duration_minutes === 'number' && t.duration_minutes > 0) {
      minutesPerTrade.push(t.duration_minutes);
      continue;
    }
    // 2) hours column
    if (typeof t.duration_hours === 'number' && t.duration_hours > 0) {
      minutesPerTrade.push(t.duration_hours * 60);
      continue;
    }
    // 3) entry/exit timestamps
    const openedAt = t.opened_at ? new Date(t.opened_at).getTime() : NaN;
    const closedAt = t.closed_at ? new Date(t.closed_at).getTime() : NaN;
    if (!Number.isNaN(openedAt) && !Number.isNaN(closedAt) && closedAt > openedAt) {
      minutesPerTrade.push((closedAt - openedAt) / 60000);
    }
  }

  if (minutesPerTrade.length === 0) return null;
  return minutesPerTrade.reduce((a, b) => a + b, 0) / minutesPerTrade.length;
};

/**
 * Format an avg-holding-time (in minutes) into a short human string like
 *   "3m", "2h 15m", "1d 4h". Returns the em-dash placeholder when null.
 */
export const formatHoldingTime = (minutes: number | null): string => {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round(minutes - h * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const days = Math.floor(hours / 24);
  const remH = Math.round(hours - days * 24);
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
};

export const calculateAvgPositionSize = (trades: Trade[]): number => {
  if (!trades || trades.length === 0) return 0;
  const totalSize = trades.reduce((sum, t) => {
    const size = t.position_size || ((t.margin || 0) * (t.leverage || 1));
    return sum + size;
  }, 0);
  return totalSize / trades.length;
};

export const calculateAvgLeverage = (trades: Trade[]): number => {
  if (!trades || trades.length === 0) return 0;
  const totalLeverage = trades.reduce((sum, t) => sum + (t.leverage || 1), 0);
  return totalLeverage / trades.length;
};

export const analyzeHourlyPerformance = (trades: Trade[]): TimeBasedPerformance[] => {
  if (!trades || trades.length === 0) return [];
  
  const hourlyData: Record<number, { wins: number; losses: number; pnl: number }> = {};
  
  trades.forEach(t => {
    if (!t.opened_at) return;
    const hour = new Date(t.opened_at).getHours();
    
    if (!hourlyData[hour]) {
      hourlyData[hour] = { wins: 0, losses: 0, pnl: 0 };
    }
    
    const tradePnL = calculateTradePnL(t, { includeFees: true });
    if (tradePnL > 0) hourlyData[hour].wins++;
    else hourlyData[hour].losses++;
    hourlyData[hour].pnl += tradePnL;
  });
  
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    wins: data.wins,
    losses: data.losses,
    totalPnL: data.pnl,
    winRate: (data.wins / (data.wins + data.losses)) * 100,
  })).sort((a, b) => b.winRate - a.winRate);
};

export const analyzeDayPerformance = (trades: Trade[]): DayPerformance[] => {
  if (!trades || trades.length === 0) return [];
  
  const dayData: Record<string, { wins: number; losses: number; pnl: number }> = {};
  
  trades.forEach(t => {
    if (!t.trade_date) return;
    const day = new Date(t.trade_date).toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!dayData[day]) {
      dayData[day] = { wins: 0, losses: 0, pnl: 0 };
    }
    
    const tradePnL = calculateTradePnL(t, { includeFees: true });
    if (tradePnL > 0) dayData[day].wins++;
    else dayData[day].losses++;
    dayData[day].pnl += tradePnL;
  });
  
  return Object.entries(dayData).map(([day, data]) => ({
    day,
    wins: data.wins,
    losses: data.losses,
    totalPnL: data.pnl,
    winRate: (data.wins / (data.wins + data.losses)) * 100,
    tradeCount: data.wins + data.losses,
  })).sort((a, b) => b.totalPnL - a.totalPnL);
};

export const findBestWorstDays = (trades: Trade[]): { best: BestWorstDay | null; worst: BestWorstDay | null } => {
  if (!trades || trades.length === 0) return { best: null, worst: null };

  const dailyData: Record<string, { pnl: number; trades: number; wins: number }> = {};

  trades.forEach(t => {
    // Prefer trade_date, fall back to closed_at then opened_at so rows with
    // partial data still aggregate into Best/Worst Day.
    const rawDate = t.trade_date || t.closed_at || t.opened_at;
    if (!rawDate) return;
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return;
    const date = parsed.toISOString().split('T')[0];

    if (!dailyData[date]) {
      dailyData[date] = { pnl: 0, trades: 0, wins: 0 };
    }

    const tradePnL = calculateTradePnL(t, { includeFees: true });
    dailyData[date].pnl += tradePnL;
    dailyData[date].trades++;
    if (tradePnL > 0) dailyData[date].wins++;
  });
  
  const days = Object.entries(dailyData).map(([date, data]) => ({
    date,
    totalPnL: data.pnl,
    tradeCount: data.trades,
    winRate: (data.wins / data.trades) * 100,
  }));
  
  if (days.length === 0) return { best: null, worst: null };
  
  const best = days.reduce((prev, curr) => curr.totalPnL > prev.totalPnL ? curr : prev);
  const worst = days.reduce((prev, curr) => curr.totalPnL < prev.totalPnL ? curr : prev);
  
  return { best, worst };
};

export const getTopAssets = (trades: Trade[], limit: number = 3): Array<{ symbol: string; winRate: number; avgPnL: number; trades: number }> => {
  if (!trades || trades.length === 0) return [];
  
  const assetData: Record<string, { wins: number; losses: number; totalPnL: number }> = {};
  
  trades.forEach(t => {
    const symbol = t.symbol || t.symbol_temp || 'Unknown';
    if (!assetData[symbol]) {
      assetData[symbol] = { wins: 0, losses: 0, totalPnL: 0 };
    }
    
    const tradePnL = calculateTradePnL(t, { includeFees: true });
    if (tradePnL > 0) assetData[symbol].wins++;
    else assetData[symbol].losses++;
    assetData[symbol].totalPnL += tradePnL;
  });
  
  const assets = Object.entries(assetData).map(([symbol, data]) => ({
    symbol,
    winRate: (data.wins / (data.wins + data.losses)) * 100,
    avgPnL: data.totalPnL / (data.wins + data.losses),
    trades: data.wins + data.losses,
    totalPnL: data.totalPnL,
  }));
  
  return assets.sort((a, b) => b.totalPnL - a.totalPnL).slice(0, limit);
};

export const getRiskRewardRatio = (avgWin: number, avgLoss: number): number => {
  if (avgLoss === 0) return 0;
  return Math.abs(avgWin / avgLoss);
};

/**
 * True Max Drawdown: the largest peak-to-trough decline in cumulative equity,
 * computed from trades sorted chronologically.
 *
 * Returns:
 *   - amount: absolute $ drop from peak (>= 0)
 *   - percent: amount / (initialCapital + peak) * 100 (>= 0)
 *
 * When there are no trades (or no loss from any peak) both values are 0.
 */
export const calculateMaxDrawdown = (
  trades: Trade[],
  initialCapital: number = 0,
): { amount: number; percent: number } => {
  if (!trades || trades.length === 0) return { amount: 0, percent: 0 };

  // Sort chronologically by best-available timestamp
  const chronological = [...trades].sort((a, b) => {
    const da = new Date(a.trade_date || a.closed_at || a.opened_at || 0).getTime();
    const db = new Date(b.trade_date || b.closed_at || b.opened_at || 0).getTime();
    return da - db;
  });

  let cumulative = 0;
  let peak = 0;
  let maxAmount = 0;
  let peakAtMaxDD = 0;

  for (const t of chronological) {
    cumulative += calculateTradePnL(t, { includeFees: true });
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxAmount) {
      maxAmount = drawdown;
      peakAtMaxDD = peak;
    }
  }

  const denominator = initialCapital + peakAtMaxDD;
  const percent = denominator > 0 ? (maxAmount / denominator) * 100 : 0;

  return { amount: maxAmount, percent };
};

export const calculateFeeImpactMetrics = (trades: Trade[]) => {
  if (!trades || trades.length === 0) {
    return {
      totalFees: 0,
      feeImpactOnPnL: 0,
      effectiveFeeRate: 0,
    };
  }
  
  const totalFees = trades.reduce((sum, t) => {
    return sum + (t.trading_fee || 0) + (t.funding_fee || 0);
  }, 0);
  
  const totalGrossPnL = trades.reduce((sum, t) => sum + Math.abs(t.profit_loss || 0), 0);
  
  const feeImpactOnPnL = totalGrossPnL > 0 ? (totalFees / totalGrossPnL) * 100 : 0;
  const totalVolume = trades.reduce((sum, t) => {
    return sum + (t.position_size || ((t.margin || 0) * (t.leverage || 1)));
  }, 0);
  
  const effectiveFeeRate = totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0;
  
  return {
    totalFees,
    feeImpactOnPnL,
    effectiveFeeRate,
  };
};
