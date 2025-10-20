-- Create spot_holdings table to track user crypto assets
CREATE TABLE public.spot_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC,
  purchase_date TIMESTAMP WITH TIME ZONE,
  exchange TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spot_holdings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own holdings"
ON public.spot_holdings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
ON public.spot_holdings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
ON public.spot_holdings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
ON public.spot_holdings
FOR DELETE
USING (auth.uid() = user_id);

-- Create spot_transactions table for transaction history
CREATE TABLE public.spot_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  holding_id UUID REFERENCES public.spot_holdings(id) ON DELETE CASCADE,
  token_symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer_in', 'transfer_out')),
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  exchange TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spot_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own transactions"
ON public.spot_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.spot_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.spot_transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.spot_transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create wallet_snapshots table for historical tracking
CREATE TABLE public.wallet_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_value NUMERIC NOT NULL,
  snapshot_data JSONB NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own snapshots"
ON public.wallet_snapshots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
ON public.wallet_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_spot_holdings_user_id ON public.spot_holdings(user_id);
CREATE INDEX idx_spot_transactions_user_id ON public.spot_transactions(user_id);
CREATE INDEX idx_spot_transactions_holding_id ON public.spot_transactions(holding_id);
CREATE INDEX idx_wallet_snapshots_user_id_date ON public.wallet_snapshots(user_id, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_spot_holdings_updated_at
BEFORE UPDATE ON public.spot_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();