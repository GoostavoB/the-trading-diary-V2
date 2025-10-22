/**
 * Timeframe Returns Calculator
 * Calculates price returns, TWR, and IRR for different time periods
 */

export type TimeRange = '1H' | '1D' | '1W' | '1M' | '6M' | '12M' | 'YTD' | 'All';

/**
 * Get start date for a timeframe range
 */
export function getStartDateForRange(range: TimeRange): Date {
  const now = new Date();
  
  switch (range) {
    case '1H':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '1D':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '1W':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1M':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '6M':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '12M':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
    case 'All':
      return new Date(2010, 0, 1); // Bitcoin genesis
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Calculate simple price return
 */
export function calculatePriceReturn(
  startPrice: number,
  currentPrice: number
): { return_pct: number; return_amount: number } {
  if (startPrice === 0) {
    return { return_pct: 0, return_amount: 0 };
  }
  
  const returnAmount = currentPrice - startPrice;
  const returnPct = (returnAmount / startPrice) * 100;
  
  return { return_pct: returnPct, return_amount: returnAmount };
}

/**
 * Cash flow for TWR/IRR calculations
 */
export interface CashFlow {
  date: Date;
  amount: number; // Positive for deposits, negative for withdrawals
  portfolio_value_before: number;
  portfolio_value_after: number;
}

/**
 * Calculate Time-Weighted Return (TWR)
 * Eliminates impact of deposits/withdrawals
 */
export function calculateTWR(cashFlows: CashFlow[]): number {
  if (cashFlows.length === 0) return 0;

  // Sort cash flows by date
  const sortedFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  let cumulativeReturn = 1;

  for (let i = 0; i < sortedFlows.length; i++) {
    const flow = sortedFlows[i];
    const endingValue = i < sortedFlows.length - 1 
      ? sortedFlows[i + 1].portfolio_value_before 
      : flow.portfolio_value_after;
    
    const beginningValue = flow.portfolio_value_before;
    const netFlow = flow.amount;

    if (beginningValue > 0) {
      const subReturn = (endingValue - beginningValue - netFlow) / beginningValue;
      cumulativeReturn *= (1 + subReturn);
    }
  }

  return (cumulativeReturn - 1) * 100; // Convert to percentage
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method
 * Money-weighted return that accounts for timing of cash flows
 */
export function calculateIRR(
  cashFlows: Array<{ date: Date; amount: number }>,
  finalValue: number,
  finalDate: Date,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number | null {
  if (cashFlows.length === 0) return null;

  // Add final value as last cash flow
  const allFlows = [
    ...cashFlows.map(cf => ({ ...cf, amount: -cf.amount })), // Invert signs (outflows negative)
    { date: finalDate, amount: finalValue }
  ];

  // Sort by date
  const sortedFlows = allFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sortedFlows[0].date.getTime();

  // Convert dates to years from start
  const flowsWithTime = sortedFlows.map(flow => ({
    time: (flow.date.getTime() - startDate) / (365.25 * 24 * 60 * 60 * 1000),
    amount: flow.amount
  }));

  // NPV function
  const npv = (rate: number): number => {
    return flowsWithTime.reduce((sum, flow) => {
      return sum + flow.amount / Math.pow(1 + rate, flow.time);
    }, 0);
  };

  // Derivative of NPV
  const npvDerivative = (rate: number): number => {
    return flowsWithTime.reduce((sum, flow) => {
      return sum - (flow.time * flow.amount) / Math.pow(1 + rate, flow.time + 1);
    }, 0);
  };

  // Newton-Raphson iteration
  let rate = 0.1; // Initial guess: 10%
  
  for (let i = 0; i < maxIterations; i++) {
    const npvValue = npv(rate);
    const npvDeriv = npvDerivative(rate);
    
    if (Math.abs(npvValue) < tolerance) {
      return rate * 100; // Convert to percentage
    }
    
    if (Math.abs(npvDeriv) < 1e-10) {
      break; // Avoid division by zero
    }
    
    rate = rate - npvValue / npvDeriv;
    
    // Keep rate within reasonable bounds
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }

  // If didn't converge, return null
  return null;
}

/**
 * Calculate asset returns for a timeframe
 */
export function calculateAssetReturns(
  quantity: number,
  startPrice: number,
  currentPrice: number
): { pnl: number; return_pct: number } {
  const startValue = quantity * startPrice;
  const currentValue = quantity * currentPrice;
  const pnl = currentValue - startValue;
  const returnPct = startValue > 0 ? (pnl / startValue) * 100 : 0;
  
  return { pnl, return_pct: returnPct };
}
