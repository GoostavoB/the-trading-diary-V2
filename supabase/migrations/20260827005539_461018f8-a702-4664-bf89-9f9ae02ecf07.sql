REVOKE EXECUTE ON FUNCTION public.assign_active_sub_account_to_trade() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_active_sub_account_to_trade() FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_active_sub_account_to_trade() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_active_sub_account_to_trade() FROM service_role;