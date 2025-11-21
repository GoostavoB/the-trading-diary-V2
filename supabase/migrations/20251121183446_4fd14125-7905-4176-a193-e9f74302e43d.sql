-- Add is_default column to sub_accounts
ALTER TABLE public.sub_accounts 
ADD COLUMN is_default BOOLEAN DEFAULT false;

-- Set the first created account (Main) as default for each user
UPDATE public.sub_accounts sa
SET is_default = true
WHERE sa.id IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.sub_accounts
  ORDER BY user_id, created_at ASC
);

-- Create function to ensure only one default per user
CREATE OR REPLACE FUNCTION ensure_single_default_sub_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.sub_accounts
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER ensure_single_default_sub_account_trigger
BEFORE INSERT OR UPDATE ON public.sub_accounts
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_sub_account();

-- Comment for documentation
COMMENT ON COLUMN public.sub_accounts.is_default IS 'Marks the default sub-account that loads on login';