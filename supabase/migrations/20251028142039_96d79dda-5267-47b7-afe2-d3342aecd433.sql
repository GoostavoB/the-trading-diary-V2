-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Update the daily reset function to handle both XP and uploads
CREATE OR REPLACE FUNCTION public.reset_daily_xp_caps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reset daily XP counters
  UPDATE public.user_xp_tiers
  SET 
    daily_xp_earned = 0,
    daily_upload_count = 0,
    last_reset_at = NOW()
  WHERE last_reset_at < DATE_TRUNC('day', NOW());
  
  -- Reset daily upload counters in subscriptions (if applicable)
  UPDATE public.subscriptions
  SET 
    upload_credits_used_this_month = CASE 
      WHEN last_reset_date < DATE_TRUNC('month', NOW()) 
      THEN 0 
      ELSE upload_credits_used_this_month 
    END,
    upload_credits_balance = CASE
      WHEN last_reset_date < DATE_TRUNC('month', NOW())
      THEN monthly_upload_limit + extra_credits_purchased
      ELSE upload_credits_balance
    END,
    last_reset_date = CASE
      WHEN last_reset_date < DATE_TRUNC('month', NOW())
      THEN NOW()
      ELSE last_reset_date
    END
  WHERE status = 'active';
  
  RAISE NOTICE 'Daily reset completed at %', NOW();
END;
$$;

-- Schedule cron job to run daily at midnight UTC
SELECT cron.schedule(
  'reset-daily-xp-caps',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT public.reset_daily_xp_caps();
  $$
);