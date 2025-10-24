/**
 * Leverage and Stop Loss Calculator Utilities
 * Core math for crypto futures trading
 */

export const LEVERAGE_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100];

export type Side = "long" | "short";
export type RiskLevel = "Low" | "Medium" | "High";
export type SizeMode = "quote" | "base";

export function pct(n: number): number {
  return n * 100;
}

export function clamp(val: number, lo: number, hi: number): number {
  return Math.min(Math.max(val, lo), hi);
}

export function roundDownToStep(val: number, steps: number[]): number {
  const sorted = [...steps].sort((a, b) => a - b);
  let r = sorted[0];
  for (const s of sorted) {
    if (s <= val) r = s;
    else break;
  }
  return r;
}

export function stopPercentFromPrices(entry: number, stop: number): number {
  return Math.abs((entry - stop) / entry) * 100;
}

export function stopPriceFromPercent(entry: number, sPct: number, side: Side): number {
  const s = sPct / 100;
  return side === "long" ? entry * (1 - s) : entry * (1 + s);
}

export function maxLeverageFromStopPercent(sPct: number, bufferB: number, cap: number): number {
  const Lstar = 1 / (sPct / 100 + bufferB / 100);
  const rounded = roundDownToStep(Lstar, LEVERAGE_STEPS);
  return Math.min(Math.max(rounded, 1), cap);
}

export function liquidationPriceApprox(entry: number, L: number, bufferB: number, side: Side): number {
  const dliq = Math.max(1 / L - bufferB / 100, 0);
  return side === "long" ? entry * (1 - dliq) : entry * (1 + dliq);
}

export function safetyMarginPercent(entry: number, stop: number, pliq: number, side: Side): number {
  if (side === "long") return ((stop - pliq) / entry) * 100;
  return ((pliq - stop) / entry) * 100;
}

export function riskValueQuote(entry: number, stop: number, quoteSize: number): number {
  return Math.abs(entry - stop) * (quoteSize / entry);
}

export function riskValueBase(entry: number, stop: number, baseQty: number): number {
  return Math.abs(entry - stop) * baseQty;
}

export function riskLevelFrom(L: number, marginPct: number): RiskLevel {
  if (L <= 20 && marginPct >= 0.75) return "Low";
  if (L > 50 || marginPct < 0.25) return "High";
  return "Medium";
}

export interface CalculationResult {
  deltaPct: number;
  Lstar: number;
  Lmax: number;
  dliqUsed: number;
  pliq: number;
  marginPct: number;
  riskLevel: RiskLevel;
  riskValue?: number;
  stop: number;
  isValid: boolean;
  warnings: string[];
}

export function calculateLeverageMetrics(
  entry: number,
  stop: number,
  desiredLeverage: number | null,
  side: Side,
  bufferB: number,
  maxLeverageCap: number,
  sizeValue: number | null,
  sizeMode: SizeMode
): CalculationResult {
  const warnings: string[] = [];
  
  // Validate entry and stop
  if (entry <= 0 || stop <= 0) {
    return {
      deltaPct: 0,
      Lstar: 0,
      Lmax: 1,
      dliqUsed: 0,
      pliq: 0,
      marginPct: 0,
      riskLevel: "High",
      stop,
      isValid: false,
      warnings: ["Invalid prices"],
    };
  }

  // Check if stop is on correct side
  if (side === "long" && stop >= entry) {
    warnings.push("Stop should be below entry for long positions");
  }
  if (side === "short" && stop <= entry) {
    warnings.push("Stop should be above entry for short positions");
  }

  const deltaPct = stopPercentFromPrices(entry, stop);
  
  if (deltaPct === 0) {
    warnings.push("Stop cannot equal entry");
    return {
      deltaPct: 0,
      Lstar: 0,
      Lmax: 1,
      dliqUsed: 0,
      pliq: entry,
      marginPct: 0,
      riskLevel: "High",
      stop,
      isValid: false,
      warnings,
    };
  }

  // Calculate max safe leverage
  const Lstar = 1 / (deltaPct / 100 + bufferB / 100);
  const Lmax = maxLeverageFromStopPercent(deltaPct, bufferB, maxLeverageCap);

  // Use desired leverage if provided and valid, otherwise use Lmax
  let usedLeverage = Lmax;
  if (desiredLeverage !== null) {
    if (desiredLeverage > Lmax) {
      warnings.push(`Desired leverage ${desiredLeverage}x exceeds safe max ${Lmax}x`);
      usedLeverage = Lmax;
    } else {
      usedLeverage = desiredLeverage;
    }
  }

  // Calculate liquidation price
  const pliq = liquidationPriceApprox(entry, usedLeverage, bufferB, side);
  
  // Calculate safety margin
  const marginPct = safetyMarginPercent(entry, stop, pliq, side);
  
  // Calculate risk level
  const riskLevel = riskLevelFrom(usedLeverage, marginPct);

  // Calculate risk value if size provided
  let riskValue: number | undefined;
  if (sizeValue !== null && sizeValue > 0) {
    riskValue = sizeMode === "quote" 
      ? riskValueQuote(entry, stop, sizeValue)
      : riskValueBase(entry, stop, sizeValue);
  }

  // Additional warnings
  if (Lmax === 1) {
    warnings.push("Stop too wide for leverage increase");
  }
  if (marginPct < 0.25) {
    warnings.push("High risk: Stop is close to liquidation");
  }

  return {
    deltaPct,
    Lstar,
    Lmax,
    dliqUsed: Math.max(1 / usedLeverage - bufferB / 100, 0),
    pliq,
    marginPct,
    riskLevel,
    riskValue,
    stop,
    isValid: warnings.length === 0 || warnings.every(w => w.includes("exceeds safe max")),
    warnings,
  };
}
