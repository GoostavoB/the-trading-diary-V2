-- Add new columns to subscriptions table for upload credits and limits
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS upload_credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS upload_credits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_upload_limit INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS connected_accounts_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS custom_metrics_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_metrics_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_fee_analysis_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS extra_credits_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing subscriptions based on plan type
UPDATE public.subscriptions
SET 
  monthly_upload_limit = CASE 
    WHEN plan_type = 'basic' THEN 20
    WHEN plan_type = 'pro' THEN 50
    WHEN plan_type = 'elite' THEN 120
  END,
  connected_accounts_limit = CASE 
    WHEN plan_type = 'basic' THEN 1
    WHEN plan_type = 'pro' THEN 999
    WHEN plan_type = 'elite' THEN 999
  END,
  custom_metrics_limit = CASE 
    WHEN plan_type = 'basic' THEN 0
    WHEN plan_type = 'pro' THEN 3
    WHEN plan_type = 'elite' THEN 10
  END,
  has_fee_analysis_access = CASE 
    WHEN plan_type IN ('pro', 'elite') THEN true
    ELSE false
  END,
  upload_credits_balance = CASE 
    WHEN plan_type = 'basic' THEN 20
    WHEN plan_type = 'pro' THEN 50
    WHEN plan_type = 'elite' THEN 120
  END
WHERE upload_credits_balance = 0;

-- Create function to reset monthly credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    upload_credits_used_this_month = 0,
    custom_metrics_used_this_month = 0,
    upload_credits_balance = monthly_upload_limit + extra_credits_purchased,
    last_reset_date = now()
  WHERE 
    status = 'active'
    AND (
      last_reset_date IS NULL 
      OR last_reset_date < date_trunc('month', now())
    );
END;
$$;

-- Create function to deduct upload credit
CREATE OR REPLACE FUNCTION public.deduct_upload_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits_available INTEGER;
BEGIN
  -- Check available credits
  SELECT upload_credits_balance INTO v_credits_available
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';

  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN false;
  END IF;

  -- Deduct credit
  UPDATE public.subscriptions
  SET 
    upload_credits_balance = upload_credits_balance - 1,
    upload_credits_used_this_month = upload_credits_used_this_month + 1
  WHERE user_id = p_user_id
  AND status = 'active';

  RETURN true;
END;
$$;

-- Create function to add extra credits
CREATE OR REPLACE FUNCTION public.add_extra_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_type TEXT;
  v_discount DECIMAL;
BEGIN
  -- Get plan type
  SELECT plan_type INTO v_plan_type
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';

  -- Apply 50% discount for elite users
  v_discount := CASE WHEN v_plan_type = 'elite' THEN 0.5 ELSE 1.0 END;

  -- Add credits
  UPDATE public.subscriptions
  SET 
    extra_credits_purchased = extra_credits_purchased + p_credits,
    upload_credits_balance = upload_credits_balance + p_credits
  WHERE user_id = p_user_id
  AND status = 'active';

  RETURN true;
END;
$$;

-- Create function to check account limit
CREATE OR REPLACE FUNCTION public.can_add_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_accounts INTEGER;
  v_account_limit INTEGER;
BEGIN
  -- Get current account count and limit
  SELECT 
    COUNT(*) INTO v_current_accounts
  FROM public.connected_accounts
  WHERE user_id = p_user_id;

  SELECT connected_accounts_limit INTO v_account_limit
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';

  IF v_account_limit IS NULL THEN
    v_account_limit := 1; -- Default for free users
  END IF;

  RETURN v_current_accounts < v_account_limit;
END;
$$;

-- Create function to check custom metrics limit
CREATE OR REPLACE FUNCTION public.can_create_custom_metric(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT 
    custom_metrics_used_this_month,
    custom_metrics_limit
  INTO v_used, v_limit
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';

  IF v_limit IS NULL OR v_limit = 0 THEN
    RETURN false;
  END IF;

  RETURN v_used < v_limit;
END;
$$;

-- Create trigger to auto-reset credits monthly
CREATE OR REPLACE FUNCTION public.trigger_reset_monthly_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.last_reset_date < date_trunc('month', now()) THEN
    NEW.upload_credits_used_this_month := 0;
    NEW.custom_metrics_used_this_month := 0;
    NEW.upload_credits_balance := NEW.monthly_upload_limit + NEW.extra_credits_purchased;
    NEW.last_reset_date := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reset_credits_on_update
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_reset_monthly_credits();

-- Create connected_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_name TEXT NOT NULL,
  account_name TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts"
ON public.connected_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts if within limit"
ON public.connected_accounts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_add_account(auth.uid())
);

CREATE POLICY "Users can update their own accounts"
ON public.connected_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
ON public.connected_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Create custom_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.custom_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_formula TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_this_month TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.custom_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom metrics"
ON public.custom_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create custom metrics if within limit"
ON public.custom_metrics
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_create_custom_metric(auth.uid())
);

CREATE POLICY "Users can update their own custom metrics"
ON public.custom_metrics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom metrics"
ON public.custom_metrics
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to increment custom metrics counter
CREATE OR REPLACE FUNCTION public.increment_custom_metrics_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.subscriptions
  SET custom_metrics_used_this_month = custom_metrics_used_this_month + 1
  WHERE user_id = NEW.user_id
  AND status = 'active';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_metrics_on_create
AFTER INSERT ON public.custom_metrics
FOR EACH ROW
EXECUTE FUNCTION public.increment_custom_metrics_counter();