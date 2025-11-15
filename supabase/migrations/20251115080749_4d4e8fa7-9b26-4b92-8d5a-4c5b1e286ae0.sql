-- Add trading days calculation mode setting
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS trading_days_calculation_mode text DEFAULT 'calendar' CHECK (trading_days_calculation_mode IN ('calendar', 'unique'));

COMMENT ON COLUMN public.user_settings.trading_days_calculation_mode IS 'Determines how trading days are calculated: calendar (from first open to last close) or unique (only days with trades)';