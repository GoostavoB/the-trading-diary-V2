import { Trade } from '@/types/trade';
import { calculateTradePnL, calculateTotalPnL } from './pnl';

export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'high-volatility' | 'low-volatility';

export interface RegimeDetection {
  currentRegime: MarketRegime;
  confidence: number; // 0-100
  characteristics: string[];
  suggestions: string[];
  historicalPerformance: {
    regime: MarketRegime;
    winRate: number;
    avgPnL: number;
    tradeCount: number;
  }[];
}

export interface RegimeMetrics {
  trend: number; // -1 to 1
  volatility: number; // standard deviation
  momentum: number; // rate of change
}

export const calculateRegimeMetrics = (trades: Trade[]): RegimeMetrics => {
  if (trades.length < 2) {
    return { trend: 0, volatility: 0, momentum: 0 };
  }

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.opened_at || a.created_at).getTime() - 
    new Date(b.opened_at || b.created_at).getTime()
  );

  // Calculate cumulative returns for trend
  const returns = sortedTrades.map(t => calculateTradePnL(t, { includeFees: true }) / (t.margin || 1));
  const cumReturns = returns.reduce((acc: number[], r, i) => {
    acc.push((acc[i - 1] || 0) + r);
    return acc;
  }, []);

  // Trend: linear regression slope
  const n = cumReturns.length;
  const xMean = (n - 1) / 2;
  const yMean = cumReturns.reduce((sum, y) => sum + y, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (cumReturns[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  const trend = denominator > 0 ? numerator / denominator : 0;

  // Volatility: standard deviation of returns
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Momentum: recent performance vs historical
  const recentCount = Math.min(10, Math.floor(trades.length * 0.2));
  const recentReturns = returns.slice(-recentCount);
  const historicalReturns = returns.slice(0, -recentCount);
  
  const recentAvg = recentReturns.reduce((sum, r) => sum + r, 0) / recentReturns.length;
  const historicalAvg = historicalReturns.length > 0 
    ? historicalReturns.reduce((sum, r) => sum + r, 0) / historicalReturns.length 
    : 0;
  
  const momentum = recentAvg - historicalAvg;

  return { trend, volatility, momentum };
};

export const detectMarketRegime = (trades: Trade[]): RegimeDetection => {
  const metrics = calculateRegimeMetrics(trades);
  
  let currentRegime: MarketRegime;
  let confidence: number;
  const characteristics: string[] = [];
  const suggestions: string[] = [];

  // Normalize metrics for decision making
  const trendStrength = Math.abs(metrics.trend);
  const volLevel = metrics.volatility;

  // Determine regime
  if (volLevel > 0.5) {
    currentRegime = 'high-volatility';
    confidence = Math.min(100, volLevel * 100);
    characteristics.push('High market volatility detected');
    characteristics.push('Large price swings common');
    suggestions.push('Reduce position sizes');
    suggestions.push('Wider stop losses recommended');
    suggestions.push('Consider shorter holding periods');
  } else if (volLevel < 0.1) {
    currentRegime = 'low-volatility';
    confidence = Math.min(100, (1 - volLevel) * 100);
    characteristics.push('Low volatility environment');
    characteristics.push('Range-bound trading likely');
    suggestions.push('Consider range trading strategies');
    suggestions.push('Smaller targets may be appropriate');
  } else if (metrics.trend > 0.15) {
    currentRegime = 'bull';
    confidence = Math.min(100, metrics.trend * 200);
    characteristics.push('Positive trend identified');
    characteristics.push('Higher success rate on long positions');
    suggestions.push('Favor long positions');
    suggestions.push('Hold winners longer');
    suggestions.push('Trail stops to capture trends');
  } else if (metrics.trend < -0.15) {
    currentRegime = 'bear';
    confidence = Math.min(100, Math.abs(metrics.trend) * 200);
    characteristics.push('Negative trend identified');
    characteristics.push('Higher success rate on short positions');
    suggestions.push('Favor short positions');
    suggestions.push('Take profits quickly');
    suggestions.push('Tight stop losses recommended');
  } else {
    currentRegime = 'sideways';
    confidence = Math.min(100, (1 - trendStrength) * 100);
    characteristics.push('No clear trend');
    characteristics.push('Mean reversion likely');
    suggestions.push('Range trading strategies work best');
    suggestions.push('Avoid trend-following strategies');
    suggestions.push('Quick profits at support/resistance');
  }

  // Add momentum indicator
  if (metrics.momentum > 0.1) {
    characteristics.push('Positive momentum building');
  } else if (metrics.momentum < -0.1) {
    characteristics.push('Negative momentum detected');
  }

  // Calculate historical performance by regime
  const historicalPerformance = calculateHistoricalRegimePerformance(trades);

  return {
    currentRegime,
    confidence,
    characteristics,
    suggestions,
    historicalPerformance,
  };
};

const calculateHistoricalRegimePerformance = (trades: Trade[]) => {
  // This is a simplified version - in production, you'd classify each historical period
  const regimes: MarketRegime[] = ['bull', 'bear', 'sideways', 'high-volatility', 'low-volatility'];
  
  // For now, return placeholder data
  return regimes.map(regime => {
    const regimeTrades = trades.filter(() => Math.random() > 0.5); // Placeholder
    const winningTrades = regimeTrades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0);
    
    return {
      regime,
      winRate: regimeTrades.length > 0 ? (winningTrades.length / regimeTrades.length) * 100 : 0,
      avgPnL: regimeTrades.length > 0 
        ? calculateTotalPnL(regimeTrades, { includeFees: true }) / regimeTrades.length 
        : 0,
      tradeCount: regimeTrades.length,
    };
  });
};
