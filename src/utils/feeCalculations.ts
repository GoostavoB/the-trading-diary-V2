import { Trade } from '@/types/trade';

// Enhanced trade metrics with detailed fee analysis
export interface EnhancedTradeMetrics {
  tradeId: string;
  symbol: string;
  broker: string;
  leverage: number;
  margin: number;
  positionSize: number;
  tradingFee: number;
  fundingFee: number;
  slippageCost: number;
  spreadCost: number;
  totalFees: number;
  comprehensiveFees: number;
  grossPnL: number;
  netPnL: number;
  grossReturnPercent: number;
  feePercentOfPosition: number;
  feePercentOfMargin: number;
  effectiveReturnOnMargin: number;
  tradeType: string;
  setup?: string | null;
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
  // Use position_size from trade if available, otherwise calculate from margin × leverage
  const positionSize = trade.position_size || (margin * leverage);
  
  const tradingFee = Math.abs(trade.trading_fee || 0);
  const fundingFee = trade.funding_fee || 0;
  const slippageCost = Math.abs((trade as any).slippage_cost || 0);
  const spreadCost = Math.abs((trade as any).spread_cost || 0);
  
  // Basic fees (exchange + funding)
  const totalFees = tradingFee + Math.abs(fundingFee);
  
  // Comprehensive fees (includes slippage and spread)
  const comprehensiveFees = totalFees + slippageCost + spreadCost;
  
  // Calculate gross PnL (before fees)
  const grossPnL = (trade.profit_loss || 0) + totalFees;
  
  // Net PnL (after fees) - this is what user actually received
  const netPnL = trade.profit_loss || 0;
  
  // Gross return % (based on position size, before fees)
  const grossReturnPercent = positionSize > 0 ? (grossPnL / positionSize) * 100 : 0;
  
  // CRITICAL FIX: Fee as % of MARGIN (not position size)
  // This is the actual capital at risk, not the leveraged position
  const feePercentOfMargin = margin > 0 ? (totalFees / margin) * 100 : 0;
  
  // Keep legacy metric for volume-based analysis
  const feePercentOfPosition = positionSize > 0 ? (comprehensiveFees / positionSize) * 100 : 0;
  
  // Effective return on margin (net return after fees)
  const effectiveReturnOnMargin = margin > 0 ? (netPnL / margin) * 100 : 0;

  return {
    tradeId: trade.id,
    symbol: trade.symbol || 'Unknown',
    broker: trade.broker || 'Unknown',
    leverage,
    margin,
    positionSize,
    tradingFee,
    fundingFee,
    slippageCost,
    spreadCost,
    totalFees,
    comprehensiveFees,
    grossPnL,
    netPnL,
    grossReturnPercent,
    feePercentOfPosition,
    feePercentOfMargin,
    effectiveReturnOnMargin,
    tradeType: (trade as any).trade_type || 'futures',
    setup: trade.setup,
  };
};

// UPDATED: Fixed BingX rating issue - more granular scoring
export const calculateEfficiencyScore = (feePercent: number, tradeType: string = 'futures'): number => {
  // Super Low: < 0.02% (10/10) - VIP rates
  if (feePercent < 0.02) return 10;
  // Very Low: 0.02-0.05% (9/10) - Maker rates
  if (feePercent < 0.05) return 9;
  // Low: 0.05-0.10% (8/10) - Standard maker
  if (feePercent < 0.10) return 8;
  // Below Average: 0.10-0.20% (7/10) - Standard taker
  if (feePercent < 0.20) return 7;
  // Average: 0.20-0.30% (6/10) - Normal taker
  if (feePercent < 0.30) return 6;
  // Above Average: 0.30-0.50% (5/10) - Budget exchanges (BingX should land here)
  if (feePercent < 0.50) return 5;
  // High: 0.50-0.75% (4/10) - High-fee venues
  if (feePercent < 0.75) return 4;
  // Very High: 0.75-1.0% (3/10) - DEX territory
  if (feePercent < 1.0) return 3;
  // Extreme: 1.0-2.0% (2/10) - Very expensive
  if (feePercent < 2.0) return 2;
  // Abusive: > 2.0% (1/10) - Avoid at all costs
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
