# SnapTrade 1-Click Exchange Integration — Setup Guide

This integration lets users connect Binance, Coinbase, Kraken, Gemini, Bitfinex, Bitstamp, and more in one click — no API keys to manage manually. Read-only, revocable.

## What was built

| Layer | Files |
|---|---|
| DB migration | `supabase/migrations/20260424130000_create_aggregator_connections.sql` |
| Edge functions | `supabase/functions/snaptrade-{register-user, login-link, list-connections, sync-trades, disconnect, webhook}/index.ts` |
| Shared SnapTrade client | `supabase/functions/_shared/snaptrade.ts` (HMAC-SHA256 signing, no npm deps) |
| Frontend service | `src/services/exchanges/aggregator/SnapTradeService.ts` |
| UI components | `src/components/exchanges/QuickConnect.tsx`, `ConnectedAccountsList.tsx` |
| Page integration | `src/pages/ExchangeConnections.tsx` (now has 2 tabs: 1-Click vs API Key) |
| Types | `src/types/aggregator.ts` |

## Step-by-step setup

### 1. Create a SnapTrade account (~10 min)

1. Go to [https://dashboard.snaptrade.com/signup](https://dashboard.snaptrade.com/signup) and create an account.
2. Once in the dashboard, you get a **Client ID** and **Consumer Key**. Note both.
3. Free tier: 10 connected users. Beyond that ~$3/user/month.

### 2. Apply the DB migration

```bash
# Option A — via Supabase CLI
supabase db push

# Option B — manual
# Open Supabase Dashboard → SQL Editor → paste contents of:
#   supabase/migrations/20260424130000_create_aggregator_connections.sql
# → Run
```

This creates `aggregator_users`, `aggregator_connections`, `aggregator_trade_map` tables with RLS policies.

### 3. Set Supabase secrets

```bash
supabase secrets set SNAPTRADE_CLIENT_ID=YOUR_CLIENT_ID
supabase secrets set SNAPTRADE_CONSUMER_KEY=YOUR_CONSUMER_KEY
```

(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are already provided to all edge functions automatically.)

### 4. Deploy the edge functions

```bash
supabase functions deploy snaptrade-register-user
supabase functions deploy snaptrade-login-link
supabase functions deploy snaptrade-list-connections
supabase functions deploy snaptrade-sync-trades
supabase functions deploy snaptrade-disconnect
supabase functions deploy snaptrade-webhook --no-verify-jwt
```

> ⚠️ The webhook function uses `--no-verify-jwt` because SnapTrade calls it without a Supabase JWT. The other 5 require auth.

### 5. Configure the SnapTrade webhook

1. SnapTrade dashboard → **Webhooks** → Add new
2. URL: `https://<your-supabase-project>.supabase.co/functions/v1/snaptrade-webhook`
3. Events: select all (CONNECTION_ADDED, CONNECTION_DELETED, CONNECTION_BROKEN, ACCOUNT_HOLDINGS_UPDATED, etc)
4. Save

### 6. Test the flow end-to-end

1. Run `npm run dev` and log in
2. Navigate to `/exchanges`
3. The **1-Click** tab should show the QuickConnect card
4. Click any broker logo (or the big "Connect an exchange" button)
5. SnapTrade popup opens → log into your exchange → grant read-only access
6. Popup closes → ConnectedAccountsList refreshes → click **Sync** to pull trade history
7. Check `aggregator_connections` and `trades` in Supabase to confirm data

### 7. (Optional) Add brokers to your curated list

Edit `src/types/aggregator.ts` → `SUPPORTED_BROKERS` array. Slugs must match SnapTrade's broker IDs ([list here](https://docs.snaptrade.com/docs/general/supported-brokerages)).

Logos go in `/public/exchange-logos/<slug>.svg`.

## How it works (architecture summary)

```
┌─ Browser ────────────────────────────────────────────────────┐
│  QuickConnect.tsx                                            │
│   1. SnapTradeService.registerUser()                         │
│      → POST /functions/v1/snaptrade-register-user            │
│   2. SnapTradeService.getConnectPortalUrl({ broker })        │
│      → POST /functions/v1/snaptrade-login-link               │
│   3. window.open(redirectURI) — popup with SnapTrade portal  │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─ Supabase Edge Functions ───▼────────────────────────────────┐
│  Each function:                                              │
│    - Validates user JWT                                      │
│    - Looks up aggregator_users for stored userSecret         │
│    - Calls SnapTrade API with HMAC-signed request            │
│    - Persists results into aggregator_connections / trades   │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─ SnapTrade API ─────────────▼────────────────────────────────┐
│  POST /api/v1/snapTrade/registerUser                         │
│  POST /api/v1/snapTrade/login                                │
│  GET  /api/v1/authorizations                                 │
│  GET  /api/v1/activities?type=BUY|SELL                       │
│  DELETE /api/v1/authorizations/:id                           │
└─────────────────────────────┬────────────────────────────────┘
                              │ asynchronous webhook events
                              ▼
                  /functions/v1/snaptrade-webhook
                              │
                              ▼ updates connection status
                  aggregator_connections.status
```

### Trade normalization

`snaptrade-sync-trades` does FIFO matching of BUY/SELL pairs by (account, symbol):

- BUY → inserts an open `trades` row (`closed_at = null`, `side = 'long'`)
- SELL with matching open → closes it (`exit_price`, `closed_at`, `profit_loss`, `roi`)
- SELL with no matching open → standalone short trade
- Each activity is recorded in `aggregator_trade_map` to prevent re-import on subsequent syncs

This works perfectly for spot trading. For perpetual/derivative trades on Binance Futures, KuCoin Futures, etc., SnapTrade returns each fill as its own activity row — current logic captures them but doesn't pair them into round-trip positions. **Manual edits possible** via the Trades page if needed.

### Cost ceiling

Free tier: 10 connected users (any number of brokers per user).
Paid: starts ~$3/user/month. Bill grows linearly with active connections, not API calls.

You can put 1-Click behind the **Pro tier** only — `useUserTier` is already wired in the app. Just gate the QuickConnect component:

```tsx
{tier === 'pro' || tier === 'elite' ? (
  <QuickConnect ... />
) : (
  <UpgradePrompt feature="1-click connect" />
)}
```

## Troubleshooting

**"Missing env var SNAPTRADE_CLIENT_ID"** in edge function logs → secrets not set. Run step 3 again.

**Popup blocked** → modern browsers block popups not directly tied to user gesture. The button click *is* a user gesture, so this shouldn't happen — but if running in an iframe or tab restoring from inactive, retry.

**"User not registered with SnapTrade"** in login-link → registerUser failed silently. Check edge function logs for the original error.

**Trades not syncing** → call `SnapTradeService.syncTrades({ connectionId })` manually from the connected accounts list. SnapTrade also auto-syncs once daily; webhook events trigger our DB to refresh status.

**Connection shows "requires_reauth"** → user changed their exchange password or revoked SnapTrade access. They need to click Connect again with the same broker.

## Roll-out plan

1. Deploy migration + functions to **staging** first
2. Set staging secrets to a separate SnapTrade dev workspace (free tier)
3. Test with your own Binance/Coinbase accounts
4. Verify trade dedupe by syncing twice and checking row counts in `trades`
5. Promote to prod, set prod secrets, configure prod webhook URL

## What this DOESN'T do (yet)

- Doesn't pull deposits/withdrawals — only BUY/SELL activities. (Easy to extend in `snaptrade-sync-trades`.)
- Doesn't aggregate funding fees from perpetuals separately — they may show as activity type `FEE` and currently get skipped.
- No real-time price stream from connected accounts.
- No auto-sync schedule — relies on user clicking Sync OR webhook events. Add a cron-trigger via Supabase Scheduler if needed.
