import { Trade } from '@/types/trade';
import { calculateTradePnL, calculateTotalPnL } from './pnl';

export interface AttributionBreakdown {
  category: string;
  subcategory: string;
  trades: number;
  winRate: number;
  avgPnL: number;
  totalPnL: number;
  contribution: number; // percentage of total PnL
}

export interface PerformanceAttribution {
  bySetup: AttributionBreakdown[];
  byTimeOfDay: AttributionBreakdown[];
  byDayOfWeek: AttributionBreakdown[];
  byHoldingPeriod: AttributionBreakdown[];
  byPositionSize: AttributionBreakdown[];
  bySide: AttributionBreakdown[];
  topContributors: AttributionBreakdown[];
  worstContributors: AttributionBreakdown[];
}

const calculateBreakdown = (
  trades: Trade[],
  category: string,
  groupFn: (trade: Trade) => string
): AttributionBreakdown[] => {
  const groups: Record<string, Trade[]> = {};
  
  trades.forEach(trade => {
    const key = groupFn(trade);
    if (!groups[key]) groups[key] = [];
    groups[key].push(trade);
  });

  const totalPnL = calculateTotalPnL(trades, { includeFees: true });

  return Object.entries(groups).map(([subcategory, groupTrades]) => {
    const winningTrades = groupTrades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0);
    const groupPnL = calculateTotalPnL(groupTrades, { includeFees: true });
    const avgPnL = groupPnL / groupTrades.length;

    return {
      category,
      subcategory,
      trades: groupTrades.length,
      winRate: (winningTrades.length / groupTrades.length) * 100,
      avgPnL,
      totalPnL: groupPnL,
      contribution: totalPnL !== 0 ? (groupPnL / totalPnL) * 100 : 0,
    };
  }).sort((a, b) => b.totalPnL - a.totalPnL);
};

export const analyzePerformanceAttribution = (trades: Trade[]): PerformanceAttribution => {
  // By Setup
  const bySetup = calculateBreakdown(
    trades,
    'Setup',
    trade => trade.setup || 'Unknown'
  );

  // By Time of Day
  const byTimeOfDay = calculateBreakdown(
    trades,
    'Time of Day',
    trade => trade.period_of_day || 'unknown'
  );

  // By Day of Week
  const byDayOfWeek = calculateBreakdown(
    trades,
    'Day of Week',
    trade => {
      if (!trade.opened_at) return 'Unknown';
      const date = new Date(trade.opened_at);
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    }
  );

  // By Holding Period
  const byHoldingPeriod = calculateBreakdown(
    trades,
    'Holding Period',
    trade => {
      const hours = (trade.duration_hours || 0) + (trade.duration_minutes || 0) / 60;
      if (hours < 1) return '< 1 hour';
      if (hours < 4) return '1-4 hours';
      if (hours < 24) return '4-24 hours';
      if (hours < 72) return '1-3 days';
      return '> 3 days';
    }
  );

  // By Position Size
  const byPositionSize = calculateBreakdown(
    trades,
    'Position Size',
    trade => {
      const size = trade.position_size || 0;
      if (size < 1000) return 'Small (< $1k)';
      if (size < 5000) return 'Medium ($1k-$5k)';
      if (size < 10000) return 'Large ($5k-$10k)';
      return 'Very Large (> $10k)';
    }
  );

  // By Side
  const bySide = calculateBreakdown(
    trades,
    'Side',
    trade => trade.side || 'unknown'
  );

  // Combine all and find top/worst contributors
  const allBreakdowns = [...bySetup, ...byTimeOfDay, ...byDayOfWeek, ...byHoldingPeriod, ...byPositionSize, ...bySide];
  const topContributors = allBreakdowns
    .filter(b => b.totalPnL > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);
  
  const worstContributors = allBreakdowns
    .filter(b => b.totalPnL < 0)
    .sort((a, b) => a.contribution - b.contribution)
    .slice(0, 5);

  return {
    bySetup,
    byTimeOfDay,
    byDayOfWeek,
    byHoldingPeriod,
    byPositionSize,
    bySide,
    topContributors,
    worstContributors,
  };
};
