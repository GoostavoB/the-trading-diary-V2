-- Phase 1: Add tables and settings for Error Reflection v2, Pre-flight v2, Risk Calculator v2, and Daily Loss Lock

-- User Errors table for Error Reflection v2
CREATE TABLE IF NOT EXISTS public.user_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired')),
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  CONSTRAINT user_errors_user_id_created_at_key UNIQUE (user_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_user_errors_user_id ON public.user_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_errors_status ON public.user_errors(status);
CREATE INDEX IF NOT EXISTS idx_user_errors_expires_at ON public.user_errors(expires_at);

ALTER TABLE public.user_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own errors"
ON public.user_errors
FOR ALL
USING (auth.uid() = user_id);

-- Trading Sessions table for Pre-flight v2
CREATE TABLE IF NOT EXISTS public.trading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  preflight_completed BOOLEAN NOT NULL DEFAULT false,
  preflight_bypassed BOOLEAN NOT NULL DEFAULT false,
  spx_trend TEXT,
  lsr_value NUMERIC,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pnl_day NUMERIC DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  notes TEXT,
  CONSTRAINT trading_sessions_user_date_key UNIQUE (user_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON public.trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_date ON public.trading_sessions(session_date);

ALTER TABLE public.trading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
ON public.trading_sessions
FOR ALL
USING (auth.uid() = user_id);

-- Daily Loss Events table for Daily Loss Lock
CREATE TABLE IF NOT EXISTS public.daily_loss_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  loss_value NUMERIC NOT NULL,
  limit_value NUMERIC NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('triggered', 'overridden', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  override_expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_daily_loss_events_user_id ON public.daily_loss_events(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_loss_events_date ON public.daily_loss_events(event_date);

ALTER TABLE public.daily_loss_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loss events"
ON public.daily_loss_events
FOR ALL
USING (auth.uid() = user_id);

-- Add new columns to user_settings for all Phase 1 features
-- Error Reflection v2 settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS error_daily_reminder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_pnl_prompt_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_pnl_threshold NUMERIC DEFAULT 50,
ADD COLUMN IF NOT EXISTS error_pnl_threshold_unit TEXT DEFAULT 'abs' CHECK (error_pnl_threshold_unit IN ('abs', 'pct')),
ADD COLUMN IF NOT EXISTS error_clean_sheet BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_reminder_paused_until TIMESTAMP WITH TIME ZONE;

-- Pre-flight v2 settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS preflight_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preflight_calendar_url TEXT;

-- Risk Calculator v2 settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS risk_profile TEXT DEFAULT 'medium' CHECK (risk_profile IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS risk_scalp_pct NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS risk_day_pct NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS risk_swing_pct NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS risk_position_pct NUMERIC DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS risk_daily_loss_pct NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS risk_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS risk_max_drawdown NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS risk_worst_streak INTEGER DEFAULT 5;

-- Daily Loss Lock settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS daily_loss_lock_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_loss_lock_last_override TIMESTAMP WITH TIME ZONE;

COMMENT ON TABLE public.user_errors IS 'Stores user trading errors for reflection and learning';
COMMENT ON TABLE public.trading_sessions IS 'Tracks daily trading sessions and pre-flight completion';
COMMENT ON TABLE public.daily_loss_events IS 'Logs daily loss limit triggers and overrides';