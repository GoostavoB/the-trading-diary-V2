-- Create sub_accounts table for Pro and Elite users
CREATE TABLE public.sub_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'User',
  color TEXT DEFAULT '#8B5CF6',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_sub_accounts_user_id ON public.sub_accounts(user_id);
CREATE INDEX idx_sub_accounts_active ON public.sub_accounts(user_id, is_active);

-- Enable RLS
ALTER TABLE public.sub_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sub accounts"
  ON public.sub_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sub accounts"
  ON public.sub_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sub accounts"
  ON public.sub_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sub accounts"
  ON public.sub_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_sub_accounts_updated_at
  BEFORE UPDATE ON public.sub_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one active sub account per user
CREATE OR REPLACE FUNCTION public.ensure_single_active_sub_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.sub_accounts
    SET is_active = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to ensure only one active sub account
CREATE TRIGGER trigger_single_active_sub_account
  BEFORE INSERT OR UPDATE ON public.sub_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_sub_account();