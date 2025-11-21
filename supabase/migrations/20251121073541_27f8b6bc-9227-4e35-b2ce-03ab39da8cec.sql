-- Create default "Main" sub-account for all existing users who don't have one
INSERT INTO sub_accounts (user_id, name, description, is_active)
SELECT id, 'Main', 'Main account', true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM sub_accounts WHERE sub_accounts.user_id = auth.users.id
);

-- Create function to auto-create Main sub-account for new users
CREATE OR REPLACE FUNCTION create_default_sub_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sub_accounts (user_id, name, description, is_active)
  VALUES (NEW.user_id, 'Main', 'Main account', true);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create Main sub-account when profile is created
DROP TRIGGER IF EXISTS on_profile_created_create_sub_account ON public.profiles;
CREATE TRIGGER on_profile_created_create_sub_account
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_sub_account();