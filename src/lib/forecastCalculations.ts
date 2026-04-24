interface Trade {
  roi: number | null;
  margin: number | null;
  pnl: number | null;
}

export interface AdvancedStats {
  success_rate: number;
  weighted_roi_gain: number;
  weighted_roi_loss: number;
  roi_std_dev: number;
  avg_margin: number;
  total_trades: number;

  /** Trades per trading day (derived from history). */
  trades_per_day: number;

  /** Per-trade geometric expectancy as decimal. */
  g_per_trade: number;

  daily_growth_base: number;
  daily_growth_optimistic: number;
  daily_growth_conservative: number;
  monthly_growth_base: number;
  monthly_growth_optimistic: number;
  monthly_growth_conservative: number;
  yearly_growth_base: number;
  yearly_growth_optimistic: number;
  yearly_growth_conservative: number;
  five_year_growth_base: number;
  five_year_growth_optimistic: number;
  five_year_growth_conservative: number;

  /** True when the sample is too small or unrealistic → caller should show "—". */
  capped: boolean;
  cap_reason?: string;
}

/** Reasonable sanity caps. */
const DAILY_GROWTH_MAX =  0.05;   // +5% per trading day (≈ 263% annualized) ceiling
const DAILY_GROWTH_MIN = -0.03;   // −3% per trading day floor (caps conservative)
const GROWTH_DISPLAY_CAP = 50;    // cap displayed multiples at 50× (5000%) to avoid overflow
const GROWTH_DISPLAY_FLOOR = -0.95; // cap displayed loss at −95% (never render −100%)

const clampGrowth = (daily: number) =>
  Math.max(DAILY_GROWTH_MIN, Math.min(DAILY_GROWTH_MAX, daily));

const clampMultiple = (m: number) => {
  if (!isFinite(m)) return GROWTH_DISPLAY_CAP;
  return Math.max(GROWTH_DISPLAY_FLOOR, Math.min(GROWTH_DISPLAY_CAP, m));
};

/**
 * Calculate forward-looking growth projections using *per-trade* geometric
 * expectancy, scaled by the trader's actual pace (trades per day), and capped
 * to realistic envelopes to prevent overflow (10^56x etc).
 *
 * Old version treated G (per-trade log return) AS daily growth and then
 * compounded 365 calendar days × 5 — overflowing for any positive edge. Fixed.
 *
 * Params (optional):
 *   tradingDays — total trading days observed in the sample.
 *                 If provided, trades_per_day is derived from it. Otherwise
 *                 defaults to 1 trade/day (extremely conservative).
 */
