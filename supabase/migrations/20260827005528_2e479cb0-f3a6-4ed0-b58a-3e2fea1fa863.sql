CREATE OR REPLACE FUNCTION public.assign_active_sub_account_to_trade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sub_account_id IS NULL THEN
    SELECT sa.id
      INTO NEW.sub_account_id
      FROM public.sub_accounts AS sa
     WHERE sa.user_id = NEW.user_id
       AND sa.is_active = true
     ORDER BY sa.created_at ASC
     LIMIT 1;
  END IF;

  IF NEW.sub_account_id IS NULL THEN
    RAISE EXCEPTION 'No active sub-account exists for trade owner';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.sub_accounts AS sa
     WHERE sa.id = NEW.sub_account_id
       AND sa.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Trade sub-account does not belong to trade owner';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_active_sub_account_to_trade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_active_sub_account_to_trade() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_active_sub_account_to_trade() TO service_role;

DROP TRIGGER IF EXISTS assign_active_sub_account_to_trade_trigger ON public.trades;
CREATE TRIGGER assign_active_sub_account_to_trade_trigger
BEFORE INSERT OR UPDATE OF user_id, sub_account_id ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.assign_active_sub_account_to_trade();