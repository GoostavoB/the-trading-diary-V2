-- Create RPC function to increment psychology logs counter
CREATE OR REPLACE FUNCTION public.increment_psychology_logs_counter(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_xp_tiers
  SET psychology_logs_today = psychology_logs_today + 1
  WHERE user_id = p_user_id;
END;
$$;

-- Create RPC function to increment journal entries counter
CREATE OR REPLACE FUNCTION public.increment_journal_entries_counter(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_xp_tiers
  SET journal_entries_today = journal_entries_today + 1
  WHERE user_id = p_user_id;
END;
$$;