-- Add trade_hash column and unique index for duplicate prevention
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS trade_hash TEXT;

-- Create unique index to prevent duplicate trades
CREATE UNIQUE INDEX IF NOT EXISTS idx_trades_user_hash 
ON public.trades (user_id, trade_hash) 
WHERE trade_hash IS NOT NULL AND deleted_at IS NULL;

-- Add duplicate review settings to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS duplicate_review_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS duplicate_review_last_shown TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duplicate_review_seen BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.trades.trade_hash IS 'Normalized hash of trade key fields for duplicate detection';
COMMENT ON COLUMN public.user_settings.duplicate_review_enabled IS 'Whether to show duplicate review dialog';
COMMENT ON COLUMN public.user_settings.duplicate_review_last_shown IS 'Last time duplicate dialog was shown';
COMMENT ON COLUMN public.user_settings.duplicate_review_seen IS 'Whether user has seen and dismissed the duplicate dialog';