# Exchange API Sync — Diagnosis & Fix Spec (BingX first, then the other 10)

**Audience:** Claude Code, working in this repo.
**Trigger:** Gustavo can't get trades to sync from BingX. He wants: connect in a few clicks (no
terminal, no manual key wrangling beyond pasting two strings), and a per-connection "only import
trades from date X forward" setting that's remembered on every future sync.

**Before you build anything new: read this whole doc.** The manual API-key integration already
exists end-to-end — UI, edge functions, DB tables, adapters for 11 exchanges. It is not a "build
from scratch" task. It's a "diagnose why BingX returns zero trades, then fix the concrete bugs
below" task. Do not re-architect the flow; patch it.

---

## 1. What already exists (do not rebuild)

| Layer | File |
|---|---|
| DB tables | `exchange_connections`, `exchange_sync_history`, `exchange_pending_trades` — migration `supabase/migrations/20251020134625_4e879c08-9d92-4c0d-8ebc-b709a328c981.sql` |
| Connect UI | `src/components/exchanges/ConnectExchangeModal.tsx` → posts to `connect-exchange` edge function |
| Sync UI | `src/pages/ExchangeConnections.tsx` (tab "API Key (Advanced)"), `src/components/exchanges/SyncTradesDialog.tsx`, `TradePreviewModal.tsx`, `SyncHistoryWidget.tsx` |
| Sync edge function | `supabase/functions/fetch-exchange-trades/index.ts` — fetches trades into `exchange_pending_trades` (preview), a second call with `mode: 'import'` commits selected ones into `trades` |
| Adapter registry | `supabase/functions/_shared/adapters/ExchangeService.ts` — routes to one of 11 adapters (`binance, bybit, coinbase, kraken, bitfinex, bingx, mexc, kucoin, okx, gateio, bitstamp`) |
| BingX adapter (live, used by edge function) | `supabase/functions/_shared/adapters/BingXAdapter.ts` |
| BingX adapter (dead code, NOT imported anywhere in `src/`) | `src/services/exchanges/adapters/BingXAdapter.ts` and the rest of `src/services/exchanges/` |

Also relevant: this app **already has a separate, working SnapTrade 1-click flow** (`SNAPTRADE_SETUP.md`,
tab "1-Click" on the same page). SnapTrade does not support BingX (confirmed against SnapTrade's
public integrations catalog — Binance and Coinbase are the only crypto venues they carry as of
this writing). So BingX has to go through the manual-API-key path described above. That's fine —
this doc makes that path solid, and every other exchange on the list rides the same fix for free.

