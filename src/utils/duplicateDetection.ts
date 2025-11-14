import { supabase } from '@/integrations/supabase/client';
import type { Trade } from '@/types/trade';

interface ExtractedTrade {
  symbol?: string;
  symbol_temp?: string;
  opened_at?: string;
  closed_at?: string;
  trade_date?: string;
  created_at?: string;
  profit_loss?: number;
  pnl?: number;
  entry_price?: number;
  exit_price?: number;
  position_size?: number;
  side?: string;
  roi?: number;
  [key: string]: any;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedTrade?: Trade | ExtractedTrade;
  matchScore?: number;
  reasons?: string[];
}

/**
 * Normalizes a symbol for consistent comparison
 */
function normalizeSymbol(symbol?: string): string {
  if (!symbol) return '';
  
  // Common mappings
  const mappings: Record<string, string> = {
    'DAX INDEX': 'DAXINDEX',
    'DAX 40': 'DAX40',
    'NQ': 'NQ100',
    'ES': 'ES500',
    'YM': 'YM30',
  };
  
  let normalized = symbol.toUpperCase().trim();
  
  // Check mappings first
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // Remove common separators and characters
  normalized = normalized
    .replace(/[\s\-_\/\\]/g, '')
    .replace(/[^A-Z0-9]/g, '');
  
  return normalized;
}

/**
 * Checks if two timestamps are within a tolerance window (15 minutes default)
 */
function areTimestampsClose(date1?: string, date2?: string, toleranceMinutes = 15): boolean {
  if (!date1 || !date2) return false;
  const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  return diff < toleranceMinutes * 60000;
}

/**
 * Checks if two dates are the same day
 */
function areSameDay(date1?: string, date2?: string): boolean {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Checks if two numbers are close (absolute diff <= 0.5 OR relative diff <= 0.5%)
 */
function areNumbersClose(num1?: number, num2?: number): boolean {
  if (num1 === undefined || num2 === undefined) return false;
  if (num1 === 0 && num2 === 0) return true;
  
  const absDiff = Math.abs(num1 - num2);
  if (absDiff <= 0.5) return true; // Absolute tolerance
  
  const avg = (Math.abs(num1) + Math.abs(num2)) / 2;
  if (avg === 0) return absDiff === 0;
  
  return (absDiff / avg) <= 0.005; // 0.5% relative tolerance
}

/**
 * Checks if an extracted trade is a duplicate of an existing trade
 */
export function isDuplicateTrade(
  extractedTrade: ExtractedTrade,
  existingTrade: any,
  skipSymbolCheck = false
): DuplicateCheckResult {
  let matchScore = 0;
  let totalChecks = 0;
  const reasons: string[] = [];

  // Check symbol (most important) - must match unless within-batch comparison
  if (!skipSymbolCheck) {
    const extractedSymbol = normalizeSymbol(extractedTrade.symbol || extractedTrade.symbol_temp);
    const existingSymbol = normalizeSymbol(existingTrade.symbol || existingTrade.symbol_temp);
    
    if (extractedSymbol && existingSymbol) {
      totalChecks++;
      if (extractedSymbol === existingSymbol) {
        matchScore++;
        reasons.push(`Symbol match: ${extractedSymbol}`);
      } else {
        return { isDuplicate: false, reasons: ['Symbol mismatch'] };
      }
    }
  }

  // Check dates - try multiple fields
  let dateMatched = false;
  
  // Try opened_at/closed_at first
  if (extractedTrade.opened_at && existingTrade.opened_at) {
    totalChecks++;
    if (areTimestampsClose(extractedTrade.opened_at, existingTrade.opened_at)) {
      matchScore++;
      dateMatched = true;
      reasons.push('Opened at timestamp match');
    }
  }
  
  if (extractedTrade.closed_at && existingTrade.closed_at) {
    totalChecks++;
    if (areTimestampsClose(extractedTrade.closed_at, existingTrade.closed_at)) {
      matchScore++;
      dateMatched = true;
      reasons.push('Closed at timestamp match');
    }
  }
  
  // Try trade_date
  if (!dateMatched && extractedTrade.trade_date && existingTrade.trade_date) {
    totalChecks++;
    if (areSameDay(extractedTrade.trade_date, existingTrade.trade_date)) {
      matchScore++;
      dateMatched = true;
      reasons.push('Trade date match');
    }
  }
  
  // Fallback to created_at (same day)
  if (!dateMatched && extractedTrade.created_at && existingTrade.created_at) {
    totalChecks++;
    if (areSameDay(extractedTrade.created_at, existingTrade.created_at)) {
      matchScore++;
      reasons.push('Created at date match');
    }
  }

  // Check P&L
  const extractedPnL = extractedTrade.profit_loss ?? extractedTrade.pnl;
  const existingPnL = existingTrade.profit_loss ?? existingTrade.pnl;
  if (extractedPnL !== undefined && existingPnL !== undefined) {
    totalChecks++;
    if (areNumbersClose(extractedPnL, existingPnL)) {
      matchScore++;
      reasons.push(`P&L match: ${extractedPnL}`);
    }
  }

  // Check ROI
  if (extractedTrade.roi !== undefined && existingTrade.roi !== undefined) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.roi, existingTrade.roi)) {
      matchScore++;
      reasons.push('ROI match');
    }
  }

  // Check entry price
  if (extractedTrade.entry_price && existingTrade.entry_price) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.entry_price, existingTrade.entry_price)) {
      matchScore++;
      reasons.push('Entry price match');
    }
  }

  // Check exit price
  if (extractedTrade.exit_price && existingTrade.exit_price) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.exit_price, existingTrade.exit_price)) {
      matchScore++;
      reasons.push('Exit price match');
    }
  }

  // Check position size
  if (extractedTrade.position_size && existingTrade.position_size) {
    totalChecks++;
    if (areNumbersClose(extractedTrade.position_size, existingTrade.position_size)) {
      matchScore++;
      reasons.push('Position size match');
    }
  }

  // Check side
  if (extractedTrade.side && existingTrade.side) {
    totalChecks++;
    if (extractedTrade.side.toLowerCase() === existingTrade.side.toLowerCase()) {
      matchScore++;
      reasons.push(`Side match: ${extractedTrade.side}`);
    }
  }

  // Calculate match percentage
  const matchPercentage = totalChecks > 0 ? matchScore / totalChecks : 0;

  // Relaxed threshold: 60% match and at least 2 matching fields
  const isDuplicate = matchPercentage >= 0.6 && matchScore >= 2;

  return {
    isDuplicate,
    matchedTrade: isDuplicate ? existingTrade : undefined,
    matchScore: matchPercentage,
    reasons: isDuplicate ? reasons : [],
  };
}

