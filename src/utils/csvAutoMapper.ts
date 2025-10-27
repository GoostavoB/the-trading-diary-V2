// Smart CSV column auto-mapping with fuzzy matching
import { ExtractedTrade } from "@/types/trade";

export interface ColumnMapping {
  tradeField: keyof ExtractedTrade;
  csvColumn: string | null;
  confidence: number; // 0-100
  isRequired: boolean;
}

export interface AutoMapResult {
  mappings: ColumnMapping[];
  overallConfidence: number;
}

// Required fields for a valid trade (all fields are now optional)
const REQUIRED_FIELDS: (keyof ExtractedTrade)[] = [];

// Keywords for each trade field (lowercase)
const FIELD_KEYWORDS: Record<keyof ExtractedTrade, string[]> = {
  symbol: ['symbol', 'asset', 'coin', 'pair', 'ticker', 'instrument', 'market'],
  broker: ['broker', 'exchange', 'platform'],
  setup: ['setup', 'strategy', 'pattern', 'type'],
  emotional_tag: ['emotion', 'feeling', 'mood', 'sentiment'],
  entry_price: ['entry', 'open', 'buy_price', 'purchase', 'order_price', 'avg_entry'],
  exit_price: ['exit', 'close', 'sell_price', 'realized_price', 'avg_exit'],
  position_size: ['quantity', 'qty', 'size', 'amount', 'executed', 'volume', 'position'],
  side: ['side', 'direction', 'type', 'buy_sell', 'long_short', 'order_type'],
  leverage: ['leverage', 'multiplier', 'margin_ratio'],
  funding_fee: ['funding', 'funding_fee', 'borrowing'],
  trading_fee: ['fee', 'commission', 'trading_fee', 'cost'],
  margin: ['margin', 'collateral', 'initial_margin'],
  opened_at: ['opened', 'open_time', 'entry_time', 'start', 'created', 'date', 'time'],
  closed_at: ['closed', 'close_time', 'exit_time', 'end', 'completed'],
  period_of_day: ['period', 'session', 'time_of_day'],
  profit_loss: ['pnl', 'profit', 'loss', 'realized', 'pl', 'net_profit'],
  roi: ['roi', 'return', 'percentage', 'percent'],
  duration_days: ['duration_days', 'days'],
  duration_hours: ['duration_hours', 'hours'],
  duration_minutes: ['duration_minutes', 'minutes'],
  notes: ['notes', 'comment', 'description', 'memo']
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-100)
function calculateSimilarity(csvHeader: string, keywords: string[]): number {
  const header = csvHeader.toLowerCase().replace(/[_\s-]/g, '');
  let bestScore = 0;

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase().replace(/[_\s-]/g, '');
    
    // Exact match
    if (header === kw || header.includes(kw) || kw.includes(header)) {
      return 100;
    }

    // Fuzzy match
    const distance = levenshteinDistance(header, kw);
    const maxLength = Math.max(header.length, kw.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    bestScore = Math.max(bestScore, similarity);
  }

  return bestScore;
}

// Main auto-mapping function
export function autoMapColumns(csvHeaders: string[]): AutoMapResult {
  const mappings: ColumnMapping[] = [];
  const usedColumns = new Set<string>();

  // Map each trade field
  for (const field of Object.keys(FIELD_KEYWORDS) as (keyof ExtractedTrade)[]) {
    let bestMatch: { column: string; confidence: number } | null = null;

    // Find best matching CSV column
    for (const header of csvHeaders) {
      if (usedColumns.has(header)) continue;

      const confidence = calculateSimilarity(header, FIELD_KEYWORDS[field]);
      
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { column: header, confidence };
      }
    }

    // Only accept matches with confidence >= 60%
    const isRequired = REQUIRED_FIELDS.includes(field);
    if (bestMatch && bestMatch.confidence >= 60) {
      mappings.push({
        tradeField: field,
        csvColumn: bestMatch.column,
        confidence: bestMatch.confidence,
        isRequired
      });
      usedColumns.add(bestMatch.column);
    } else {
      mappings.push({
        tradeField: field,
        csvColumn: null,
        confidence: 0,
        isRequired
      });
    }
  }

  // Calculate overall confidence
  const requiredMappings = mappings.filter(m => m.isRequired);
  const mappedRequired = requiredMappings.filter(m => m.csvColumn !== null);
  const overallConfidence = (mappedRequired.length / requiredMappings.length) * 100;

  return { mappings, overallConfidence };
}

// Find matching template based on header similarity
export function findBestTemplateMatch(
  csvHeaders: string[],
  templates: Array<{ id: string; sample_headers: string[]; broker_name: string }>
): { templateId: string; brokerName: string; similarity: number } | null {
  let bestMatch: { templateId: string; brokerName: string; similarity: number } | null = null;

  for (const template of templates) {
    const matchingHeaders = csvHeaders.filter(h => 
      template.sample_headers.includes(h)
    );
    const similarity = (matchingHeaders.length / csvHeaders.length) * 100;

    if (similarity >= 80 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = {
        templateId: template.id,
        brokerName: template.broker_name,
        similarity
      };
    }
  }

  return bestMatch;
}

// Validate mappings are complete
export function validateMappings(mappings: ColumnMapping[]): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields = mappings
    .filter(m => m.isRequired && m.csvColumn === null)
    .map(m => m.tradeField);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
