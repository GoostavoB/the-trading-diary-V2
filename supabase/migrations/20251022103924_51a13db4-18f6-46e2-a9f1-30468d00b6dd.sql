-- Phase 1: Portfolio Tracking Database Schema

-- 1. Assets registry with CoinGecko mapping
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 8,
  coingecko_id TEXT,
  primary_category TEXT,
  categories_json JSONB DEFAULT '[]'::jsonb,
  color_hex TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  coingecko_category_id TEXT,
  color_hex TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Portfolio settings per user
CREATE TABLE IF NOT EXISTS public.portfolio_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  cost_method TEXT NOT NULL DEFAULT 'FIFO' CHECK (cost_method IN ('FIFO', 'Average')),
  blur_sensitive BOOLEAN NOT NULL DEFAULT false,
  category_split_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Position lots for FIFO/Average tracking
CREATE TABLE IF NOT EXISTS public.position_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  quantity_remaining NUMERIC NOT NULL CHECK (quantity_remaining >= 0),
  cost_basis_per_unit NUMERIC NOT NULL,
  acquisition_date TIMESTAMPTZ NOT NULL,
  acquisition_tx_id UUID,
  lot_method TEXT NOT NULL CHECK (lot_method IN ('FIFO', 'Average')),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Realized P&L records
CREATE TABLE IF NOT EXISTS public.realized_pnl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  transaction_id UUID,
  proceeds_base NUMERIC NOT NULL,
  cost_disposed_base NUMERIC NOT NULL,
  fees_base NUMERIC NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL,
  realized_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Price history cache
CREATE TABLE IF NOT EXISTS public.price_history (
  symbol TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  price NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'coingecko',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, timestamp)
);

-- 7. Extend spot_transactions with additional fields
ALTER TABLE public.spot_transactions 
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_currency TEXT,
  ADD COLUMN IF NOT EXISTS fx_rate NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS cost_basis_method TEXT,
  ADD COLUMN IF NOT EXISTS is_realized_event BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add new transaction types
ALTER TABLE public.spot_transactions 
  DROP CONSTRAINT IF EXISTS spot_transactions_transaction_type_check;
  
ALTER TABLE public.spot_transactions 
  ADD CONSTRAINT spot_transactions_transaction_type_check 
  CHECK (transaction_type IN ('buy', 'sell', 'transfer_in', 'transfer_out', 'deposit', 'withdrawal', 'airdrop', 'fork', 'split', 'staking_reward', 'funding'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_position_lots_user_asset ON public.position_lots(user_id, asset_symbol, acquisition_date);
CREATE INDEX IF NOT EXISTS idx_realized_pnl_user_date ON public.realized_pnl(user_id, realized_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_time ON public.price_history(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_assets_coingecko ON public.assets(coingecko_id);
CREATE INDEX IF NOT EXISTS idx_spot_transactions_date ON public.spot_transactions(user_id, transaction_date DESC);

-- RLS Policies for new tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realized_pnl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Assets and categories are publicly readable
CREATE POLICY "Anyone can view assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Users can manage their own portfolio settings
CREATE POLICY "Users can view own settings" ON public.portfolio_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.portfolio_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.portfolio_settings FOR UPDATE USING (auth.uid() = user_id);

-- Users can manage their own position lots
CREATE POLICY "Users can view own lots" ON public.position_lots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lots" ON public.position_lots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lots" ON public.position_lots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lots" ON public.position_lots FOR DELETE USING (auth.uid() = user_id);

-- Users can view their own realized P&L
CREATE POLICY "Users can view own realized pnl" ON public.realized_pnl FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own realized pnl" ON public.realized_pnl FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Price history is publicly readable
CREATE POLICY "Anyone can view price history" ON public.price_history FOR SELECT USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_settings_updated_at BEFORE UPDATE ON public.portfolio_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_position_lots_updated_at BEFORE UPDATE ON public.position_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();