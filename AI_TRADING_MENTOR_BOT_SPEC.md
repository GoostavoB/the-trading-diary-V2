# AI Trading Mentor — Telegram Bot Spec

**Product:** A Telegram bot that plugs into The Trading Diary and acts as a proactive AI trading mentor. Reads the user's trades, surfaces patterns, sends nightly digests, answers questions with real numbers, calls out rule violations, and helps the trader stay disciplined.

**Owner:** Gustavo Belfiore
**Status:** Not started. Full spec below — hand this to Claude Code and it should be able to ship an MVP in ~2-3 focused sessions.
**Target MVP scope:** ship the P0 features (§7). Everything else is P1+.

---

## 1. Why this exists

Traders don't lose money because they don't have data. They lose because they don't look at the data at the moment they need it. A journal that sits in a dashboard requires the trader to open it — right when they're most impulsive (tilt, revenge, FOMO) is exactly when they don't.

A Telegram bot flips that. It comes to them.

- After a trade closes: "You broke your 2% rule — that was a 4.1% loss."
- After 3 losses in a row: "Take a break. Your win rate drops from 68% to 22% after 3+ consecutive losses."
- Nightly at 22:00 local time: today's P&L, best/worst trade, rule violations, tomorrow's watchlist reminder.
- On demand: "Why did I lose money in April?" → bot pulls stats, answers with numbers.

The value is **behavioral**, not analytical. The dashboard already has the numbers. The bot delivers them at the right time.

---

## 2. User journey (happy path)

1. Trader signs into The Trading Diary at `/settings/integrations/telegram`
2. Clicks "Connect Telegram" → opens `https://t.me/YourTradingMentorBot?start=<one-time-token>`
3. Telegram opens, bot greets them with `/start` capturing the token
4. Bot links `chat_id ↔ user_id` in Supabase
5. Bot sends: "Connected! I'll ping you when your trades close, nightly at your local 22:00, and any time you break a rule. Type /help for commands."
6. Every trade the user logs (via CSV upload, screenshot OCR, SnapTrade sync) triggers a webhook that lets the bot react in real time
7. Bot proactively messages when patterns hit
8. User can DM bot anytime: "how am i doing this week?" → bot answers with numbers

---

## 3. Core interactions

### A. Passive (bot messages user)

| Trigger | Message |
|---|---|
| New trade closes with P&L < -1.5R | "⚠️ Trade closed: BTCUSDT −$47 (-3.2%). That's 2× your average loss. What happened?" (with inline buttons: `Log emotion` `Add note` `View trade`) |
| 3 consecutive losses | "🛑 3 losses in a row. Your WR drops from 68% → 22% after 3+ Ls. Consider stopping today." |
| Rule violation detected (e.g., risked > `risk_percent` setting) | "❌ Rule violation on trade #47: risked 3.8% (limit 2%). Logging this — review in the journal." |
| Daily loss lock hit | "🔒 Daily loss limit hit (−$180 = 3% of equity). Trading locked until tomorrow. Rest." |
| New personal-best day | "🏆 Best day ever: +$430. Beats previous record of $315 (Mar 12). Nice work — but stay humble tomorrow." |
| Nightly digest (22:00 local) | Sends the daily card (§4) |
| Weekly digest (Sunday 20:00 local) | Sends the weekly card (§4) |
| Streak milestone (e.g., 5 winning trades) | "🔥 5W streak. Historical odds of hitting 6W from here: 12%. Don't chase." |

### B. Active (user messages bot)

| Command | Response |
|---|---|
| `/start` | Onboarding, links account |
| `/help` | List of commands with examples |
| `/today` | Today's P&L + trade list |
| `/week` | Weekly stats (WR, PF, net P&L, best/worst trade, rule violations) |
| `/month` | Monthly stats |
| `/stats` | Overall stats (all-time WR, PF, avg R:R, streak) |
| `/capital` | Current capital + growth + projection to next milestone |
| `/rules` | Current risk settings (risk %, daily loss limit, max leverage) |
| `/mute [duration]` | Mutes passive alerts for X hours (default 2h). Prevents nag during focus. |
| `/unmute` | Resume alerts |
| `/lesson [note]` | Logs a lesson entry ("Don't chase after losses") — appears in journal |
| Free-form question | LLM parses intent, queries Supabase, answers with numbers. E.g.: "how do i do on 1h timeframe vs 15m" |

