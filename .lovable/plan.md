
# Fix Rolling Target Dashboard - Wrong Information

## Problems Identified

After analyzing the data and code, I found **three major issues** causing wrong information in the Rolling Target dashboard:

### Issue 1: initialInvestment Source vs. Actual Capital Log

**Data Discrepancy:**
- `user_settings.initial_investment` = **$1,500**
- `capital_log` entry = **$1,000** (added 2025-12-30)
- First trade opened: **2026-01-27** (almost 1 month after capital log entry)

The widget uses `initialInvestment` from `user_settings` ($1,500), but the actual capital added was $1,000. This creates a **$500 discrepancy** that cascades through all calculations.

### Issue 2: Drift from Plan Calculation is Wrong

**Current formula (lines 336-339):**
```typescript
const totalDrift = dailyData.reduce((sum, d) => sum + d.deviation, 0);
const driftPercent = lastDay.startCapital > 0
  ? (totalDrift / (lastDay.startCapital * dailyData.length)) * 100
  : 0;
```

**Problem:** This sums ALL daily deviations (cumulative) and divides by `lastDay.startCapital × totalDays`, which produces incorrect results. The denominator doesn't represent the proper base for calculating drift percentage.

**Correct formula should be:**
```typescript
// Drift = (Actual Capital - Planned Capital) / Planned Capital × 100
const driftPercent = lastDay.plannedCapital > 0
  ? ((lastDay.endCapital - lastDay.plannedCapital) / lastDay.plannedCapital) * 100
  : 0;
```

### Issue 3: plannedCapital Calculation Uses Day's Start Capital Instead of Compound Target

**Current formula (line 163):**
```typescript
day.plannedCapital = day.startCapital * (1 + p);
```

**Problem:** This calculates "what I should earn TODAY" based on current capital, not "where I should BE according to compound growth from initial investment."

**Correct formula:**
```typescript
// Planned capital should be: Initial × (1 + target%)^days
day.plannedCapital = initialInvestment * Math.pow(1 + p, calendarDaysFromStart + 1);
```

The rolling mode (line 167) already uses this formula correctly for `requiredToday`, but `plannedCapital` used for chart/metrics doesn't.

---

## Solution

### File: `src/components/widgets/RollingTargetWidget.tsx`

**Change 1: Fix plannedCapital calculation (line 163)**

| Before | After |
|--------|-------|
| `day.plannedCapital = day.startCapital * (1 + p);` | `day.plannedCapital = initialInvestment * Math.pow(1 + p, calendarDaysFromStart + 1);` |

**Change 2: Fix driftPercent calculation (lines 336-339)**

| Before | After |
|--------|-------|
| `totalDrift / (lastDay.startCapital × dailyData.length)` | `(lastDay.endCapital - lastDay.plannedCapital) / lastDay.plannedCapital` |

---

## Expected Results After Fix

| Metric | Before (Wrong) | After (Correct) |
|--------|----------------|-----------------|
| Planned Capital | Based on daily start capital | Compound growth from initial |
| Drift from Plan | Cumulative sum / arbitrary base | `(Actual - Planned) / Planned` |
| Chart "Planned" line | Step-function jumps | Smooth exponential curve |

## Files to Modify
- `src/components/widgets/RollingTargetWidget.tsx`

## Technical Summary

The Rolling Target widget is displaying incorrect data because:
1. `plannedCapital` is calculated relative to each day's start capital instead of absolute compound growth target
2. `driftPercent` uses an incorrect denominator that doesn't represent true deviation from plan
3. These compound errors produce values that don't align with actual trading performance vs target curve
