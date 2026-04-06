CREATE OR REPLACE FUNCTION public.create_default_sub_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.sub_accounts (user_id, name, description, is_active)
  VALUES (NEW.id, 'Main', 'Main account', true);
  RETURN NEW;
END;
$$;