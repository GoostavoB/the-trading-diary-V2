

## Plan: Fix "Database error saving new user" on Sign Up

### Root Cause

The auth logs show this exact error:
```
record "new" has no field "user_id" (SQLSTATE 42703)
```

The `create_default_sub_account` trigger fires on the `profiles` table after insert. It references `NEW.user_id`, but the `profiles` table uses `id` (not `user_id`) as its primary key column. This crashes the entire signup transaction.

### Fix

One database migration to replace the broken trigger function:

**Update `create_default_sub_account()` function** — change `NEW.user_id` to `NEW.id`:

```sql
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
```

### Impact
- Single function replacement, no other files or code changes needed
- Fixes signup for all new users immediately
- No risk to existing data or functionality

