import { Trade } from '@/types/trade';

export interface EnhancedTradeMetrics {
  tradeId: string;
  symbol: string;
  broker: string;
  margin: number;
  leverage: number;
  positionSize: number;
  tradingFee: number;
  fundingFee: number;
  grossPnL: number;
  totalFees: number;
  feePercentOfPosition: number;
  netPnL: number;
  effectiveReturnOnMargin: number;
  grossReturnPercent: number;
  feeImpact: number;
  tradeDate: string | null;
}

export interface ExchangeFeeStats {
  broker: string;
  tradeCount: number;
  totalVolume: number;
  totalTradingFees: number;
  totalFundingFees: number;
  totalFees: number;
  avgFeePerTrade: number;
  avgFeePercent: number;
  totalGrossPnL: number;
  totalNetPnL: number;
  feeImpactOnPnL: number;
  avgEfficiencyScore: number;
  rank: number;
}

export const calculateEnhancedMetrics = (trade: Trade): EnhancedTradeMetrics => {
  const margin = trade.margin || 0;
  const leverage = trade.leverage || 1;
  const positionSize = trade.position_size || (margin * leverage);
  const tradingFee = trade.trading_fee || 0;
  const fundingFee = trade.funding_fee || 0;
  const grossPnL = trade.pnl || 0;
  
  // Core calculations using user's formulas
  const totalFees = tradingFee + fundingFee;
  const feePercentOfPosition = positionSize > 0 ? (totalFees / positionSize) * 100 : 0;
  const netPnL = grossPnL - totalFees;
  const effectiveReturnOnMargin = margin > 0 ? (netPnL / margin) * 100 : 0;
  const grossReturnPercent = margin > 0 ? (grossPnL / margin) * 100 : 0;
  const feeImpact = grossReturnPercent - effectiveReturnOnMargin;
  
  return {
    tradeId: trade.id,
    symbol: trade.symbol || trade.symbol_temp || '',
    broker: trade.broker || 'Unknown',
    margin,
    leverage,
    positionSize,
    tradingFee,
    fundingFee,
    grossPnL,
    totalFees,
    feePercentOfPosition,
    netPnL,
    effectiveReturnOnMargin,
    grossReturnPercent,
    feeImpact,
    tradeDate: trade.trade_date,
  };
};

export const calculateEfficiencyScore = (feePercent: number): number => {
  if (feePercent < 0.02) return 10;
  if (feePercent < 0.03) return 9;
  if (feePercent < 0.05) return 8;
  if (feePercent < 0.07) return 7;
  if (feePercent < 0.10) return 6;
  if (feePercent < 0.15) return 5;
  if (feePercent < 0.20) return 4;
  if (feePercent < 0.30) return 3;
  if (feePercent < 0.50) return 2;
  return 1;
};

export const aggregateExchangeStats = (trades: Trade[]): ExchangeFeeStats[] => {
  if (!trades || trades.length === 0) return [];
  
  const grouped = trades.reduce((acc, trade) => {
    const broker = trade.broker || 'Unknown';
    const metrics = calculateEnhancedMetrics(trade);
    
    if (!acc[broker]) {
      acc[broker] = {
        trades: [],
        totalVolume: 0,
        totalTradingFees: 0,
        totalFundingFees: 0,
        totalGrossPnL: 0,
        efficiencyScores: [],
      };
    }
    
    acc[broker].trades.push(metrics);
    acc[broker].totalVolume += metrics.positionSize;
    acc[broker].totalTradingFees += metrics.tradingFee;
    acc[broker].totalFundingFees += metrics.fundingFee;
    acc[broker].totalGrossPnL += metrics.grossPnL;
    acc[broker].efficiencyScores.push(calculateEfficiencyScore(metrics.feePercentOfPosition));
    
    return acc;
  }, {} as Record<string, any>);
  
  const stats = Object.entries(grouped).map(([broker, data]) => {
    const totalFees = data.totalTradingFees + data.totalFundingFees;
    const avgFeePercent = data.totalVolume > 0 
      ? (totalFees / data.totalVolume) * 100 
      : 0;
    const totalNetPnL = data.totalGrossPnL - totalFees;
    const feeImpactOnPnL = data.totalGrossPnL !== 0
      ? (totalFees / Math.abs(data.totalGrossPnL)) * 100
      : 0;
    
    return {
      broker,
      tradeCount: data.trades.length,
      totalVolume: data.totalVolume,
      totalTradingFees: data.totalTradingFees,
      totalFundingFees: data.totalFundingFees,
      totalFees,
      avgFeePerTrade: data.trades.length > 0 ? totalFees / data.trades.length : 0,
      avgFeePercent,
      totalGrossPnL: data.totalGrossPnL,
      totalNetPnL,
      feeImpactOnPnL,
      avgEfficiencyScore: data.efficiencyScores.length > 0 
        ? data.efficiencyScores.reduce((a: number, b: number) => a + b, 0) / data.efficiencyScores.length 
        : 0,
      rank: 0,
    };
  });
  
  // Sort by avgFeePercent (lowest = best) and assign rank
  stats.sort((a, b) => a.avgFeePercent - b.avgFeePercent);
  stats.forEach((stat, index) => stat.rank = index + 1);
  
  return stats;
};
