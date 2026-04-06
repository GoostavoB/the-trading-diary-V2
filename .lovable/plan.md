
The reason it feels circular is that there were multiple signup failures stacked on top of each other.

What is actually happening:
1. First blocker was the broken default sub-account setup
   - It used `NEW.user_id` where the record only had `NEW.id`.
   - That was a real bug and fixing it was necessary.

2. After that, a second blocker appeared inside `handle_new_user()`
   - It was writing to old subscription columns like `upload_credits_total`.
   - That was also real and got exposed only after the first bug was removed.

3. The current blocker is different again
   - The auth logs now show:
     `new row for relation "subscriptions" violates check constraint "subscriptions_plan_type_check"`
   - I verified why:
     - `handle_new_user()` now inserts `plan_type = 'free'`
     - but the `subscriptions` table still only allows:
       `('basic', 'pro', 'elite')`
   - So signup still fails at the database layer before the user is created successfully.

Why we kept “fixing” but it still failed:
- We were uncovering the next failing step each time.
- The signup flow is one transaction.
- If any trigger/function/constraint fails, the whole signup aborts and the UI only shows the same generic message:
  `Database error saving new user`.

The precise problem now:
- Backend function and database schema are still out of sync.
- Current mismatch:
  - Function inserts `free`
  - Constraint only accepts `basic`, `pro`, `elite`

What is not the main blocker right now:
- The frontend consent metadata issue is secondary.
- It should be cleaned up, but it is not what causes the current 500 error.
- The signup is failing before that matters.

Smallest safe fix:
1. Update the subscription plan rule so it matches the app’s real tiers
   - allow `free` in the `subscriptions.plan_type` constraint
   - optionally also align on whether the product uses `starter` or `basic` long-term, because the codebase currently mixes both

2. Keep `handle_new_user()` aligned with that rule
   - if free users are intended, insert `plan_type = 'free'`
   - keep the new credit columns already fixed

3. Leave the auth UI mostly untouched
   - only make follow-up frontend cleanup after signup is stable

Recommended implementation scope:
- One database migration focused on schema alignment:
  - drop/recreate the `subscriptions_plan_type_check` constraint to include `free`
  - verify no other subscription checks still assume only paid plans
- Optional follow-up cleanup:
  - standardize plan naming across app code (`free/basic/pro/elite` vs `free/starter/pro/elite`)

Expected result after that fix:
- Signup should stop failing with the generic database error
- New users should be created successfully
- The current error loop should end because the remaining blocker is now clearly identified

Files / objects involved:
- `supabase/migrations/20251023103703_5c3d1f17-9205-452b-a46e-bd84e066380e.sql` — original restrictive check
- `supabase/migrations/20260406105846_bd5483bb-39c3-4308-93c4-f66e7f292c80.sql` — now inserts `free`
- `src/contexts/AuthContext.tsx` — secondary metadata cleanup, not the current root cause

So in one sentence:
We are not looping on the same bug — signup has been failing on a chain of separate database mismatches, and the current real blocker is the `subscriptions.plan_type` constraint rejecting `'free'`.