### C. Rich messages

Use Telegram's rich formatting (Markdown + inline buttons) generously. Example nightly digest:

```
📊 Today · Apr 24
━━━━━━━━━━━━━━━━━
P&L      +$47 · +0.8%
Trades   4 · 3W / 1L
Best     ETHUSDT +$28 (BREAKOUT)
Worst    SOLUSDT −$12
Rules    ✓ all followed

🎯 Rolling target
$247 / $300 this week (82%)

[View Dashboard] [Weekly digest] [Mute 2h]
```

---

## 4. Message templates (P0)

Store these as Markdown files under `supabase/functions/telegram-bot/templates/` — never inline in code. Templates use `{{variable}}` syntax rendered at send time.

- `daily_digest.md` — end-of-day recap
- `weekly_digest.md` — Sunday summary
- `trade_closed_alert.md` — reactive on `trades.INSERT` when `profit_loss` is set
- `rule_violation.md` — reactive when a trade breaks user's risk % or leverage rule
- `streak_alert.md` — reactive on W/L streak thresholds
- `daily_loss_lock.md` — reactive when locked
- `onboarding.md` — response to `/start`
- `help.md` — response to `/help`

---

## 5. Architecture

```
┌─ Telegram user ────────────────────────────────────────────┐
│  User DMs bot OR bot DMs user                              │
└─────────────────────────────┬──────────────────────────────┘
                              │  HTTPS webhook (Telegram → us)
                              ▼
┌─ Supabase Edge Function: `telegram-webhook` (public) ──────┐
│  1. Parse update (message, callback_query, etc)            │
│  2. Look up `chat_id → user_id` via `telegram_users` table │
│  3. If /start with token → link account                    │
│  4. If /command → route to handler                         │
│  5. If free-form → send to LLM with user context           │
│  6. Reply via Telegram Bot API                             │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─ Supabase Edge Function: `telegram-notifier` (cron+trigger)┐
│  Triggered by:                                             │
│   - Postgres trigger on `trades.INSERT` (real-time alerts) │
│   - pg_cron every 5min (nightly digest scheduling)         │
│   - pg_cron weekly (weekly digest)                         │
│  Checks user preferences, mute state, sends via Bot API    │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
                      ┌─ Supabase Postgres ─────────┐
                      │ telegram_users              │
                      │ telegram_mute_state         │
                      │ telegram_message_log        │
                      │ trades (existing)           │
                      │ user_settings (existing)    │
                      └─────────────────────────────┘
```

### Why Telegram over Discord/WhatsApp/SMS

- Telegram Bot API is the cleanest of the four (documented, stable, free)
- No SMS costs, no WhatsApp Business Platform review headaches
- Push notifications on iOS/Android natively
- Rich message formatting + inline buttons out of the box
- Traders are already on Telegram (crypto community defaults there)

---

## 6. Data model

New tables in a migration `supabase/migrations/YYYYMMDDHHMMSS_telegram_bot.sql`:

