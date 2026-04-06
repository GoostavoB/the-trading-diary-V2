
Issue confirmed:

- The previous fix addressed `create_default_sub_account()`, but signup is still failing in a different step.
- The current backend error is now: `column "upload_credits_total" of relation "subscriptions" does not exist`.
- Root cause: `public.handle_new_user()` is still inserting into old subscription columns (`upload_credits_total`, `upload_credits_used`) that do not exist in the live `subscriptions` table.
- I verified the live `subscriptions` schema now uses `upload_credits_balance`, `upload_credits_used_this_month`, `monthly_upload_limit`, `extra_credits_purchased`, `last_reset_date`, etc.
- I also found a secondary mismatch in the frontend: the signup UI collects marketing + terms/privacy consent, but `AuthContext.signUp()` only sends `full_name` and `country`, so those values are not being persisted.

Plan:

1. Replace `public.handle_new_user()` with a schema-aligned version
   - Keep profile creation.
   - Keep initialization of `user_settings` and `user_roles`.
   - Rewrite the subscription insert to use current columns:
     - `upload_credits_balance`
     - `upload_credits_used_this_month`
     - `monthly_upload_limit`
     - `extra_credits_purchased`
     - `current_period_start`
     - `current_period_end`
     - `last_reset_date`
   - Use safe defaults for a new free user.
   - Add `ON CONFLICT DO NOTHING` where appropriate for helper tables to avoid duplicate setup failures.

2. Align the signup metadata in `src/contexts/AuthContext.tsx`
   - Update `signUp()` so it also sends:
     - `marketing_consent`
     - `accepted_terms_at`
     - `accepted_privacy_at`
     - `provider: 'email'`
   - This makes the client match what the backend function is already prepared to store.

3. Update the signup call in `src/pages/Auth.tsx`
   - Pass the consent timestamps from the two required checkboxes.
   - Keep the existing UI validation and form structure unchanged.

4. Verify one schema compatibility point in the same migration
   - The frontend clearly treats new users as `free`.
   - If the database still has any old `plan_type` restriction left over from earlier migrations, widen it in the same migration so signup does not fail on the next insert.

Files / objects to update:
- `supabase/migrations/...sql` — replace `public.handle_new_user()`
- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`

Expected result:
- Signup will stop failing with “Database error saving new user”.
- New users will get their profile, settings, role, subscription, and default sub-account correctly.
- Consent fields already collected by the form will finally be saved too.
- This is the smallest safe fix focused only on the broken signup path.
