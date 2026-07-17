# Telegram Mentor Bot — Setup & Deploy (P0)

Implements P0 of `AI_TRADING_MENTOR_BOT_SPEC.md`: account linking, `/today` `/week`
`/stats` `/mute` `/unmute` `/help` commands, nightly + weekly digests, and
trade-closed alerts. Code lives in:

- `supabase/migrations/20260717090000_telegram_bot.sql` — 4 tables + RLS
- `supabase/functions/telegram-webhook/` — Telegram → us (public, secret-header auth)
- `supabase/functions/telegram-notifier/` — cron every 5 min (digests + alerts)
- `supabase/functions/telegram-generate-link/` — authed, creates the t.me deep link
- `supabase/functions/_shared/telegram/` — API helper, templates (en/pt), stats
- `src/components/settings/TelegramIntegration.tsx` — Settings → Notifications card

## Deviations from the spec (deliberate)

1. **No pg_net trigger / pg_cron.** The notifier polls every 5 min via the repo's
   existing `config.toml` `schedule` pattern (same as `monitor-performance-alerts`).
   Max alert latency: 5 min. Every send is deduped by a unique index on
   `(user_id, template_name, ref_id)`, so the public notifier endpoint is harmless
   to re-invoke.
2. **Templates are a TS module** (`_shared/telegram/templates.ts`), not `.md` files —
   eszip bundling of static assets needs extra config; the isolation rule still
   holds (no template strings in handler code). Locales: `en` + `pt`.
3. **Trade alerts only fire for trades dated today and inserted in the last
   15 min** — historical CSV imports stay silent; max 3 alerts per tick per user.
4. **Digests skip zero-trade days** — silence beats nagging.

## Deploy checklist (in order)

```bash
# 1. Create the bot: Telegram → @BotFather → /newbot
#    Suggested: name "The Trading Diary Bot", username e.g. @TradingDiaryBot
#    Then /setcommands with the list from the spec §8, /setprivacy → Disable.

# 2. Secrets
supabase secrets set TELEGRAM_BOT_TOKEN=<token from BotFather>
supabase secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 24)
supabase secrets set TELEGRAM_BOT_USERNAME=<bot username without @>

# 3. Migration
supabase db push

# 4. Functions
supabase functions deploy telegram-generate-link
supabase functions deploy telegram-notifier --no-verify-jwt
supabase functions deploy telegram-webhook --no-verify-jwt

# 5. Point Telegram at the webhook (use the SAME secret from step 2)
curl -F "url=https://qziawervfvptoretkjrn.supabase.co/functions/v1/telegram-webhook" \
     -F "secret_token=<TELEGRAM_WEBHOOK_SECRET value>" \
     https://api.telegram.org/bot<TOKEN>/setWebhook
```

## Verify end-to-end

1. `npm run dev` → Settings → Notifications → "Connect Telegram" → Telegram opens
2. Tap Start → bot replies with the onboarding message
3. `/today` → returns today's trades (or the empty-day message)
4. Log a trade dated today → within 5 min the bot sends a closed-trade alert
5. `supabase functions logs telegram-webhook` / `telegram-notifier` for debugging

## Environment variables (backend, Supabase secrets)

| Var | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot API token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Shared secret; webhook rejects calls without it |
| `TELEGRAM_BOT_USERNAME` | Used to build the t.me deep link (no `@`) |

## What's next (per spec)

- **P1**: rule-violation / streak / big-loss / daily-loss-lock alerts
- **P2**: free-form Q&A via LLM — the socratic mentor brain prototyped in the
  standalone Python bot (chart vision, Mark Douglas risk audit, macro context)
  gets ported into an edge function here
- **P3**: voice notes, inline queries, screenshot OCR logging, localization
