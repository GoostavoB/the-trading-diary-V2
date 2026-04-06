

## Plan: Clean Rebuild of Sign-Up Database Flow

### Problem
There are 4 patched migrations on top of each other, two competing triggers (`handle_new_user` + `create_default_sub_account`), and 15 orphaned profiles with only 1 subscription. The EXCEPTION handler silently swallows errors, creating auth users with no profile data.

### Root Issues
1. **Two triggers compete**: `handle_new_user` creates a sub_account, but the `create_default_sub_account` trigger on profiles ALSO fires and creates another one — causing duplicates
2. **EXCEPTION swallows failures**: errors are logged but the function returns NEW, so auth.users gets created but all public data (profile, subscription, settings) is silently rolled back
3. **Orphaned data**: 15 profiles, only 1 subscription, 15 sub_accounts — leftover from failed attempts

### Single Migration — What It Does

1. **Drop the redundant trigger** `on_profile_created_create_sub_account` — handle_new_user will manage everything
2. **Replace `handle_new_user()`** with a clean version:
   - Profile insert (no trigger interference)
   - Sub-account insert (with `is_default = true`)
   - Subscription insert (`plan_type = 'free'`, 5 credits)
   - XP initialization
   - Settings + customization linked to sub_account_id
   - **NO exception swallowing** — if something fails, the error surfaces clearly instead of creating ghost accounts
3. **Clean orphaned data**: delete profiles/sub_accounts/settings that have no matching subscription (ghost records from failed signups)

### Frontend
- `AuthContext.tsx` — no changes needed, invite code logic (HORISTIC/TEO) is already correct

### Files Changed
- 1 new migration SQL file (replaces all 4 previous patches)
- No frontend changes

