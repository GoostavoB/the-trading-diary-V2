import Papa from 'papaparse';
import { ExtractedTrade } from '@/types/trade';

export type BrokerFormat = 
  | 'binance-futures'
  | 'bybit'
  | 'okx'
  | 'app-export'
  | 'generic';

export interface ParsedCSVResult {
  data: any[];
  headers: string[];
  errors: Papa.ParseError[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface BrokerMapping {
  [key: string]: string | string[];
}

const brokerMappings: Record<BrokerFormat, BrokerMapping> = {
  'binance-futures': {
    symbol: ['Symbol', 'symbol'],
    side: ['Side', 'side'],
    entry_price: ['Entry Price', 'entry price', 'entryPrice'],
    exit_price: ['Exit Price', 'exit price', 'exitPrice'],
    position_size: ['Qty', 'qty', 'Quantity', 'quantity'],
    opened_at: ['Trade Time', 'trade time', 'Time'],
    closed_at: ['Trade Time', 'trade time', 'Time'],
    profit_loss: ['Realized Profit', 'realized profit', 'PnL', 'Profit'],
    trading_fee: ['Fee', 'fee', 'Trading Fee'],
    funding_fee: ['Funding Fee', 'funding fee'],
  },
  'bybit': {
    symbol: ['Symbol', 'symbol'],
    side: ['Side', 'side'],
    entry_price: ['Avg Entry Price', 'avg entry price', 'Entry Price'],
    exit_price: ['Exit Price', 'exit price'],
    position_size: ['Order Qty', 'order qty', 'Qty'],
    opened_at: ['Created Time', 'created time', 'Create Time'],
    closed_at: ['Closed Time', 'closed time', 'Close Time'],
    profit_loss: ['Closed P&L', 'closed pnl', 'PnL'],
    trading_fee: ['Trading Fee', 'trading fee', 'Fee'],
  },
  'okx': {
    symbol: ['Instrument ID', 'instrument id', 'Symbol'],
    side: ['Side', 'side'],
    entry_price: ['Avg open px', 'avg open px', 'Entry Price'],
    exit_price: ['Exit Price', 'exit price'],
    position_size: ['Size', 'size', 'Qty'],
    opened_at: ['Create time', 'create time', 'Created Time'],
    closed_at: ['Update time', 'update time', 'Updated Time'],
    profit_loss: ['Realized PnL', 'realized pnl', 'PnL'],
    trading_fee: ['Fee', 'fee'],
  },
  'app-export': {
    symbol: ['symbol'],
    side: ['side'],
    entry_price: ['entry_price'],
    exit_price: ['exit_price'],
    position_size: ['position_size'],
    opened_at: ['opened_at'],
    closed_at: ['closed_at'],
    profit_loss: ['profit_loss'],
    roi: ['roi'],
    leverage: ['leverage'],
    margin: ['margin'],
    trading_fee: ['trading_fee'],
    funding_fee: ['funding_fee'],
    broker: ['broker'],
    setup: ['setup'],
    notes: ['notes'],
  },
  'generic': {},
};

export const parseCSVFile = (file: File): Promise<ParsedCSVResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data,
          headers: results.meta.fields || [],
          errors: results.errors,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const detectBrokerFormat = (headers: string[]): BrokerFormat => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Check for app export format (most specific)
  if (normalizedHeaders.includes('symbol') && 
      normalizedHeaders.includes('entry_price') && 
      normalizedHeaders.includes('exit_price') &&
      normalizedHeaders.includes('profit_loss')) {
    return 'app-export';
  }
  
  // Check for Binance Futures
  if (normalizedHeaders.some(h => h.includes('realized profit')) ||
      (normalizedHeaders.includes('symbol') && normalizedHeaders.includes('qty'))) {
    return 'binance-futures';
  }
  
  // Check for Bybit
  if (normalizedHeaders.some(h => h.includes('closed p&l')) ||
      normalizedHeaders.some(h => h.includes('order qty'))) {
    return 'bybit';
  }
  
  // Check for OKX
  if (normalizedHeaders.some(h => h.includes('instrument id')) ||
      normalizedHeaders.some(h => h.includes('avg open px'))) {
    return 'okx';
  }
  
  return 'generic';
};

const findColumnValue = (row: any, possibleNames: string | string[]): any => {
  const names = Array.isArray(possibleNames) ? possibleNames : [possibleNames];
  
  for (const name of names) {
    // Try exact match
    if (row[name] !== undefined) return row[name];
    
    // Try case-insensitive match
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lowerName) {
        return row[key];
      }
    }
  }
  
  return null;
};

