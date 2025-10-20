-- Function to increment daily alert count
CREATE OR REPLACE FUNCTION public.increment_daily_alert_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO lsr_alert_daily_stats (user_id, stat_date, alerts_triggered)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, stat_date)
  DO UPDATE SET alerts_triggered = lsr_alert_daily_stats.alerts_triggered + 1;
END;
$$;