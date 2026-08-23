-- Monthly Goal widget: user-defined monthly profit target (USD).
-- Column was already applied live via the Supabase SQL editor on 2026-08-22;
-- this migration exists for version-control parity and is safe to re-run.
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS monthly_goal_target numeric;

COMMENT ON COLUMN public.user_settings.monthly_goal_target IS 'User-defined monthly profit goal in USD, used by the Monthly Goal widget. Resets progress each calendar month but the target itself persists until changed.';
