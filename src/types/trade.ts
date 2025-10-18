// Centralized Trade type definition matching database schema
export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  symbol_temp: string;
  side: 'long' | 'short' | null;
  side_temp: string | null;
  broker: string | null;
  leverage: number | null;
  entry_price: number | null;
  exit_price: number | null;
  position_size: number | null;
  margin: number | null;
  funding_fee: number | null;
  trading_fee: number | null;
  profit_loss: number | null;
  pnl: number | null;
  roi: number | null;
  opened_at: string | null;
  closed_at: string | null;
  trade_date: string | null;
  duration_days: number | null;
  duration_hours: number | null;
  duration_minutes: number | null;
  period_of_day: string | null;
  setup: string | null;
  emotional_tag: string | null;
  notes: string | null;
  screenshot_url: string | null;
  image_url: string | null;
  trade_hash: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedTrade {
  symbol: string;
  broker?: string;
  setup?: string;
  emotional_tag?: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  side: 'long' | 'short';
  leverage: number;
  funding_fee: number;
  trading_fee: number;
  margin: number;
  opened_at: string;
  closed_at: string;
  period_of_day: 'morning' | 'afternoon' | 'night';
  profit_loss: number;
  roi: number;
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
  notes?: string;
}
