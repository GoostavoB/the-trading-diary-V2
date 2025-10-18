-- Create trading_goals table
CREATE TABLE IF NOT EXISTS public.trading_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('pnl', 'win_rate', 'trades', 'roi')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own goals"
  ON public.trading_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.trading_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.trading_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.trading_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_trading_goals_updated_at
  BEFORE UPDATE ON public.trading_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.trading_goals IS 'User trading goals and targets';
COMMENT ON COLUMN public.trading_goals.goal_type IS 'Type of goal: pnl, win_rate, trades, or roi';
COMMENT ON COLUMN public.trading_goals.period IS 'Time period: daily, weekly, monthly, yearly, or all_time';
COMMENT ON COLUMN public.trading_goals.current_value IS 'Current progress towards goal';