const normalizeSide = (side: string): 'long' | 'short' => {
  const normalized = side.toLowerCase().trim();
  if (normalized === 'buy' || normalized === 'long') return 'long';
  if (normalized === 'sell' || normalized === 'short') return 'short';
  return 'long'; // default
};

const parseDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();
  
  // Try to parse various date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

const calculateDuration = (openedAt: string, closedAt: string) => {
  const start = new Date(openedAt);
  const end = new Date(closedAt);
  const diffMs = end.getTime() - start.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

const getPeriodOfDay = (dateStr: string): 'morning' | 'afternoon' | 'night' => {
  const date = new Date(dateStr);
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
};

export const mapBrokerCSVToTrades = (rows: any[], format: BrokerFormat): ExtractedTrade[] => {
  const mapping = brokerMappings[format];
  if (!mapping || Object.keys(mapping).length === 0) {
    return [];
  }
  
  return rows.map(row => {
    const symbol = findColumnValue(row, mapping.symbol) || '';
    const side = normalizeSide(findColumnValue(row, mapping.side) || 'long');
    const entryPrice = parseFloat(findColumnValue(row, mapping.entry_price) || '0');
    const exitPrice = parseFloat(findColumnValue(row, mapping.exit_price) || '0');
    const positionSize = parseFloat(findColumnValue(row, mapping.position_size) || '0');
    const openedAt = parseDate(findColumnValue(row, mapping.opened_at));
    const closedAt = parseDate(findColumnValue(row, mapping.closed_at));
    const profitLoss = parseFloat(findColumnValue(row, mapping.profit_loss) || '0');
    const tradingFee = parseFloat(findColumnValue(row, mapping.trading_fee) || '0');
    const fundingFee = parseFloat(findColumnValue(row, mapping.funding_fee) || '0');
    
    // Calculate additional fields
    const leverage = parseFloat(findColumnValue(row, mapping.leverage) || '1');
    const margin = positionSize * entryPrice / leverage;
    const roi = margin > 0 ? (profitLoss / margin) * 100 : 0;
    const duration = calculateDuration(openedAt, closedAt);
    const periodOfDay = getPeriodOfDay(closedAt);
    
    const trade: ExtractedTrade = {
      symbol,
      side,
      entry_price: entryPrice,
      exit_price: exitPrice,
      position_size: positionSize,
      leverage,
      margin,
      funding_fee: fundingFee,
      trading_fee: tradingFee,
      opened_at: openedAt,
      closed_at: closedAt,
      period_of_day: periodOfDay,
      profit_loss: profitLoss,
      roi,
      duration_days: duration.days,
      duration_hours: duration.hours,
      duration_minutes: duration.minutes,
    };
    
    // Add optional fields if available
    const broker = findColumnValue(row, mapping.broker);
    if (broker) trade.broker = broker;
    
    const setup = findColumnValue(row, mapping.setup);
    if (setup) trade.setup = setup;
    
    const notes = findColumnValue(row, mapping.notes);
    if (notes) trade.notes = notes;
    
    return trade;
  }).filter(trade => trade.symbol && trade.entry_price > 0 && trade.exit_price > 0);
};

export const validateTradeData = (trades: ExtractedTrade[]): ValidationResult => {
  const errors: ValidationError[] = [];
  
  trades.forEach((trade, index) => {
    const row = index + 1;
    
    if (!trade.symbol) {
      errors.push({ row, field: 'symbol', message: 'Symbol is required' });
    }
    
    if (!trade.entry_price || trade.entry_price <= 0) {
      errors.push({ row, field: 'entry_price', message: 'Entry price must be greater than 0' });
    }
    
    if (!trade.exit_price || trade.exit_price <= 0) {
      errors.push({ row, field: 'exit_price', message: 'Exit price must be greater than 0' });
    }
    
    if (!trade.side) {
      errors.push({ row, field: 'side', message: 'Side (long/short) is required' });
    }
    
    if (trade.position_size <= 0) {
      errors.push({ row, field: 'position_size', message: 'Position size must be greater than 0' });
    }
    
    // Check if exit date is before entry date
    const openedDate = new Date(trade.opened_at);
    const closedDate = new Date(trade.closed_at);
    if (closedDate < openedDate) {
      errors.push({ row, field: 'dates', message: 'Exit date cannot be before entry date' });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
