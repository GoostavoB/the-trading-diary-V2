-- Add currency support to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add comment
COMMENT ON COLUMN public.user_settings.currency IS 'User preferred currency for display (USD, EUR, GBP, etc.)';