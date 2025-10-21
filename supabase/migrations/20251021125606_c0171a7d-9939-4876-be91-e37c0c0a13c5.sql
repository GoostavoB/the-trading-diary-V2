-- Create trading_plans table for structured trading strategies
CREATE TABLE public.trading_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  markets TEXT[] DEFAULT ARRAY[]::TEXT[],
  timeframes TEXT[] DEFAULT ARRAY[]::TEXT[],
  entry_rules TEXT,
  exit_rules TEXT,
  risk_management TEXT,
  position_sizing TEXT,
  trading_schedule TEXT,
  review_process TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.trading_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own trading plans" 
ON public.trading_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trading plans" 
ON public.trading_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading plans" 
ON public.trading_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading plans" 
ON public.trading_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_trading_plans_user_id ON public.trading_plans(user_id);
CREATE INDEX idx_trading_plans_is_active ON public.trading_plans(is_active) WHERE is_active = true;

-- Create trigger to update updated_at
CREATE TRIGGER update_trading_plans_updated_at
BEFORE UPDATE ON public.trading_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();