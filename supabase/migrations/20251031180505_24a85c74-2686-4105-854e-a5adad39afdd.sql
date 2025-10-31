-- ===========================
-- GOAL CREATION FIX
-- ===========================

-- Drop existing trigger and function for better timezone handling
DROP TRIGGER IF EXISTS validate_goal_deadline_on_insert ON public.trading_goals;
DROP TRIGGER IF EXISTS validate_goal_deadline_on_update ON public.trading_goals;
DROP FUNCTION IF EXISTS public.validate_trading_goal_deadline();

-- Recreate function with UTC date comparison (more lenient)
CREATE OR REPLACE FUNCTION public.validate_trading_goal_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Compare date parts only (not time) to allow end-of-day deadlines
  IF (NEW.deadline AT TIME ZONE 'UTC')::date < (NOW() AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'Target date cannot be in the past';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER validate_goal_deadline_on_insert
  BEFORE INSERT ON public.trading_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_trading_goal_deadline();

CREATE TRIGGER validate_goal_deadline_on_update
  BEFORE UPDATE ON public.trading_goals
  FOR EACH ROW
  WHEN (OLD.deadline IS DISTINCT FROM NEW.deadline)
  EXECUTE FUNCTION public.validate_trading_goal_deadline();

-- ===========================
-- GAMIFICATION SYSTEM FOUNDATION
-- ===========================

-- Table: user_widget_unlocks (tracks manually unlocked widgets)
CREATE TABLE IF NOT EXISTS public.user_widget_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL,
  unlock_method TEXT NOT NULL CHECK (unlock_method IN ('xp', 'subscription', 'manual', 'promotion')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_user_widget_unlocks_user_id ON public.user_widget_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_widget_unlocks_widget_id ON public.user_widget_unlocks(widget_id);

-- RLS for user_widget_unlocks
ALTER TABLE public.user_widget_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own widget unlocks"
  ON public.user_widget_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage widget unlocks"
  ON public.user_widget_unlocks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table: widget_tier_requirements (metadata catalog for 76 widgets)
CREATE TABLE IF NOT EXISTS public.widget_tier_requirements (
  widget_id TEXT PRIMARY KEY,
  tier_required INTEGER NOT NULL CHECK (tier_required >= 0 AND tier_required <= 4),
  plan_required TEXT CHECK (plan_required IN ('free', 'pro', 'elite')),
  xp_to_unlock INTEGER NOT NULL,
  tier_name TEXT NOT NULL,
  widget_title TEXT NOT NULL,
  educational_purpose TEXT,
  dopamine_trigger TEXT CHECK (dopamine_trigger IN ('micro', 'meso', 'macro')),
  is_new BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0
);

-- Insert metadata for existing 24 widgets (categorized by tier)
INSERT INTO public.widget_tier_requirements (widget_id, tier_required, plan_required, xp_to_unlock, tier_name, widget_title, educational_purpose, dopamine_trigger) VALUES
  -- Tier 0: Starter (0 XP, Free) - 6 widgets
  ('totalBalance', 0, 'free', 0, 'Starter', 'Total Balance', 'Track your overall trading capital', 'micro'),
  ('winRate', 0, 'free', 0, 'Starter', 'Win Rate', 'Monitor win/loss percentage', 'micro'),
  ('totalTrades', 0, 'free', 0, 'Starter', 'Total Trades', 'Count your trading activity', 'micro'),
  ('quickActions', 0, 'free', 0, 'Starter', 'Quick Actions', 'Access common features quickly', 'micro'),
  ('goals', 0, 'free', 0, 'Starter', 'Personal Goals', 'Set and track trading objectives', 'meso'),
  ('weekPerformance', 0, 'free', 0, 'Starter', 'Week Performance', 'Weekly profit/loss summary', 'micro'),
  
  -- Tier 1: Skilled (1000 XP, Free) - 4 widgets
  ('avgPnLPerTrade', 1, 'free', 1000, 'Skilled', 'Avg PnL Per Trade', 'Average profit per trade', 'meso'),
  ('avgPnLPerDay', 1, 'free', 1000, 'Skilled', 'Avg PnL Per Day', 'Daily profit average', 'meso'),
  ('spotWallet', 1, 'free', 1000, 'Skilled', 'Spot Wallet', 'Portfolio holdings overview', 'micro'),
  ('topMovers', 1, 'free', 1000, 'Skilled', 'Top Movers', 'Best performing assets', 'micro'),
  
  -- Tier 2: Advanced (4000 XP, Free) - 4 widgets
  ('currentROI', 2, 'free', 4000, 'Advanced', 'Current ROI', 'Return on investment metric', 'meso'),
  ('recentTransactions', 2, 'free', 4000, 'Advanced', 'Recent Transactions', 'Latest trade activity', 'micro'),
  ('leverageCalculator', 2, 'free', 4000, 'Advanced', 'Leverage Calculator', 'Calculate position sizing', 'micro'),
  ('lsrMarketData', 2, 'free', 4000, 'Advanced', 'LSR Market Data', 'Long/short ratio analysis', 'micro'),
  
  -- Tier 3: Pro (10000 XP, Pro Plan) - 4 widgets
  ('capitalGrowth', 3, 'pro', 10000, 'Pro', 'Capital Growth', 'Portfolio growth chart', 'meso'),
  ('behaviorAnalytics', 3, 'pro', 10000, 'Pro', 'Behavior Analytics', 'Trading behavior insights', 'macro'),
  ('costEfficiency', 3, 'pro', 10000, 'Pro', 'Cost Efficiency', 'Fee analysis and optimization', 'meso'),
  ('performanceHighlights', 3, 'pro', 10000, 'Pro', 'Performance Highlights', 'Key performance metrics', 'macro'),
  
  -- Tier 4: Elite (25000 XP, Elite Plan) - 6 widgets
  ('tradingQuality', 4, 'elite', 25000, 'Elite', 'Trading Quality', 'Advanced quality metrics', 'macro'),
  ('heatmap', 4, 'elite', 25000, 'Elite', 'Trading Heatmap', 'Time-based performance visualization', 'macro'),
  ('openInterestChart', 4, 'elite', 25000, 'Elite', 'Open Interest', 'Market open interest data', 'meso'),
  ('weeklyPnLChart', 4, 'elite', 25000, 'Elite', 'Weekly PnL Chart', 'Weekly profit/loss trends', 'meso'),
  ('aiInsights', 4, 'elite', 25000, 'Elite', 'AI Insights', 'AI-powered trading recommendations', 'macro'),
  ('absoluteProfit', 4, 'elite', 25000, 'Elite', 'Absolute Profit', 'Pure trading profit metric', 'macro')
ON CONFLICT (widget_id) DO NOTHING;

-- Function to setup elite test account
CREATE OR REPLACE FUNCTION public.setup_elite_test_account(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Set XP to Elite tier (25,000 XP)
  INSERT INTO public.user_xp_levels (user_id, total_xp_earned, current_level, current_xp)
  VALUES (target_user_id, 25000, 50, 25000)
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp_earned = 25000, current_level = 50, current_xp = 25000;

  -- Unlock ALL widgets manually
  INSERT INTO public.user_widget_unlocks (user_id, widget_id, unlock_method)
  SELECT target_user_id, widget_id, 'manual'
  FROM public.widget_tier_requirements
  ON CONFLICT (user_id, widget_id) DO NOTHING;

  RAISE NOTICE 'Elite test account setup complete for %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute for test account
SELECT public.setup_elite_test_account('gustavo.belfiore@gmail.com');