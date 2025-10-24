-- Add currency preference to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS display_currency TEXT DEFAULT 'USD' CHECK (display_currency IN ('USD', 'BRL', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH')),
ADD COLUMN IF NOT EXISTS crypto_display_mode BOOLEAN DEFAULT FALSE;

-- Create currency rates cache table
CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_currency_rates_pair ON currency_rates(base_currency, target_currency);

-- Enable RLS (public read, system write)
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read rates
CREATE POLICY "Anyone can read currency rates"
  ON currency_rates FOR SELECT
  USING (true);

-- Only system can update rates (via service role)
CREATE POLICY "System can update currency rates"
  ON currency_rates FOR ALL
  USING (false)
  WITH CHECK (false);