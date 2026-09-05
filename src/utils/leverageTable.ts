/**
 * Static leverage reference table.
 * Maps the unleveraged percentage move (entry -> stop distance) to the
 * maximum sensible leverage. Single source of truth for the Leverage Table
 * modal (Risk Control) and the Risk Copilot leverage field.
 */
export interface LeverageRow {
  /** inclusive lower bound of the unleveraged move, in % */
  min: number;
  /** inclusive upper bound of the unleveraged move, in % */
  max: number;
  leverage: number;
  /** display label, e.g. "0.41% – 0.60%" */
  range: string;
}

const RAW: [number, number, number][] = [
  [0.01, 0.4, 100],
  [0.41, 0.6, 90],
  [0.61, 0.75, 80],
  [0.76, 0.9, 70],
  [0.91, 1.15, 60],
  [1.16, 1.45, 50],
  [1.46, 1.95, 40],
  [1.96, 2.8, 30],
  [2.81, 3.5, 25],
  [3.55, 4.45, 20],
  [4.46, 6.25, 15],
  [6.26, 9.4, 10],
  [9.41, 11.8, 8],
  [11.81, 16, 6],
  [16.01, 24, 4],
  [24.01, 32, 3],
  [32.01, 48, 2],
  [48.01, 98, 1],
];

const fmt = (n: number) => `${n}%`;

export const LEVERAGE_ROWS: LeverageRow[] = RAW.map(([min, max, leverage]) => ({
  min,
  max,
  leverage,
  range: `${fmt(min)} – ${fmt(max)}`,
}));

/**
 * Max leverage for a given unleveraged stop distance (in %).
 * Returns null for invalid input; clamps above the table to 1x.
 */
export function maxLeverageForMove(movePct: number): LeverageRow | null {
  if (!isFinite(movePct) || movePct <= 0) return null;
  const row = LEVERAGE_ROWS.find(r => movePct >= r.min && movePct <= r.max);
  if (row) return row;
  // Below the first bound -> tightest stop bucket. Above the last -> 1x.
  if (movePct < LEVERAGE_ROWS[0].min) return LEVERAGE_ROWS[0];
  return LEVERAGE_ROWS[LEVERAGE_ROWS.length - 1];
}
