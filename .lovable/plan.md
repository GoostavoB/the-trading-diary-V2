

## Problem

The two trades uploaded today (BTCUSDT +$18.05 and DAX +$14.56) have `trade_date = NULL` and `created_at = NULL` in the database. The DRE query filters by `.gte('trade_date', todayStart)`, so trades with null `trade_date` are excluded entirely. They also have `closed_at` set to today (Apr 7), which is the only reliable date field.

## Fix

**File: `src/hooks/useDynamicRiskEngine.ts`**

Change the "today's trades" query to use `closed_at` as a fallback when `trade_date` is null. Since Supabase JS client doesn't support `COALESCE` directly, use an `.or()` filter:

- Filter: trades where `trade_date >= today` OR (`trade_date` is null AND `closed_at >= today`)
- Order by `COALESCE(trade_date, closed_at, created_at)` — use raw ordering or just `closed_at`
- Also select `closed_at` so the compliance mapper can use it as timestamp fallback

Concrete changes to the query (lines 100-108):
```typescript
const todayStart = startOfDay(new Date()).toISOString();
const { data, error } = await supabase
  .from('trades')
  .select('id, symbol, symbol_temp, profit_loss, trade_date, closed_at, created_at')
  .eq('user_id', user!.id)
  .is('deleted_at', null)
  .or(`trade_date.gte.${todayStart},and(trade_date.is.null,closed_at.gte.${todayStart})`)
  .order('closed_at', { ascending: true });
```

Also update the compliance mapper (around line 148) to use `closed_at` as fallback for `timestamp`:
```typescript
timestamp: t.trade_date || t.closed_at || t.created_at,
```

**Also fix `allTrades` query** — select `closed_at` too since those new trades also contribute to total PnL and the current query already works (no date filter), but verify it includes the new trades. It does — no change needed there.

### Files Modified
- `src/hooks/useDynamicRiskEngine.ts` — fix today's trades query to handle null `trade_date`

