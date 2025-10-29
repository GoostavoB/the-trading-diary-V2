-- Drop the incorrect trigger that references updated_at instead of last_updated_at
DROP TRIGGER IF EXISTS update_daily_activity_timestamp ON public.user_daily_activity;

-- Create a dedicated function for updating last_updated_at
CREATE OR REPLACE FUNCTION public.update_last_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger with the correct function
CREATE TRIGGER update_daily_activity_timestamp
BEFORE UPDATE ON public.user_daily_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_last_updated_at_column();

-- Backfill any NULL last_updated_at values
UPDATE public.user_daily_activity 
SET last_updated_at = now() 
WHERE last_updated_at IS NULL;