**We also checked whether BingX offers a public "Login with BingX" OAuth like Coinbase or Google
do.** It doesn't, for arbitrary third-party apps. BingX has an OAuth2 flow, but it's only granted
to approved **Broker Partners** (apply via broker@bingx.com, business-dev process, built around
order-flow rebates for trading bots/copy-trading platforms — see [Broker Access BingX Technical
Documentation](https://bingx.com/en/support/articles/27623589052185) and [Types of Broker
Partners](https://bingx.com/en/support/articles/23261003741593)). That's not something to block
this fix on. Read-only API-key paste is the standard pattern every crypto trading journal uses
(CoinMarketMan, TradeZella, Koinly, Vezgo) — it's genuinely low-friction (2–3 clicks on BingX's
side to generate a read-only key, then paste 2 fields here) as long as the UI guides the user well.

---

## 2. Root cause: why BingX syncs 0 trades

Gustavo trades **perpetual futures** on BingX (see his trading profile — ETH/ADA perps, Playbook
Monstro). `BingXAdapter.fetchTrades()` in `supabase/functions/_shared/adapters/BingXAdapter.ts`
only calls **spot** endpoints:

```ts
// BingXAdapter.ts:93 — this is SPOT ONLY
const response = await this.makeRequest<{ orders: any[] }>('/openApi/spot/v2/trade/query', params);
```

BingX's perpetual futures ("swap") trade history lives under a completely different endpoint
family (`/openApi/swap/v2/...`), with a different auth namespace, different symbol format
(`BTC-USDT` perp vs spot), and a different response shape. **The adapter never calls it.** So for
any account whose trades are 100% perps — which is Gustavo's case — the sync will legitimately
return an empty list even with perfectly valid, correctly-scoped API keys. This is very likely the
entire "I can't connect" experience: the connection succeeds (the test-connection call hits
`/openApi/spot/v1/account/balance`, which works regardless), but the trade fetch comes back empty
or errors, and there's no UI signal explaining *why*.

**Two more things make this worse:**

- The two existing BingX adapter files (edge function copy vs. the dead frontend copy) call
  **different, inconsistent spot endpoints** (`/openApi/spot/v2/trade/query` vs
  `/openApi/spot/v1/trade/query`) and parse **different response shapes** (`response.orders` vs
  `response.fills`). Neither was verified against BingX's actual current API docs when written —
  they read like a plausible guess, not a tested integration. BingX's official docs site
  (`bingx-api.github.io/docs`) is a JS-rendered SPA that this research session couldn't fetch
  directly, so **do not trust either existing path as correct without testing it against a real
  BingX account first.**
- `fetchOrders()` currently returns `[]` unconditionally in the live adapter (`BingXAdapter.ts:145-147`)
  — orders/positions data isn't wired at all yet.

### Recommended fix: route through CCXT instead of hand-rolled signing

Don't keep hand-rolling BingX's HMAC-SHA256 request signing and guessing endpoint paths. CCXT
(`https://github.com/ccxt/ccxt`) already ships a maintained, tested BingX driver that unifies spot
+ swap (USDT-M perps) + coin-M futures behind one call: `fetchMyTrades(symbol, since, limit, params)`.
Verified against CCXT's own docs (https://docs.ccxt.com/docs/exchanges/bingx) that `fetchMyTrades`
maps to:

- Spot → `Spot/Trades Endpoints/Query transaction details`
- Swap (USDT-M perps, what Gustavo trades) → `Swap/Trades Endpoints/Query historical transaction orders`
- Coin-M futures → `Coin-M Futures/Trades Endpoints/Query Order Trade Detail`

and `fetchClosedOrders` / `fetchCanceledAndClosedOrders` map to `Query Order history` /
`All Orders` on the same three market types. CCXT handles the signature scheme, timestamp sync,
and pagination for all of this, and — critically — **the same driver interface already covers 8 of
the other 10 exchanges in `SUPPORTED_EXCHANGES`** (Binance, Bybit, Coinbase, Kraken, Bitfinex,
MEXC, KuCoin, OKX, Gate.io, Bitstamp are all CCXT-supported exchanges too). Replacing the 11
hand-rolled adapters with one CCXT-backed adapter class collapses ~11 files of guessed, untested
signing code into one well-tested dependency, and every future exchange add becomes "add one line
to a switch statement" instead of "reverse-engineer another exchange's API from scratch."

**Practical steps:**

1. In `supabase/functions/_shared/adapters/`, add `CCXTAdapter.ts` that wraps `ccxt` (import via
   `npm:ccxt` — Supabase Edge Functions run on Deno and support `npm:` specifiers natively; verify
   cold-start size is acceptable, CCXT is large — if it isn't, fall back to importing only the
   `ccxt/js/src/bingx.js` module rather than the full multi-exchange bundle, or pin to `esm.sh/ccxt`
   like the project already does for `@supabase/supabase-js`).
2. `fetchTrades()` must call `fetchMyTrades` for **both** `spot` and `swap` market types (BingX
   scopes credentials per market type in some cases — check `ccxt.bingx.has` and account settings)
   and tag each returned trade with which market it came from. Don't assume spot-only.
3. Keep the existing `ExchangeService.ts` routing interface (`initializeExchange`, `syncExchange`,
   etc.) — swap the internals, not the contract, so `fetch-exchange-trades/index.ts` doesn't need
   to change its call sites.
4. Test against a real BingX read-only key (Gustavo can generate one in ~2 minutes at
   https://bingx.com/en/accounts/api) before calling this done. Do not ship on the assumption that
   CCXT's BingX driver works — verify one real sync end-to-end.

If CCXT turns out to be impractical in the Deno edge runtime (bundle size, cold start, or a
missing feature), the fallback is to fix the raw endpoint paths by hand — but do that by reading
BingX's actual current REST reference (fetch it with a JS-rendering tool, since the docs site is
an SPA), not by guessing again.

---

## 3. "Only import trades from date X forward" — currently not persisted

Gustavo's core ask: pick a start date once, and every future sync only pulls trades from that date
onward — never earlier, without having to re-specify it.

Today: `fetch-exchange-trades/index.ts` accepts an optional `startDate` **per request** (line 46,
149-151) and defaults to "last 30 days" if omitted. Nothing is stored on the connection row, so
there's no durable "always sync from here" behavior — the UI would need to pass the same date on
every single sync call, and nothing stops a shorter or missing date from pulling trades that
predate what the user wants.

**Fix:**

1. Add a column to `exchange_connections`:

   ```sql
   ALTER TABLE exchange_connections
     ADD COLUMN IF NOT EXISTS sync_start_date timestamptz;

   COMMENT ON COLUMN exchange_connections.sync_start_date IS
     'User-chosen floor for trade imports on this connection. Every sync (manual or scheduled) must clamp its startTime to max(requested startDate, sync_start_date). Never import trades before this date, regardless of what the caller passes.';
   ```

2. `ConnectExchangeModal.tsx` — add a required date picker ("Import trades starting from") as part
   of the connect flow, alongside API Key / API Secret. Default to today if the user doesn't pick
   one (safer than silently importing years of history on first sync).

3. `fetch-exchange-trades/index.ts` — after loading `connection` (line 49-58), compute the
   effective start time as:

   ```ts
   const requestedStart = startDate ? new Date(startDate) : null;
   const floor = connection.sync_start_date ? new Date(connection.sync_start_date) : null;
   const startTime = floor && (!requestedStart || requestedStart < floor)
     ? floor
     : (requestedStart ?? new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000));
   ```

   i.e. `sync_start_date` is a hard floor that no request-level `startDate` can override downward.
   This makes the "never before this date" guarantee hold even if some future caller (a cron job,
   a different UI) forgets to pass a date.

4. Surface the chosen date on `ConnectedAccountsList` / the connection card in
   `ExchangeConnections.tsx` ("Syncing since Jan 3, 2026") so it's visible, not a hidden setting.

---

## 4. Trades imported from exchange sync are mislabeled `type: 'spot'` unconditionally

`fetch-exchange-trades/index.ts:220` — `type: 'spot' as const` is hardcoded for every trade that
comes back from any adapter, regardless of what market it actually came from. Once BingX (or
Bybit, or OKX) perp trades start flowing through this pipeline, they'll be recorded in the
`trades` table as spot trades. Given `useDashboardStats.ts` and other analytics may treat
leverage/funding differently for perps vs spot (worth double-checking, but even if not today, it's
wrong data going forward), this needs the adapter layer to tag each trade with its real market
type (`spot` | `swap` | `future`) and `fetch-exchange-trades` needs to pass that through instead of
hardcoding.

---

## 5. `exchange_connections.exchange_name` CHECK constraint only allows 4 of the 11 supported exchanges

`supabase/migrations/20251020134625_..._.sql:5`:

```sql
exchange_name TEXT NOT NULL CHECK (exchange_name IN ('bingx', 'binance', 'bybit', 'coinbase'))
```

But `ExchangeService.ts` and `ConnectExchangeModal.tsx` both support 11 exchanges (also `kraken,
bitfinex, mexc, kucoin, okx, gateio, bitstamp`). Trying to connect any of those 7 will fail at the
DB layer with a constraint violation, not a friendly error. Fix with a migration:

```sql
ALTER TABLE exchange_connections DROP CONSTRAINT IF EXISTS exchange_connections_exchange_name_check;
ALTER TABLE exchange_connections ADD CONSTRAINT exchange_connections_exchange_name_check
  CHECK (exchange_name IN ('bingx','binance','bybit','coinbase','kraken','bitfinex','mexc','kucoin','okx','gateio','bitstamp'));
```

Keep this list in sync with `ExchangeService.SUPPORTED_EXCHANGES` going forward — consider adding a
comment in both places pointing at each other so they don't drift again.

---

## 6. Credentials are Base64-encoded, not encrypted

`fetch-exchange-trades/index.ts:17-19`:

```ts
function decrypt(encryptedText: string): string {
  return atob(encryptedText);
}
```

`atob`/`btoa` is encoding, not encryption — trivially reversible by anyone who can read the row
(a DB dump, a misconfigured RLS policy, a logging accident). These are live exchange API
secrets. Recommend moving to real encryption before shipping BingX broadly:

- **Preferred:** Supabase Vault (`pgsodium`) — store the API key/secret via
  `vault.create_secret()` and reference by UUID from `exchange_connections`, decrypt only inside
  the edge function using the service role. Supabase manages key rotation.
- **Minimum viable if Vault setup is out of scope right now:** symmetric AES-GCM encryption in the
  edge function using a secret stored in `EXCHANGE_CREDS_ENCRYPTION_KEY` (Supabase secret, never
  in the repo), instead of `atob`/`btoa`.

This applies to every exchange connection already stored, not just new BingX ones — flag to
Gustavo whether existing rows need to be re-encrypted/rotated once this ships (rotating BingX API
keys afterward is cheap and recommended regardless, since they've been sitting Base64-"encoded").

---

## 7. Dead code to delete

`src/services/exchanges/` (index.ts, ExchangeService.ts, BaseExchangeAdapter.ts, all 11 adapters
under `adapters/`) is not imported anywhere in `src/` — confirmed via repo-wide grep. It's a
duplicate, unused copy of the real (edge-function-side) adapter logic, including a frontend
`BingXAdapter.ts` that imports `crypto-js` to sign requests — the kind of thing that looks like a
live "secrets get signed in the browser" bug at a glance but isn't, because nothing calls it.
Delete the whole `src/services/exchanges/` directory to remove the confusion and the unused
`crypto-js` dependency. Double-check nothing outside `src/` (e.g. a Vite config alias) references
it first.

---

## 8. Rollout order for Claude Code

1. Delete dead code (§7) — zero risk, immediate clarity.
2. Migration: widen `exchange_name` CHECK constraint (§5) — small, unblocks other exchanges.
3. Migration: add `sync_start_date` column (§3.1).
4. Fix credential encryption (§6) — do this before wiring more exchanges through the same table.
5. Build/verify the CCXT-backed adapter for BingX specifically (§2) — spot + swap, tested against
   a real read-only key from Gustavo.
6. Wire `sync_start_date` through `ConnectExchangeModal.tsx` → `connect-exchange` →
   `fetch-exchange-trades` clamp logic (§3.2-3.4).
7. Fix trade `type` tagging (§4).
8. Once BingX is confirmed working end-to-end with real trades, repeat step 5's adapter swap for
   the other 10 exchanges using the same CCXT wrapper (should be fast — same interface, different
   exchange id).
9. `npx tsc --noEmit` gate, then PR per this repo's normal flow (see root `CLAUDE.md` §7, §9).

## 9. Open questions for Gustavo

- Does he want **both** spot and perpetual futures trades imported from BingX, or perps only? (He
  said he's a perp trader — worth confirming spot isn't noise he'd rather exclude.)
- Should `sync_start_date` be editable after the connection is created (e.g. if he later wants to
  backfill further), or locked once set?
- For existing BingX credentials already stored via the current (Base64) flow — rotate the key on
  BingX's side after the encryption fix ships, since anything encoded so far should be treated as
  exposed.

---

## Sources

- [Broker Access BingX Technical Documentation](https://bingx.com/en/support/articles/27623589052185) — confirms BingX's OAuth2 is a Broker Partner program, not public self-serve
- [Types of Broker Partners — BingX](https://bingx.com/en/support/articles/23261003741593)
- [Cryptohopper Announces Implementation of BingX's oAuth2 Solution](https://www.cryptohopper.com/blog/cryptohopper-announces-implementation-of-bingx-s-oauth2-solution-11059)
- [SnapTrade brokerage integrations catalog](https://snaptrade.com/brokerage-integrations) — Binance and Coinbase confirmed listed for crypto; BingX not present
- [CCXT — bingx unified API reference](https://docs.ccxt.com/docs/exchanges/bingx) — `fetchMyTrades`, `fetchClosedOrders` endpoint mappings for spot/swap/coin-M
- [ccxt/ccxt on GitHub](https://github.com/ccxt/ccxt)
- [BingX API rate limits (2025-10-16 upgrade)](https://bingx.com/en/support/articles/31103871611289) — IP-based limit 2,000 req/10s, order endpoint 10 req/s
