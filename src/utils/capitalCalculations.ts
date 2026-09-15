import { format } from 'date-fns';

export interface CapitalLogEntry {
  id: string;
  user_id?: string;
  log_date: string;
  amount_added: number;
  total_after: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CapitalPeriod {
  startDate: string;
  endDate?: string;
  startingCapital: number;
  roi: number;
  profit: number;
  notes?: string;
}

export interface Trade {
  pnl?: number | null;
  profit_loss?: number | null;
  trade_date?: string | null;
  closed_at?: string | null;
}

/**
 * Calculate period-based ROI considering capital additions over time
 */
export const calculatePeriodBasedROI = (
  trades: Trade[],
  capitalLog: CapitalLogEntry[]
): {
  overallROI: number;
  periods: CapitalPeriod[];
  weightedROI: number;
} => {
  if (!capitalLog || capitalLog.length === 0) {
    // Fallback to simple ROI if no capital log exists
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || t.profit_loss || 0), 0);
    return {
      overallROI: 0,
      periods: [],
      weightedROI: 0,
    };
  }

  // Sort capital log by date ascending
  const sortedLog = [...capitalLog].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
  );

  const periods: CapitalPeriod[] = [];

  // Create periods based on capital additions
  for (let i = 0; i < sortedLog.length; i++) {
    const currentEntry = sortedLog[i];
    const nextEntry = sortedLog[i + 1];

    const startDate = currentEntry.log_date;
    const endDate = nextEntry ? nextEntry.log_date : undefined;
    const startingCapital = currentEntry.total_after;

    // Filter trades within this period
    const periodTrades = trades.filter((trade) => {
      const tradeDate = trade.closed_at || trade.trade_date;
      if (!tradeDate) return false;

      const tradeDateObj = new Date(tradeDate);
      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : new Date();

      return tradeDateObj >= startDateObj && tradeDateObj < endDateObj;
    });

    // Calculate profit for this period
    const periodProfit = periodTrades.reduce(
      (sum, t) => sum + (t.pnl || t.profit_loss || 0),
      0
    );

    // Calculate ROI for this period
    const periodROI = startingCapital > 0 ? (periodProfit / startingCapital) * 100 : 0;

    periods.push({
      startDate,
      endDate,
      startingCapital,
      roi: periodROI,
      profit: periodProfit,
      notes: currentEntry.notes,
    });
  }

  // Calculate weighted ROI across all periods
  let totalWeightedROI = 0;
  let totalCapital = 0;

  periods.forEach((period) => {
    totalWeightedROI += period.roi * period.startingCapital;
    totalCapital += period.startingCapital;
  });

  const weightedROI = totalCapital > 0 ? totalWeightedROI / totalCapital : 0;

  // Overall ROI is the last period's cumulative result
  const overallROI = periods.length > 0 ? periods[periods.length - 1].roi : 0;

  return {
    overallROI,
    periods,
    weightedROI,
  };
};

/**
 * Get the active capital for a specific date
 */
export const getCapitalAtDate = (
  date: string,
  capitalLog: CapitalLogEntry[]
): number => {
  if (!capitalLog || capitalLog.length === 0) return 0;

  const sortedLog = [...capitalLog].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );

  const targetDate = new Date(date);

  // Find the most recent capital entry before or on this date
  const activeEntry = sortedLog.find(
    (entry) => new Date(entry.log_date) <= targetDate
  );

  return activeEntry ? activeEntry.total_after : 0;
};

/**
 * Calculate current capital (most recent entry)
 */
export const getCurrentCapital = (capitalLog: CapitalLogEntry[]): number => {
  if (!capitalLog || capitalLog.length === 0) return 0;

  const sortedLog = [...capitalLog].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );

  return sortedLog[0]?.total_after || 0;
};

/**
 * Format capital log for chart display
 */
export const formatCapitalLogForChart = (capitalLog: CapitalLogEntry[]) => {
  return capitalLog
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
    .map((entry) => ({
      date: format(new Date(entry.log_date), 'MMM dd, yyyy'),
      capital: entry.total_after,
      added: entry.amount_added,
      notes: entry.notes,
    }));
};