```sql
-- ── 1) Account linking ──────────────────────────────────────────────────
CREATE TABLE public.telegram_users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id           bigint NOT NULL UNIQUE,          -- Telegram chat_id
  telegram_username text,                             -- for logs/display
  timezone          text DEFAULT 'UTC',               -- for digest scheduling
  locale            text DEFAULT 'en',                -- 'en' | 'pt' | 'es' | 'ar' | 'vi'
  linked_at         timestamptz NOT NULL DEFAULT now(),
  last_active_at    timestamptz,
  UNIQUE (user_id)
);

-- One-time tokens for /start
CREATE TABLE public.telegram_link_tokens (
  token       text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at     timestamptz
);

-- ── 2) User preferences (per user, notification granularity) ────────────
CREATE TABLE public.telegram_preferences (
  user_id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_digest               boolean NOT NULL DEFAULT true,
  daily_digest_hour_local    int NOT NULL DEFAULT 22 CHECK (daily_digest_hour_local BETWEEN 0 AND 23),
  weekly_digest              boolean NOT NULL DEFAULT true,
  weekly_digest_day          int NOT NULL DEFAULT 0 CHECK (weekly_digest_day BETWEEN 0 AND 6),  -- 0=Sun
  alert_on_trade_close       boolean NOT NULL DEFAULT true,
  alert_on_big_loss          boolean NOT NULL DEFAULT true,      -- loss > 1.5× avg loss
  alert_on_streak            boolean NOT NULL DEFAULT true,      -- >=3 W or >=3 L
  alert_on_rule_violation    boolean NOT NULL DEFAULT true,
  alert_on_daily_loss_lock   boolean NOT NULL DEFAULT true,
  mute_until                 timestamptz,                        -- if set, skip passive alerts
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- ── 3) Message log (dedup + rate limit + debugging) ─────────────────────
CREATE TABLE public.telegram_message_log (
  id             bigserial PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  chat_id        bigint,
  direction      text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type   text NOT NULL,   -- 'command' | 'digest' | 'alert' | 'free_text' | 'callback'
  template_name  text,            -- e.g. 'daily_digest' | 'trade_closed_alert'
  content        text,
  telegram_message_id bigint,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_telegram_message_log_user ON public.telegram_message_log(user_id, created_at DESC);

-- ── 4) RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_users_own" ON public.telegram_users FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.telegram_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_prefs_own_select" ON public.telegram_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "telegram_prefs_own_update" ON public.telegram_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "telegram_prefs_own_insert" ON public.telegram_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_link_tokens_own" ON public.telegram_link_tokens FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.telegram_message_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_log_own" ON public.telegram_message_log FOR SELECT USING (auth.uid() = user_id);

-- (Service role bypasses RLS for edge function writes.)
```

---

## 7. Feature phases

### P0 — MVP (ship first)

1. **Bot creation on Telegram** (BotFather → get token, set commands, set webhook)
2. **`/start` deep link + account linking flow** (settings page → button → deep link → capture → save)
3. **Daily digest** at user-configured local hour (pg_cron + edge function)
4. **Trade-closed alert** (Postgres trigger fires webhook to edge function)
5. **Basic `/help`, `/today`, `/mute`, `/unmute` commands**
6. **Message log for dedup + rate limit**

Deliverables: 1 migration + 2 edge functions + 1 settings page block + `HANDOFF: telegram bot deployed`.

### P1 — Behavioral alerts (ship right after P0 stabilizes)

7. Rule violation alert (risk % exceeded, leverage above limit, stop moved)
8. Streak alerts (3+ W, 3+ L)
9. Big loss alert (loss > 1.5× avg loss)
10. Daily loss lock notification
11. Weekly digest (Sunday 20:00 local)

### P2 — Q&A + LLM

12. Free-form question handling: `/ask` command or any non-command text
13. LLM (Claude / OpenAI) with system prompt containing:
    - User's stats (WR, PF, avg R, drawdown, capital, recent trades)
    - Tool-use for fetching more via Supabase (e.g., "trades on 15m timeframe last 30 days")
    - System prompt anchors on Trading Diary voice: honest, direct, numbers-first, no toxic positivity
14. Guardrails: never give financial advice; frame as data reflection

### P3 — Advanced

