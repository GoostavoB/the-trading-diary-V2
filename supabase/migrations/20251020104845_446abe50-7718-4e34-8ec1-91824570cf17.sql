-- Table 1: LSR Alerts - User alert configurations
CREATE TABLE public.lsr_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL DEFAULT 'BTCUSDT',
  alert_type text NOT NULL CHECK (alert_type IN ('rapid_change', 'cross_below_1', 'cross_above_1')),
  is_enabled boolean NOT NULL DEFAULT true,
  threshold_percentage numeric DEFAULT 5.0,
  direction text DEFAULT 'both' CHECK (direction IN ('up', 'down', 'both')),
  last_triggered_at timestamptz,
  cooldown_minutes integer DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol, alert_type)
);

-- Enable RLS
ALTER TABLE public.lsr_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alerts" ON public.lsr_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts" ON public.lsr_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.lsr_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.lsr_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_lsr_alerts_user_enabled ON public.lsr_alerts(user_id, is_enabled);

-- Table 2: LSR Alert History - Alert trigger log
CREATE TABLE public.lsr_alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id uuid NOT NULL REFERENCES public.lsr_alerts(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  alert_type text NOT NULL,
  ratio_value numeric NOT NULL,
  previous_value numeric,
  change_percentage numeric,
  direction text CHECK (direction IN ('up', 'down')),
  long_account numeric,
  short_account numeric,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false,
  notification_sent_at timestamptz,
  clicked boolean NOT NULL DEFAULT false,
  clicked_at timestamptz
);

-- Enable RLS
ALTER TABLE public.lsr_alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alert history" ON public.lsr_alert_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alert history" ON public.lsr_alert_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lsr_history_user_notified ON public.lsr_alert_history(user_id, notified);
CREATE INDEX idx_lsr_history_triggered_at ON public.lsr_alert_history(triggered_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lsr_alert_history;

-- Table 3: LSR Latest Values - Current market state
CREATE TABLE public.lsr_latest_values (
  symbol text PRIMARY KEY,
  ratio_value numeric NOT NULL,
  long_account numeric NOT NULL,
  short_account numeric NOT NULL,
  binance_ratio numeric,
  bybit_ratio numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lsr_latest_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view latest values" ON public.lsr_latest_values
  FOR SELECT TO authenticated USING (true);

-- Function to update latest values
CREATE OR REPLACE FUNCTION public.update_lsr_latest_value(
  p_symbol text,
  p_ratio_value numeric,
  p_long_account numeric,
  p_short_account numeric,
  p_binance_ratio numeric DEFAULT NULL,
  p_bybit_ratio numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO lsr_latest_values (symbol, ratio_value, long_account, short_account, binance_ratio, bybit_ratio, updated_at)
  VALUES (p_symbol, p_ratio_value, p_long_account, p_short_account, p_binance_ratio, p_bybit_ratio, now())
  ON CONFLICT (symbol)
  DO UPDATE SET
    ratio_value = EXCLUDED.ratio_value,
    long_account = EXCLUDED.long_account,
    short_account = EXCLUDED.short_account,
    binance_ratio = EXCLUDED.binance_ratio,
    bybit_ratio = EXCLUDED.bybit_ratio,
    updated_at = now();
END;
$$;

-- Table 4: LSR Alert Daily Stats - Rate limiting & analytics
CREATE TABLE public.lsr_alert_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  alerts_triggered integer NOT NULL DEFAULT 0,
  alerts_dismissed integer NOT NULL DEFAULT 0,
  alerts_clicked integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, stat_date)
);

-- Enable RLS
ALTER TABLE public.lsr_alert_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily stats" ON public.lsr_alert_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON public.lsr_alert_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily cap function
CREATE OR REPLACE FUNCTION public.check_daily_alert_cap(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COALESCE(alerts_triggered, 0) INTO v_count
  FROM lsr_alert_daily_stats
  WHERE user_id = p_user_id AND stat_date = CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0) < 20;
END;
$$;