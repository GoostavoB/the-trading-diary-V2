

## Analysis: Goals Page Numbers

### Current State
- **1 goal** in database: "Way to 10k" (profit target = $10,000)
- `current_value` in database = **$0** (never updated)
- Actual trades since goal start (Apr 6): 3 trades, gross PnL = $101.66, fees = $5.43
- **Correct current value should be ~$96.23** (net) or $101.66 (gross)

### Problem Found
The **Goals.tsx page** reads `current_value` directly from the `trading_goals` table, which is always **$0** because nothing updates it. The page shows:
- Progress: **0%** (wrong — should be ~1%)
- Current: **$0** (wrong — should be ~$96)
- Stats cards (Active/Completed/Overdue/Progress): all based on stale DB value

Meanwhile, the **GoalWidget** component (used inside the GoalsContent dashboard tab) correctly recalculates values dynamically using the `get_trading_analytics` RPC and trade data. This creates an inconsistency — different numbers depending on where you view goals.

### Root Cause
`Goals.tsx` uses raw `goal.current_value` from the database. The `GoalWidget` recalculates it on the fly. The database `current_value` column is never written to after goal creation.

### Fix Plan

**File: `src/pages/Goals.tsx`**
1. Add the same dynamic calculation logic that `GoalWidget` uses — query trades filtered by each goal's `baseline_date`/`period_start`/`period_end`, compute real PnL, and override `current_value` before rendering
2. Extract the calculation into a shared hook (e.g. `useGoalCurrentValues`) to avoid duplication between `Goals.tsx` and `GoalWidget`
3. Update the stats cards (Active Goals, Completed, Overdue, Total Progress) to use the recalculated values

**New file: `src/hooks/useGoalCurrentValues.ts`**
- Accept an array of goals + user ID
- For each goal, determine the date range from `calculation_mode`, `baseline_date`, `period_start`, `period_end`
- Query trades within that range, compute PnL (respecting `includeFeesInPnL`)
- Return a map of `goalId → currentValue`

**File: `src/components/goals/GoalWidget.tsx`**
- Refactor to use the shared `useGoalCurrentValues` hook instead of its inline calculation (lines 96-202)

### Result
- Goals page and GoalWidget will show identical, correct numbers
- Stats cards will reflect real progress
- No more stale `current_value = 0` display

### Files Modified
- `src/hooks/useGoalCurrentValues.ts` — new shared hook
- `src/pages/Goals.tsx` — use hook for real values
- `src/components/goals/GoalWidget.tsx` — refactor to use shared hook

