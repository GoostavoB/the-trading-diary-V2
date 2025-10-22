/**
 * Portfolio Performance Calculator
 * Aggregates holdings, calculates total value, and computes portfolio-level returns
 */

import { calculateTWR, calculateIRR, type CashFlow, type TimeRange, getStartDateForRange } from './timeframeReturns';

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  cost_basis: number;
  current_price: number;
}

export interface PortfolioTransaction {
  date: Date;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
  symbol: string;
  quantity: number;
  price: number;
  value: number;
}

export interface PortfolioMetrics {
  total_value: number;
  total_cost_basis: number;
  unrealized_pnl: number;
  unrealized_roi: number;
  realized_pnl: number;
  total_pnl: number;
  total_roi: number;
}

/**
 * Calculate total portfolio value and metrics
 */
export function calculatePortfolioValue(holdings: PortfolioHolding[]): PortfolioMetrics {
  let totalValue = 0;
  let totalCostBasis = 0;

  for (const holding of holdings) {
    totalValue += holding.quantity * holding.current_price;
    totalCostBasis += holding.cost_basis;
  }

  const unrealizedPnL = totalValue - totalCostBasis;
  const unrealizedROI = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;

  return {
    total_value: totalValue,
    total_cost_basis: totalCostBasis,
    unrealized_pnl: unrealizedPnL,
    unrealized_roi: unrealizedROI,
    realized_pnl: 0, // Will be added from separate query
    total_pnl: unrealizedPnL,
    total_roi: unrealizedROI,
  };
}

/**
 * Calculate portfolio returns for a specific timeframe
 */
export function calculatePortfolioReturns(
  range: TimeRange,
  currentValue: number,
  transactions: PortfolioTransaction[]
): {
  price_return: number;
  twr: number;
  irr: number | null;
  start_value: number;
  end_value: number;
} {
  const startDate = getStartDateForRange(range);
  const now = new Date();

  // Filter transactions within range
  const rangeTransactions = transactions.filter(
    tx => tx.date >= startDate && tx.date <= now
  );

  // Calculate starting portfolio value
  // (This would need historical price data - simplified here)
  let startValue = currentValue; // Placeholder - would need actual calculation

  // Identify cash flows (deposits and withdrawals)
  const cashFlows: CashFlow[] = [];
  let runningValue = startValue;

  for (const tx of rangeTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())) {
    if (['deposit', 'transfer_in'].includes(tx.type)) {
      cashFlows.push({
        date: tx.date,
        amount: tx.value,
        portfolio_value_before: runningValue,
        portfolio_value_after: runningValue + tx.value,
      });
      runningValue += tx.value;
    } else if (['withdrawal', 'transfer_out'].includes(tx.type)) {
      cashFlows.push({
        date: tx.date,
        amount: -tx.value,
        portfolio_value_before: runningValue,
        portfolio_value_after: runningValue - tx.value,
      });
      runningValue -= tx.value;
    }
  }

  // Calculate price return (ignoring cash flows)
  const priceReturn = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;

  // Calculate TWR (eliminates cash flow impact)
  const twr = cashFlows.length > 0 ? calculateTWR(cashFlows) : priceReturn;

  // Calculate IRR (money-weighted return)
  const irrCashFlows = rangeTransactions
    .filter(tx => ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'].includes(tx.type))
    .map(tx => ({
      date: tx.date,
      amount: ['deposit', 'transfer_in'].includes(tx.type) ? tx.value : -tx.value,
    }));

  const irr = irrCashFlows.length > 0 
    ? calculateIRR(irrCashFlows, currentValue, now)
    : null;

  return {
    price_return: priceReturn,
    twr,
    irr,
    start_value: startValue,
    end_value: currentValue,
  };
}

/**
 * Generate portfolio timeseries data
 */
export interface PortfolioTimeseriesPoint {
  date: Date;
  value: number;
  pnl: number;
  pnl_pct: number;
}

export function calculatePortfolioSeries(
  startDate: Date,
  endDate: Date,
  holdings: PortfolioHolding[],
  priceHistory: Map<string, Array<{ date: Date; price: number }>>
): PortfolioTimeseriesPoint[] {
  const series: PortfolioTimeseriesPoint[] = [];
  const startValue = holdings.reduce((sum, h) => sum + h.cost_basis, 0);

  // Generate daily points
  const current = new Date(startDate);
  while (current <= endDate) {
    let totalValue = 0;

    for (const holding of holdings) {
      const assetHistory = priceHistory.get(holding.symbol) || [];
      const closestPrice = assetHistory
        .filter(h => h.date <= current)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      if (closestPrice) {
        totalValue += holding.quantity * closestPrice.price;
      } else {
        totalValue += holding.quantity * holding.current_price; // Fallback
      }
    }

    const pnl = totalValue - startValue;
    const pnlPct = startValue > 0 ? (pnl / startValue) * 100 : 0;

    series.push({
      date: new Date(current),
      value: totalValue,
      pnl,
      pnl_pct: pnlPct,
    });

    current.setDate(current.getDate() + 1);
  }

  return series;
}

/**
 * Identify best and worst performers
 */
export function findTopPerformers(
  holdings: PortfolioHolding[],
  limit: number = 3
): { best: PortfolioHolding[]; worst: PortfolioHolding[] } {
  const holdingsWithReturns = holdings.map(h => ({
    ...h,
    return_pct: h.cost_basis > 0 
      ? ((h.quantity * h.current_price - h.cost_basis) / h.cost_basis) * 100 
      : 0,
  }));

  const sorted = [...holdingsWithReturns].sort((a, b) => b.return_pct - a.return_pct);

  return {
    best: sorted.slice(0, limit),
    worst: sorted.slice(-limit).reverse(),
  };
}
