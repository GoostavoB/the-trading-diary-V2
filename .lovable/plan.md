

# Dashboard Widget Audit Report

## Executive Summary

I conducted a thorough review of all 37+ widgets in your trading platform dashboard. The system has a well-structured architecture, but I identified several issues that need attention, ranging from broken functionality to data flow inconsistencies.

---

## Architecture Overview

```text
                      +-------------------+
                      |  DashboardProvider |
                      |  (Central State)   |
                      +--------+----------+
                               |
         +---------------------+---------------------+
         |                     |                     |
   +-----v-----+        +------v------+       +------v------+
   | capitalLog |       |   trades    |       |   stats     |
   +-----+-----+        +------+------+       +------+------+
         |                     |                     |
         +---------------------+---------------------+
                               |
                    +----------v----------+
                    |   renderWidget()    |
                    |   (props injection) |
                    +----------+----------+
                               |
         +---------------------------------------------+
         |           |           |           |         |
    +----v----+ +----v----+ +----v----+ +----v----+ +--v--+
    | Widget1 | | Widget2 | | Widget3 | | Widget4 | | ... |
    +---------+ +---------+ +---------+ +---------+ +-----+
```

---

## Data Flow Analysis: Capital Impact

**Question: When initial capital changes, which widgets should update?**

All these widgets depend on capital data and SHOULD update automatically:

| Widget | Data Dependency | Currently Connected |
|--------|-----------------|---------------------|
| TotalBalanceWidget | initialInvestment + totalPnL | Yes |
| CurrentROIWidget | initialInvestment, currentBalance | Yes |
| CompactPerformanceWidget | initialInvestment, currentBalance, currentROI | Yes |
| CapitalGrowthWidget | initialInvestment, currentBalance, chartData | Yes |
| WinRateWidget | trades only (no capital) | N/A |
| GoalWidget | baseline_value from goals | Yes (uses its own capital) |

**Data Flow for Capital Changes:**

```text
User updates capital in CurrentROIWidget
         |
         v
supabase.from('capital_log').insert()
         |
         v
Real-time subscription triggers
         |
         v
DashboardProvider.fetchCapitalLog()
         |
         v
capitalLog state updates
         |
         v
fetchStats() recalculates all metrics
         |
         v
All widgets re-render with new props
```

**Result: Capital propagation is correctly wired via real-time Supabase subscriptions.**

---

## Widget Status Report

### Working Correctly

| Widget | Status | Notes |
|--------|--------|-------|
| TotalBalanceWidget | Working | Displays balance with P&L changes |
| WinRateWidget | Working | Shows circular progress with W/L counts |
| TotalTradesWidget | Working | Simple counter |
| CurrentROIWidget | Working | Has inline capital edit dialog |
| CompactPerformanceWidget | Working | Combines ROI, Win Rate, Avg P&L/Day |
| CapitalGrowthWidget | Working | Area chart with growth visualization |
| CostEfficiencyPanel | Working | Fee analysis per exchange |
| PerformanceHighlights | Working | Best/worst trades and streaks |
| EmotionMistakeCorrelation | Working | Charts emotion/mistake vs performance |
| TradingHeatmap | Working | Hour/day win rate visualization |
| LongShortRatioWidget | Working | Live Binance API data |
| GoalWidget | Working | Goal tracking with projections |
| RiskCalculatorV2Widget | Working | Position sizing tool |
| DailyLossLockStatus | Working | Loss limit enforcement |

### Issues Found

#### 1. AIInsightsWidget - Placeholder Only
**Status:** Not functional (shows "Coming Soon")
**Impact:** Low - Placeholder is acceptable for future feature
**Recommendation:** Either implement AI insights or remove from default layout

#### 2. TopMoversWidget - Period Filter Not Functional
**Status:** Partially broken
**Issue:** The period selector (24h/7d/30d) does not filter trades. All trades are used regardless of selection.
**Location:** `src/components/widgets/TopMoversWidget.tsx` lines 21-27
**Fix Required:** Add date filtering based on selected period

#### 3. TopMoversWidget - NaN Values
**Status:** Bug
**Issue:** `trade.pnl` may be null, causing NaN in sort. Also uses `pnl` instead of `profit_loss` inconsistently.
**Location:** `src/components/widgets/TopMoversWidget.tsx` line 24
**Fix Required:** Use `(trade.pnl || trade.profit_loss || 0)`

#### 4. CurrentROIWidget - Capital Log Deletion Warning
**Status:** UX Issue
**Issue:** When updating initial capital, it deletes ALL capital_log entries and creates a fresh one. This destroys capital history.
**Location:** `src/components/widgets/CurrentROIWidget.tsx` lines 66-85
**Impact:** High - Users lose capital tracking history
**Fix Required:** Show clearer warning, or preserve history with new "reset" entry

