import { useMemo } from 'react';
import type { Trade } from '@/types/trade';
import type { CapitalLogEntry } from '@/utils/capitalCalculations';
import { calculatePeriodBasedROI, getCurrentCapital } from '@/utils/capitalCalculations';

/**
 * Optimized hook to calculate dashboard statistics with memoization
 * Considers capital additions for accurate ROI calculations
 */
export const useDashboardStats = (trades: Trade[], capitalLog?: CapitalLogEntry[]) => {
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winningTrades: [],
        losingTrades: [],
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestTrade: null,
        worstTrade: null,
        avgRoi: 0,
      };
    }

    const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0);
    const losingTrades = trades.filter(t => (t.profit_loss || 0) <= 0);
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / winningTrades.length
      : 0;
    
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losingTrades.length)
      : 0;
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    const winRate = (winningTrades.length / trades.length) * 100;
    
    // Calculate ROI considering capital log if available
    let avgRoi = 0;
    let currentCapital = 0;
    let overallROI = 0;
    
    if (capitalLog && capitalLog.length > 0) {
      const roiData = calculatePeriodBasedROI(trades, capitalLog);
      overallROI = roiData.weightedROI;
      avgRoi = roiData.weightedROI;
      currentCapital = getCurrentCapital(capitalLog);
    } else {
      // Fallback to simple ROI if no capital log
      avgRoi = trades.reduce((sum, t) => sum + (t.roi || 0), 0) / trades.length;
    }
    
    const bestTrade = trades.reduce((best, t) => 
      (t.profit_loss || 0) > (best.profit_loss || 0) ? t : best
    , trades[0]);
    
    const worstTrade = trades.reduce((worst, t) => 
      (t.profit_loss || 0) < (worst.profit_loss || 0) ? t : worst
    , trades[0]);

    return {
      totalTrades: trades.length,
      totalPnL,
      winningTrades,
      losingTrades,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      bestTrade,
      worstTrade,
      avgRoi,
      overallROI,
      currentCapital,
    };
  }, [trades, capitalLog]);

  return stats;
};