15. Voice notes (Whisper transcription → same handlers)
16. Inline queries (`@YourBot btc` returns latest BTC stats)
17. Group chats (a shared bot for a trading group with per-user auth)
18. Screenshot upload → OCR trade → log
19. `/setup` guided flow (walks user through setting rules)
20. Localization (bot replies in user's `locale`)

---

## 8. Implementation notes

### Bot creation (one-time, user does this)

1. Telegram → search `@BotFather` → `/newbot`
2. Name: **The Trading Diary Bot** · Username: `@TradingDiaryBot` (or similar available handle)
3. Save the token — this becomes `TELEGRAM_BOT_TOKEN` in Supabase secrets
4. `/setcommands` with:
   ```
   start - Link your Trading Diary account
   help - Show all commands
   today - Today's P&L and trades
   week - This week's stats
   stats - All-time stats
   capital - Current capital + projection
   rules - Your risk settings
   mute - Pause alerts (default 2h)
   unmute - Resume alerts
   ```
5. `/setprivacy` → **Disable** (so bot can read all messages in DMs — needed for free-form Q&A)

### Webhook setup

```bash
# After deploying telegram-webhook edge function:
curl -F "url=https://<project>.supabase.co/functions/v1/telegram-webhook" \
  https://api.telegram.org/bot<TOKEN>/setWebhook
```

### Edge function skeletons

`supabase/functions/telegram-webhook/index.ts`:
```typescript
// Public — Telegram calls with no JWT
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const update = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const message = update.message ?? update.callback_query?.message;
  if (!message) return new Response('ok');

  const chatId: number = message.chat.id;
  const text: string = update.message?.text ?? update.callback_query?.data ?? '';

  // Look up user
  const { data: linked } = await supabase
    .from('telegram_users')
    .select('user_id, timezone, locale')
    .eq('chat_id', chatId)
    .maybeSingle();

  // Route
  if (text.startsWith('/start')) return handleStart(supabase, chatId, text);
  if (!linked)                  return replyUnlinked(chatId);
  if (text.startsWith('/'))     return handleCommand(supabase, linked, text);
                                return handleFreeText(supabase, linked, text);
});
```

`supabase/functions/telegram-notifier/index.ts`:
```typescript
// Called by pg_cron every 5 minutes to dispatch digests, and by a trigger
// on trades.INSERT to send trade-closed alerts.
```

### Trigger for real-time trade alerts

```sql
CREATE OR REPLACE FUNCTION notify_trade_closed()
RETURNS trigger AS $$
BEGIN
  -- Only fire when a trade transitions from open to closed
  IF NEW.closed_at IS NOT NULL AND (OLD.closed_at IS NULL OR OLD.closed_at IS DISTINCT FROM NEW.closed_at) THEN
    PERFORM net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/telegram-notifier',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('event', 'trade_closed', 'user_id', NEW.user_id, 'trade_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_trade_closed
  AFTER INSERT OR UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION notify_trade_closed();
```

(Requires the `pg_net` extension enabled in the Supabase project.)

### Digest scheduling with pg_cron

```sql
-- Run every 5 minutes; the edge function checks who's in their local 22:00 window
SELECT cron.schedule(
  'telegram-digest-tick',
  '*/5 * * * *',
  $$ SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/telegram-notifier',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object('event', 'tick')
  ) $$
);
```

---

## 9. Frontend integration

New settings section at `src/pages/Settings.tsx` (or a subroute `/settings/integrations/telegram`):

```tsx
// Not-yet-linked state
<Card className="card-premium p-6">
  <div className="flex items-start gap-4">
    <TelegramIcon className="h-10 w-10 text-electric" />
    <div className="flex-1">
      <h3 className="font-display text-xl text-space-100">Telegram bot</h3>
      <p className="text-sm text-space-300 mt-1">
        Get trade alerts, nightly digests, and answer questions about your performance — right in Telegram.
      </p>
      <button onClick={handleLink} className="btn-primary mt-4">Connect Telegram</button>
    </div>
  </div>
</Card>

// Linked state — show preferences: daily digest hour, timezone, mute
```

`handleLink` calls a new edge function `telegram-generate-link` that creates a token in `telegram_link_tokens`, returns the deep link `https://t.me/YourBotUsername?start=<token>`, and opens it in a new tab.

---

## 10. Costs

- **Telegram Bot API**: free, no limits meaningful at MVP scale
- **Supabase Edge Functions**: 500k invocations/month included in Pro. A user with 5 trades/day and 1 digest = ~180 invocations/month. Bot scales cheaply.
- **LLM (for P2 Q&A)**: 
  - Claude Haiku via Anthropic: ~$0.25 per 1M input tokens. A daily Q&A with ~2k token context = ~$0.0005/query
  - Free tier: 5 questions/day/user; Pro tier: unlimited
- **pg_net + pg_cron**: free with Supabase

Total: $0 at MVP scale. Scales linearly.

---

## 11. Security

- **Never expose the bot token to the frontend** — it stays in Supabase secrets as `TELEGRAM_BOT_TOKEN`
- **Verify webhook origin** — Telegram sends a `X-Telegram-Bot-Api-Secret-Token` header if you set one; require it
- **RLS on all telegram_* tables** — user can only see their own row
- **Rate limit outbound**: max 30 messages/second per chat per Telegram's rules; use `telegram_message_log` to throttle
- **Deep link tokens expire in 15 min** — enforced in DB
- **User can revoke** — a "Disconnect" button in settings removes the `telegram_users` row → bot goes silent for them

---

## 12. Success metrics

Track in GA4 + a `telegram_bot_analytics` view:

- **Adoption**: % of paid users who connect the bot within 7d of signup
- **Retention**: % of connected users who received an alert in the last 7d
- **Engagement**: median commands sent per user per week
- **Behavior**: reduction in rule violations for connected users vs. baseline (proves the bot is actually changing behavior — the whole point)

Target after 90 days: 40% of Pro/Elite users connected. Median 3 alerts read/week. Rule violation rate cut in half for connected users.

---

## 13. Nice-to-have voice/personality

The bot should feel like a **kind, blunt trading buddy** — not a chatbot, not a corporate compliance officer.

- **Use trader slang naturally** (WR, PF, R:R, tilt, revenge trade, chase, stop hunt) — the user speaks this language, the bot should too
- **Be honest about losses** — never sugarcoat. "That was a bad trade" is fine.
- **Never toxic-positive** — no "You got this!" after a big loss. Numbers only.
- **Call out patterns bluntly** — "You revenge-traded ETHUSDT twice this week. Both losers."
- **Celebrate real wins** — but keep it brief. "Best day ever. Move on."
- **Portuguese for Gustavo** if `locale='pt'` — casual, direct, second-person

Example tone (English):
> Trade closed: BTCUSDT +$34. Your rule was 2% risk — you used 3.1%. Win doesn't fix that. Log it.

Example tone (Portuguese):
> Trade fechado: BTCUSDT +$34. Sua regra é 2% de risco — você usou 3.1%. Ganhar não corrige. Anota aí.

---

## 14. Deployment checklist

When Gustavo says "ship the bot", do this in order:

1. Create bot on Telegram, save token
2. `supabase secrets set TELEGRAM_BOT_TOKEN=<token>`
3. `supabase secrets set TELEGRAM_WEBHOOK_SECRET=<random-string>` (for header verification)
4. Write and apply the migration (§6)
5. Enable `pg_net` and `pg_cron` extensions in Supabase Dashboard → Database → Extensions
6. Deploy `telegram-webhook` and `telegram-notifier` edge functions
7. Set the webhook (§8)
8. Ship the settings-page frontend
9. Test end-to-end with Gustavo's own Telegram account
10. Update `CLAUDE.md` § 12 to reflect "Telegram bot deployed, MVP live"

---

## 15. What NOT to build (yet)

- **Group chats** — MVP is 1:1 DM only. Groups have permission complexity.
- **Bot marketplace listing** — private for now; only via user's own Telegram account
- **Automated trading via bot** — DO NOT. This is a mentor/journal, not an execution layer. Legal/regulatory nightmare.
- **Signals / trade calls** — same reason.
- **Copy trading integration** — different product entirely.

---

*Written: 2026-04-24. Not implemented yet. When you (Claude Code) ship the MVP, update this file with actual bot username, webhook URL, and any deviations from spec.*