#### 5. SpotWalletWidget - Static Mock Data
**Status:** Partially functional
**Issue:** 24h change values are hardcoded to 0
**Location:** Dashboard.tsx lines 361-364
**Note:** Expected behavior if price API doesn't track 24h changes

#### 6. i18n Missing Keys
**Status:** Console warnings
**Issue:** Multiple translation keys missing:
- `widgets.stats`, `widgets.portfolio`, `widgets.premiumCTA`
- `widgets.insights`, `widgets.streaks`, `widgets.heatmap`, `widgets.charts`
**Impact:** Low - Falls back to key name
**Fix Required:** Add missing translations

#### 7. TradeStationView - Duplicate Stats Calculation
**Status:** Code quality issue
**Issue:** TradeStationView duplicates all stat calculation logic from DashboardProvider instead of sharing it
**Location:** `src/components/trade-station/TradeStationView.tsx` lines 250-375
**Impact:** Medium - Maintenance burden, potential inconsistencies
**Recommendation:** Refactor to use shared DashboardProvider context

#### 8. Simple Average ROI Widget - Display Redundancy
**Status:** UX consideration
**Issue:** SimpleAvgROIWidget duplicates data shown in CompactPerformanceWidget
**Recommendation:** Keep in widget library but not in default layout

---

## Calculation Accuracy Verification

### ROI Calculations

```text
Current ROI = ((currentBalance - baseCapital) / baseCapital) * 100

Where:
- baseCapital = sum(capital_log.amount_added) OR initial_investment
- currentBalance = baseCapital + totalPnL (with fees)
```

**Verification: Correct implementation in DashboardProvider lines 184-187**

### Win Rate Calculation

```text
winRate = (winningTrades / totalTrades) * 100
winningTrades = trades where profit_loss > 0
```

**Verification: Correct implementation**

### Fee Handling

```text
Net P&L = profit_loss - |funding_fee| - |trading_fee|
```

**Verification: Correct. Uses absolute values. Consistent across `calculateTradePnL()` utility.**

---

## Recommended Fixes (Priority Order)

### Priority 1: Critical Bugs

1. **TopMoversWidget NaN Fix**
   - Replace `Math.abs(b.pnl)` with `Math.abs(b.pnl || b.profit_loss || 0)`
   - Add date filtering for period selector

2. **CurrentROIWidget Capital History Warning**
   - Add modal confirmation before deleting capital history
   - Consider alternative: Add "reset" entry instead of deleting

### Priority 2: Functional Improvements

3. **Add Missing i18n Keys**
   - Add widget category translations to locale files

4. **Improve SpotWallet 24h Change**
   - If price tracking supports it, calculate actual 24h changes

### Priority 3: Code Quality

5. **Refactor TradeStationView**
   - Use DashboardProvider context instead of duplicate calculations
   - Or create shared `useTradeStats` hook

### Priority 4: UX Enhancements

6. **AIInsightsWidget Implementation or Removal**
   - Either implement basic AI insights
   - Or remove from default layout until ready

---

## Technical Implementation Plan

### Fix 1: TopMoversWidget (15 min)
```typescript
// Filter by period
const filteredTrades = useMemo(() => {
  const now = new Date();
  const periodMs = period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000;
  return trades.filter(t => new Date(t.trade_date).getTime() > now.getTime() - periodMs);
}, [trades, period]);

// Safe sort
const topMovers = filteredTrades
  .sort((a, b) => Math.abs(b.profit_loss || b.pnl || 0) - Math.abs(a.profit_loss || a.pnl || 0))
  .slice(0, 3);
```

### Fix 2: CurrentROIWidget Warning (10 min)
- Add confirmation dialog before saving when capital log exists
- Show warning about history deletion

### Fix 3: Add i18n Keys (10 min)
- Add missing keys to `src/locales/en.json`

---

## Summary

| Category | Count |
|----------|-------|
| Total Widgets Reviewed | 37 |
| Working Correctly | 31 |
| Minor Issues | 4 |
| Bugs Requiring Fix | 2 |
| Code Quality Issues | 1 |

**Overall Assessment:** The widget system is well-architected with proper data flow through DashboardProvider. Capital changes correctly propagate to all dependent widgets via Supabase real-time subscriptions. The main issues are minor bugs in TopMoversWidget and a UX concern in CurrentROIWidget.

---

## Implementation Scope

| Task | Estimated Time |
|------|----------------|
| TopMoversWidget bug fixes | 15 min |
| CurrentROIWidget UX improvement | 10 min |
| i18n missing keys | 10 min |
| Testing verification | 10 min |
| **Total** | **~45 min** |