export const calculateAdvancedStats = (
  trades: Trade[],
  tradingDays?: number,
): AdvancedStats | null => {
  if (!trades || trades.length === 0) {
    return null;
  }

  const validTrades = trades.filter(t => t.roi !== null && t.roi !== undefined);

  if (validTrades.length < 5) {
    return null; // Need minimum trades for statistical validity
  }

  const total_trades = validTrades.length;

  const winningTrades = validTrades.filter(t => (t.roi || 0) > 0);
  const losingTrades = validTrades.filter(t => (t.roi || 0) <= 0);
  const success_rate = winningTrades.length / total_trades;

  const weighted_roi_gain = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / winningTrades.length
    : 0;

  const weighted_roi_loss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / losingTrades.length
    : 0;

  const mean_roi = validTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / total_trades;
  const variance = validTrades.reduce((sum, t) => {
    const diff = (t.roi || 0) - mean_roi;
    return sum + (diff * diff);
  }, 0) / total_trades;
  const roi_std_dev = Math.sqrt(variance);

  const tradesWithMargin = trades.filter(t => t.margin !== null && t.margin !== undefined);
  const avg_margin = tradesWithMargin.length > 0
    ? tradesWithMargin.reduce((sum, t) => sum + (t.margin || 0), 0) / tradesWithMargin.length
    : 0;

  // ── Geometric expectancy PER TRADE ──
  // ROI values in this dataset are a percentage applied to the margin committed
  // on a single trade — NOT a percentage of total equity. To project total
  // account growth we need to assume that position sizing stays proportional
  // to equity (compounding). Using ROI directly is therefore an approximation
  // that slightly overstates growth on days with multiple leveraged trades,
  // which is why we apply the daily cap below.
  const roi_gain_decimal = weighted_roi_gain / 100;
  const roi_loss_decimal = weighted_roi_loss / 100;

  const gain_term = roi_gain_decimal > -1 ? Math.log(1 + roi_gain_decimal) : -5;
  const loss_term = roi_loss_decimal > -1 ? Math.log(1 + roi_loss_decimal) : -5;

  const g_per_trade = (success_rate * gain_term) + ((1 - success_rate) * loss_term);

  // ── Trades per day (pace) ──
  // Default to 1 if caller doesn't know — extremely conservative.
  const trades_per_day = tradingDays && tradingDays > 0
    ? Math.max(0.1, total_trades / tradingDays)
    : 1;

  // ── Daily log-return scales linearly with pace, volatility with sqrt(pace) ──
  // This is the standard √time scaling for independent returns.
  const std_dev_decimal = roi_std_dev / 100;
  const volatilityScale = Math.sqrt(trades_per_day);
  const daily_log_base = g_per_trade * trades_per_day;

  // Raw (uncapped) daily growth rates
  const raw_daily_base = Math.exp(daily_log_base) - 1;
  const raw_daily_optimistic = Math.exp(daily_log_base + std_dev_decimal * volatilityScale * 0.5) - 1;
  // Conservative: subtract HALF a standard deviation (not full) to avoid
  // projecting -100% wipeouts that are mathematically guaranteed but
  // unrealistic for an active trader who can stop trading.
  const raw_daily_conservative = Math.exp(daily_log_base - std_dev_decimal * volatilityScale * 0.5) - 1;

  // Apply realism caps
  const daily_growth_base = clampGrowth(raw_daily_base);
  const daily_growth_optimistic = clampGrowth(raw_daily_optimistic);
  const daily_growth_conservative = clampGrowth(raw_daily_conservative);

  const capped =
    raw_daily_base !== daily_growth_base ||
    raw_daily_optimistic !== daily_growth_optimistic ||
    raw_daily_conservative !== daily_growth_conservative;

  // ── Compound over trading days (not calendar days) ──
  // 21 trading days ≈ 1 month, 252 ≈ 1 year, 1260 ≈ 5 years
  const compound = (dailyGrowth: number, days: number) =>
    clampMultiple(Math.pow(1 + dailyGrowth, days) - 1);

  return {
    success_rate: success_rate * 100,
    weighted_roi_gain,
    weighted_roi_loss,
    roi_std_dev,
    avg_margin,
    total_trades,
    trades_per_day,
    g_per_trade,

    daily_growth_base,
    daily_growth_optimistic,
    daily_growth_conservative,

    monthly_growth_base:           compound(daily_growth_base, 21),
    monthly_growth_optimistic:     compound(daily_growth_optimistic, 21),
    monthly_growth_conservative:   compound(daily_growth_conservative, 21),

    yearly_growth_base:            compound(daily_growth_base, 252),
    yearly_growth_optimistic:      compound(daily_growth_optimistic, 252),
    yearly_growth_conservative:    compound(daily_growth_conservative, 252),

    five_year_growth_base:         compound(daily_growth_base, 1260),
    five_year_growth_optimistic:   compound(daily_growth_optimistic, 1260),
    five_year_growth_conservative: compound(daily_growth_conservative, 1260),

    capped,
    cap_reason: capped
      ? 'Projected growth has been capped to realistic bounds (±5%/day, ≤50× over horizon) to avoid numerical overflow and unrealistic compounding on small samples.'
      : undefined,
  };
};

export interface GoalSimulatorResult {
  required_margin_percent: number;
  dollar_amount_per_trade: number;
  potential_loss_per_trade: number;
  daily_risk_exposure: number;
  is_high_risk: boolean;
  is_negative_expectancy: boolean;
}

export const calculateRequiredMargin = (
  dailyGoal: number,
  balance: number,
  winRate: number,
  avgGainRoi: number,
  avgLossRoi: number,
  tradesPerDay: number
): GoalSimulatorResult | null => {
  if (!balance || balance <= 0 || !tradesPerDay || tradesPerDay <= 0) {
    return null;
  }

  const win_rate_decimal = winRate / 100;
  const gain_roi_decimal = avgGainRoi / 100;
  const loss_roi_decimal = avgLossRoi / 100;

  const expected_value_per_trade = (win_rate_decimal * gain_roi_decimal) + ((1 - win_rate_decimal) * loss_roi_decimal);

  const is_negative_expectancy = expected_value_per_trade <= 0;

  const denominator = balance * tradesPerDay * expected_value_per_trade;

  if (Math.abs(denominator) < 0.000001) {
    return null;
  }

  const required_margin_decimal = dailyGoal / denominator;
  const required_margin_percent = required_margin_decimal * 100;

  const dollar_amount_per_trade = required_margin_decimal * balance;
  const potential_loss_per_trade = dollar_amount_per_trade * Math.abs(loss_roi_decimal);
  const daily_risk_exposure = dollar_amount_per_trade * tradesPerDay;

  const is_high_risk = required_margin_percent > 10;

  return {
    required_margin_percent,
    dollar_amount_per_trade,
    potential_loss_per_trade,
    daily_risk_exposure,
    is_high_risk,
    is_negative_expectancy,
  };
};
