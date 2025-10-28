-- Add XP tracking columns to psychology_logs
ALTER TABLE public.psychology_logs
ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN DEFAULT false;

-- Add XP tracking columns to trading_journal
ALTER TABLE public.trading_journal
ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN DEFAULT false;

-- Add daily counters to user_xp_tiers
ALTER TABLE public.user_xp_tiers
ADD COLUMN IF NOT EXISTS psychology_logs_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS journal_entries_today INTEGER DEFAULT 0;

-- Update the reset_daily_xp_caps function to include psychology counters
CREATE OR REPLACE FUNCTION public.reset_daily_xp_caps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_xp_tiers
  SET 
    daily_xp_earned = 0,
    last_daily_reset = CURRENT_DATE,
    psychology_logs_today = 0,
    journal_entries_today = 0
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$;

-- Create index for faster XP reward queries
CREATE INDEX IF NOT EXISTS idx_psychology_logs_xp_awarded 
ON public.psychology_logs(user_id, xp_awarded, created_at DESC) 
WHERE xp_awarded = false;

CREATE INDEX IF NOT EXISTS idx_trading_journal_xp_awarded 
ON public.trading_journal(user_id, xp_awarded, created_at DESC) 
WHERE xp_awarded = false;