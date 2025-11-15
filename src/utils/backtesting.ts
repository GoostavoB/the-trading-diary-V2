import { Trade } from '@/types/trade';
import { calculateTradePnL, calculateTotalPnL } from './pnl';

export interface BacktestStrategy {
  name: string;
  entryCondition: (trade: Trade) => boolean;
  exitCondition: (trade: Trade) => boolean;
  riskPerTrade: number; // percentage
  maxPositions: number;
}

export interface BacktestResult {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgHoldingTime: number;
  roi: number;
  expectancy: number;
}

export interface BacktestPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
}

export const runBacktest = (
  trades: Trade[],
  strategy: BacktestStrategy,
  period?: BacktestPeriod
): BacktestResult => {
  let filteredTrades = [...trades];

  // Filter by date period if provided
  if (period) {
    filteredTrades = filteredTrades.filter(trade => {
      const tradeDate = new Date(trade.opened_at || trade.created_at);
      return tradeDate >= period.startDate && tradeDate <= period.endDate;
    });
  }

  // Apply strategy filters
  const strategyTrades = filteredTrades.filter(
    trade => strategy.entryCondition(trade) && strategy.exitCondition(trade)
  );

  const winningTrades = strategyTrades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0);
  const losingTrades = strategyTrades.filter(t => calculateTradePnL(t, { includeFees: true }) <= 0);

  const totalPnL = calculateTotalPnL(strategyTrades, { includeFees: true });
  const avgWin = winningTrades.length > 0
    ? calculateTotalPnL(winningTrades, { includeFees: true }) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length > 0
    ? Math.abs(calculateTotalPnL(losingTrades, { includeFees: true }) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;
  const winRate = strategyTrades.length > 0 ? (winningTrades.length / strategyTrades.length) * 100 : 0;

  // Calculate Sharpe Ratio (simplified)
  const returns = strategyTrades.map(t => (t.roi || 0) / 100);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let cumPnL = 0;
  strategyTrades.forEach(trade => {
    cumPnL += calculateTradePnL(trade, { includeFees: true });
    if (cumPnL > peak) peak = cumPnL;
    const drawdown = peak - cumPnL;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const avgHoldingTime = strategyTrades.length > 0
    ? strategyTrades.reduce((sum, t) => sum + ((t.duration_hours || 0) * 60 + (t.duration_minutes || 0)), 0) / strategyTrades.length
    : 0;

  const totalInvested = strategyTrades.reduce((sum, t) => sum + (t.margin || 0), 0);
  const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const expectancy = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);

  return {
    strategyName: strategy.name,
    totalTrades: strategyTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalPnL,
    avgWin,
    avgLoss,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    avgHoldingTime,
    roi,
    expectancy,
  };
};

export const compareStrategies = (
  trades: Trade[],
  strategies: BacktestStrategy[],
  period?: BacktestPeriod
): BacktestResult[] => {
  return strategies.map(strategy => runBacktest(trades, strategy, period));
};

export const getBacktestPeriods = (): BacktestPeriod[] => {
  const now = new Date();
  return [
    {
      label: 'Last 30 Days',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: 'Last 90 Days',
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: 'Last 6 Months',
      startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: 'Last Year',
      startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: 'All Time',
      startDate: new Date(0),
      endDate: now,
    },
  ];
};
