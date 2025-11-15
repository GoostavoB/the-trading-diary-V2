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

export const calculateAvgHoldingTime = (trades: Trade[]): number => {
  if (!trades || trades.length === 0) return 0;
  const totalHours = trades.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
  return totalHours / trades.length;
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
    if (!t.trade_date) return;
    const date = new Date(t.trade_date).toISOString().split('T')[0];
    
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
