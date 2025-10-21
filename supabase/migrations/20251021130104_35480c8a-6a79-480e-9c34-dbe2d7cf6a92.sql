-- Create trading accounts table for multi-account management
CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  broker TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'live', -- live, demo, paper
  currency TEXT NOT NULL DEFAULT 'USD',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  account_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance alerts table
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- win_rate, roi, daily_loss, drawdown, profit_target
  threshold_value NUMERIC NOT NULL,
  comparison_operator TEXT NOT NULL, -- above, below, equals
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert history table
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  triggered_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  message TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  clicked BOOLEAN NOT NULL DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add account_id to trades table (nullable for backward compatibility)
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.trading_accounts(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_active ON public.trading_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_user_id ON public.performance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON public.alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON public.alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(account_id) WHERE account_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trading_accounts
CREATE POLICY "Users can view own accounts"
  ON public.trading_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON public.trading_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.trading_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.trading_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for performance_alerts
CREATE POLICY "Users can view own alerts"
  ON public.performance_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.performance_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.performance_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.performance_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for alert_history
CREATE POLICY "Users can view own alert history"
  ON public.alert_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert history"
  ON public.alert_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert history"
  ON public.alert_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trading_accounts_updated_at
  BEFORE UPDATE ON public.trading_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_alerts_updated_at
  BEFORE UPDATE ON public.performance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();