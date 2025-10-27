-- Add daily visit streak tracking to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS current_visit_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_visit_streak INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.last_visit_date IS 'Last date the user visited the dashboard';
COMMENT ON COLUMN public.user_settings.current_visit_streak IS 'Current consecutive daily visit streak';
COMMENT ON COLUMN public.user_settings.longest_visit_streak IS 'Longest consecutive daily visit streak achieved';