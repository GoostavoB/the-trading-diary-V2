import { useMemo } from 'react';
import { SpotHolding } from './useSpotWallet';
import { TokenPrice } from './useTokenPrices';

export interface WalletAnalytics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  bestPerformer: {
    symbol: string;
    name: string;
    changePercent: number;
    value: number;
  } | null;
  worstPerformer: {
    symbol: string;
    name: string;
    changePercent: number;
    value: number;
  } | null;
  tokenCount: number;
  allocation: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    quantity: number;
    icon?: string;
  }>;
  totalInvested: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export const useWalletAnalytics = (
  holdings: SpotHolding[],
  prices: Record<string, TokenPrice>
): WalletAnalytics => {
  return useMemo(() => {
    let totalValue = 0;
    let totalChange24h = 0;
    let totalInvested = 0;
    const allocation: WalletAnalytics['allocation'] = [];
    let bestPerformer: WalletAnalytics['bestPerformer'] = null;
    let worstPerformer: WalletAnalytics['worstPerformer'] = null;

    holdings.forEach(holding => {
      const price = prices[holding.token_symbol];
      if (!price) return;

      const currentValue = holding.quantity * price.price;
      const change24h = holding.quantity * price.priceChange24h;
      const invested = holding.purchase_price 
        ? holding.quantity * holding.purchase_price 
        : 0;

      totalValue += currentValue;
      totalChange24h += change24h;
      totalInvested += invested;

      allocation.push({
        symbol: holding.token_symbol,
        name: holding.token_name,
        value: currentValue,
        percentage: 0, // Will calculate after totals
        quantity: holding.quantity,
        icon: price.icon,
      });

      // Track best/worst performers
      const performerData = {
        symbol: holding.token_symbol,
        name: holding.token_name,
        changePercent: price.priceChangePercentage24h,
        value: currentValue,
      };

      if (!bestPerformer || performerData.changePercent > bestPerformer.changePercent) {
        bestPerformer = performerData;
      }

      if (!worstPerformer || performerData.changePercent < worstPerformer.changePercent) {
        worstPerformer = performerData;
      }
    });

    // Calculate percentages
    allocation.forEach(item => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    });

    // Sort by value descending
    allocation.sort((a, b) => b.value - a.value);

    const totalChangePercent24h = totalValue > 0 
      ? (totalChange24h / (totalValue - totalChange24h)) * 100 
      : 0;

    const unrealizedPnL = totalValue - totalInvested;
    const unrealizedPnLPercent = totalInvested > 0 
      ? (unrealizedPnL / totalInvested) * 100 
      : 0;

    return {
      totalValue,
      totalChange24h,
      totalChangePercent24h,
      bestPerformer,
      worstPerformer,
      tokenCount: holdings.length,
      allocation,
      totalInvested,
      unrealizedPnL,
      unrealizedPnLPercent,
    };
  }, [holdings, prices]);
};