/**
 * Checks multiple extracted trades against user's existing trades AND within the batch itself
 */
export async function checkForDuplicates(
  extractedTrades: ExtractedTrade[],
  userId: string
): Promise<Map<number, DuplicateCheckResult>> {
  const duplicateMap = new Map<number, DuplicateCheckResult>();

  if (!userId) {
    console.warn('checkForDuplicates called without userId');
    return duplicateMap;
  }

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

    console.log(`Checking ${extractedTrades.length} trades against ${existingTrades?.length || 0} existing trades for user ${userId}`);

    // First pass: Check against existing trades in DB
    if (existingTrades && existingTrades.length > 0) {
      extractedTrades.forEach((extractedTrade, index) => {
        for (const existingTrade of existingTrades) {
          const result = isDuplicateTrade(extractedTrade, existingTrade);
          if (result.isDuplicate) {
            duplicateMap.set(index, result);
            console.log(`Duplicate found at index ${index}:`, result.reasons);
            break; // Found a duplicate, no need to check further
          }
        }
      });
    }

    // Second pass: Check within-batch duplicates
    for (let i = 0; i < extractedTrades.length; i++) {
      // Skip if already marked as duplicate from DB check
      if (duplicateMap.has(i)) continue;
      
      for (let j = i + 1; j < extractedTrades.length; j++) {
        // Skip if already marked as duplicate
        if (duplicateMap.has(j)) continue;
        
        const result = isDuplicateTrade(extractedTrades[i], extractedTrades[j], true);
        if (result.isDuplicate) {
          // Mark the later trade as duplicate
          duplicateMap.set(j, {
            ...result,
            matchedTrade: { ...extractedTrades[i], source: 'current_batch' }
          });
          console.log(`Within-batch duplicate found: ${j} matches ${i}`, result.reasons);
        }
      }
    }

    console.log(`Total duplicates found: ${duplicateMap.size}`);
    return duplicateMap;
  } catch (error) {
    console.error('Error in checkForDuplicates:', error);
    return duplicateMap;
  }
}
