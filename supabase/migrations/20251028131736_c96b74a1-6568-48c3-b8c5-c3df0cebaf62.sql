-- Add daily_upload_count to user_xp_tiers
ALTER TABLE user_xp_tiers
ADD COLUMN IF NOT EXISTS daily_upload_count INTEGER DEFAULT 0;

-- Update reset function to also reset upload count
CREATE OR REPLACE FUNCTION public.reset_daily_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_xp_tiers
  SET 
    daily_xp_earned = 0,
    daily_upload_count = 0,
    last_reset_at = NOW()
  WHERE last_reset_at < DATE_TRUNC('day', NOW());
END;
$$;
