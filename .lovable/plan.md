

## Fix: Invite Code Rewards Not Applying to Subscriptions

### Problem
The invite code "HORISTIC" partially worked — it updated `profiles.subscription_tier` to `'pro'` successfully, but the `subscriptions` table still has `free` / 5 credits. The `setTimeout(2000)` approach is unreliable because the database trigger may not have created the subscription row yet when the update runs.

### Root Cause
The `setTimeout` fires once after 2 seconds. If the subscription row doesn't exist yet, the `UPDATE` matches zero rows and silently does nothing. There's no retry logic.

### Fix — Two Parts

**1. Fix the code: Replace setTimeout with a retry loop**
- In `AuthContext.tsx`, replace the fragile `setTimeout` with a polling function that:
  - Checks if the subscription row exists (up to 5 attempts, 1.5s apart)
  - Only runs the UPDATE once the row is found
  - Logs a warning if it gives up after all retries

**2. Fix Gustavo's account now: One-time data correction**
- Run a migration to update the existing subscription for user `48bfc4dd-a375-4d03-a05d-6daefb476a21`:
  - `plan_type` → `'pro'`
  - `upload_credits_balance` → `50`
  - `monthly_upload_limit` → `50`

### Files Changed
- `src/contexts/AuthContext.tsx` — replace setTimeout with retry loop
- 1 new migration SQL — fix existing account data

### Technical Detail
```text
Current (broken):
  setTimeout(() => {
    UPDATE subscriptions SET credits=50 WHERE user_id=X
    // Row might not exist yet → 0 rows updated → silent failure
  }, 2000)

Fixed:
  for (attempt 1..5) {
    SELECT count(*) FROM subscriptions WHERE user_id=X
    if found → UPDATE → break
    else → wait 1.5s
  }
```

