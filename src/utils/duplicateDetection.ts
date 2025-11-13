import { supabase } from '@/integrations/supabase/client';
import type { Trade } from '@/types/trade';

interface ExtractedTrade {
  symbol?: string;
  symbol_temp?: string;
  opened_at?: string;
  closed_at?: string;
  profit_loss?: number;
  pnl?: number;
  entry_price?: number;
  exit_price?: number;
  position_size?: number;
  side?: string;
  [key: string]: any;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedTrade?: Trade;
  matchScore?: number;
}

/**
 * Checks if two timestamps are within 1 minute of each other
 */
function areTimestampsClose(date1?: string, date2?: string): boolean {
  if (!date1 || !date2) return false;
  const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  return diff < 60000; // 1 minute tolerance
}

/**
 * Checks if two numbers are very close (within 0.01%)
 */
function areNumbersClose(num1?: number, num2?: number): boolean {
  if (num1 === undefined || num2 === undefined) return false;
  if (num1 === 0 && num2 === 0) return true;
  const diff = Math.abs(num1 - num2);
  const avg = (Math.abs(num1) + Math.abs(num2)) / 2;
  return avg === 0 ? diff === 0 : (diff / avg) < 0.0001; // 0.01% tolerance
}

/**
 * Checks if an extracted trade is a duplicate of an existing trade
 */
export function isDuplicateTrade(
  extractedTrade: ExtractedTrade,
  existingTrade: any
): DuplicateCheckResult {
  let matchScore = 0;
  let totalChecks = 0;

  // Check symbol (most important)
  const extractedSymbol = (extractedTrade.symbol || extractedTrade.symbol_temp || '').toUpperCase();
  const existingSymbol = (existingTrade.symbol || existingTrade.symbol_temp || '').toUpperCase();
  if (extractedSymbol && existingSymbol) {
    totalChecks++;
    if (extractedSymbol === existingSymbol) matchScore++;
    else return { isDuplicate: false }; // Symbol must match
  }

  // Check opened_at timestamp
  if (extractedTrade.opened_at && existingTrade.opened_at) {
    totalChecks++;
    if (areTimestampsClose(extractedTrade.opened_at, existingTrade.opened_at)) {
      matchScore++;
    }
  }

  // Check closed_at timestamp
  if (extractedTrade.closed_at && existingTrade.closed_at) {
    totalChecks++;
    if (areTimestampsClose(extractedTrade.closed_at, existingTrade.closed_at)) {
      matchScore++;
    }
  }

  // Check P&L
  const extractedPnL = extractedTrade.profit_loss ?? extractedTrade.pnl;
  const existingPnL = existingTrade.profit_loss ?? existingTrade.pnl;
  if (extractedPnL !== undefined && existingPnL !== undefined) {
    totalChecks++;
    if (areNumbersClose(extractedPnL, existingPnL)) {
      matchScore++;
    }
  }

  // Check entry price
  if (extractedTrade.entry_price && existingTrade.entry_price) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.entry_price, existingTrade.entry_price)) {
      matchScore++;
    }
  }

  // Check exit price
  if (extractedTrade.exit_price && existingTrade.exit_price) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.exit_price, existingTrade.exit_price)) {
      matchScore++;
    }
  }

  // Check position size
  if (extractedTrade.position_size && existingTrade.position_size) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.position_size, existingTrade.position_size)) {
      matchScore++;
    }
  }

  // Check side
  if (extractedTrade.side && existingTrade.side) {
    totalChecks++;
    if (extractedTrade.side.toLowerCase() === existingTrade.side.toLowerCase()) {
      matchScore++;
    }
  }

  // Calculate match percentage
  const matchPercentage = totalChecks > 0 ? matchScore / totalChecks : 0;

  // Consider it a duplicate if 80% or more fields match
  const isDuplicate = matchPercentage >= 0.8 && matchScore >= 3; // At least 3 matching fields

  return {
    isDuplicate,
    matchedTrade: isDuplicate ? existingTrade : undefined,
    matchScore: matchPercentage,
  };
}

/**
 * Checks multiple extracted trades against user's existing trades
 */
export async function checkForDuplicates(
  extractedTrades: ExtractedTrade[],
  userId: string
): Promise<Map<number, DuplicateCheckResult>> {
  const duplicateMap = new Map<number, DuplicateCheckResult>();

  try {
    // Fetch user's existing trades from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: existingTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching existing trades:', error);
      return duplicateMap;
    }

    if (!existingTrades || existingTrades.length === 0) {
      return duplicateMap; // No existing trades, nothing can be a duplicate
    }

    // Check each extracted trade against existing trades
    extractedTrades.forEach((extractedTrade, index) => {
      for (const existingTrade of existingTrades) {
        const result = isDuplicateTrade(extractedTrade, existingTrade);
        if (result.isDuplicate) {
          duplicateMap.set(index, result);
          break; // Found a duplicate, no need to check further
        }
      }
    });

    return duplicateMap;
  } catch (error) {
    console.error('Error in checkForDuplicates:', error);
    return duplicateMap;
  }
}
