-- Add server-side validation to ensure deadline is not in the past
-- This trigger enforces that the deadline must be at least the current date (UTC)

CREATE OR REPLACE FUNCTION public.validate_trading_goal_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if deadline is in the past (comparing dates only, ignoring time)
  IF NEW.deadline::date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Target date cannot be in the past. Please select today or a future date.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
CREATE TRIGGER validate_goal_deadline_on_insert
  BEFORE INSERT ON public.trading_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_trading_goal_deadline();

-- Create trigger for UPDATE operations
CREATE TRIGGER validate_goal_deadline_on_update
  BEFORE UPDATE ON public.trading_goals
  FOR EACH ROW
  WHEN (OLD.deadline IS DISTINCT FROM NEW.deadline)
  EXECUTE FUNCTION public.validate_trading_goal_deadline();