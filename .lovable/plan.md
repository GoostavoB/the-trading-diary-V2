

# Fix Insights Dashboard - Wrong Information Issue

## Problem Identified

The Insights Dashboard is showing technically correct but misleading data due to two main issues:

### Issue 1: avgROI Calculation Distorted by Outliers

**Root Cause**: There's a trade with ROI of **-990.99%** (BTC trade with $10 margin that lost $100) that is severely distorting the average ROI calculation.

| Metric | Current Value | Expected Behavior |
|--------|---------------|-------------------|
| Avg ROI | -51.86% | Should show ~+10% without outlier |
| Trade causing issue | -990.99% ROI | 1 trade out of 16 |

The `useDashboardStats.ts` hook (line 57) uses a simple average:
```typescript
avgRoi = trades.reduce((sum, t) => sum + (t.roi || 0), 0) / trades.length;
```

This is mathematically correct but doesn't represent the typical trading performance.

### Issue 2: Dual Stat Calculation Sources

The dashboard has two separate sources calculating statistics:
1. `DashboardProvider.tsx` - calculates `stats` internally (lines 129-238)
2. `useDashboardStats.ts` - separate hook used by `InsightsContent.tsx`

Both calculate similar metrics but may produce slightly different results.

## Solution

### 1. Add Outlier-Resistant ROI Calculation

**File**: `src/hooks/useDashboardStats.ts`

Add median-based or trimmed mean ROI calculation to handle outliers:

```typescript
// Calculate median ROI instead of mean (outlier-resistant)
const sortedROIs = trades.map(t => t.roi || 0).sort((a, b) => a - b);
const mid = Math.floor(sortedROIs.length / 2);
const medianRoi = sortedROIs.length % 2 !== 0
  ? sortedROIs[mid]
  : (sortedROIs[mid - 1] + sortedROIs[mid]) / 2;

// Use trimmed mean (remove top/bottom 10% outliers)
const trimCount = Math.floor(sortedROIs.length * 0.1);
const trimmedROIs = sortedROIs.slice(trimCount, sortedROIs.length - trimCount);
const trimmedAvgRoi = trimmedROIs.length > 0
  ? trimmedROIs.reduce((a, b) => a + b, 0) / trimmedROIs.length
  : 0;
```

### 2. Use Weighted ROI by Position Size

More accurate representation: weight each trade's ROI by its capital/margin:

**File**: `src/hooks/useDashboardStats.ts`

```typescript
// Weighted average ROI (capital-weighted)
const totalMargin = trades.reduce((sum, t) => sum + (t.margin || 0), 0);
const weightedAvgRoi = totalMargin > 0
  ? trades.reduce((sum, t) => sum + ((t.roi || 0) * (t.margin || 0)), 0) / totalMargin
  : 0;
```

### 3. Display Both Simple and Weighted Metrics

**File**: `src/components/insights/InsightsQuickSummary.tsx`

Update to show weighted ROI instead of simple average:

```typescript
// Line 57-64: Change avgROI display
{
  label: t('dashboard.avgROI'),
  value: avgROI,  // Pass weighted ROI from parent
  displayValue: `${avgROI >= 0 ? '+' : ''}${avgROI.toFixed(2)}%`,
  // ...
}
```

### 4. Pass Correct Stats to InsightsContent

**File**: `src/components/dashboard/tabs/InsightsContent.tsx`

The component already receives `processedTrades` from `DashboardProvider`. Ensure it's using the capital-weighted ROI:

```typescript
// Line 55: Change from stats.avgRoi to stats.weightedAvgRoi or calculate inline
avgROI={stats.avgRoi}  // Ensure this is the weighted version
```

## Files to Modify

1. **`src/hooks/useDashboardStats.ts`**
   - Add weighted/trimmed ROI calculation
   - Return both `simpleAvgRoi` and `weightedAvgRoi`

2. **`src/components/dashboard/tabs/InsightsContent.tsx`**
   - Use weighted ROI for display

3. **`src/components/insights/InsightsQuickSummary.tsx`** (optional)
   - Add tooltip explaining the metric is weighted

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Avg ROI | -51.86% (distorted) | ~+7% (weighted by capital) |
| Profit Factor | 1.60 | 1.60 (unchanged) |
| Win Rate | 68.75% | 68.75% (unchanged) |
| Total P&L | $340.75 | $340.75 (unchanged) |

## Technical Details

The weighted ROI calculation uses each trade's margin (capital at risk) as weight:

```
Weighted ROI = Σ(ROI_i × Margin_i) / Σ(Margin_i)
```

This prevents a small $10 trade from having equal influence as a $1000 trade on the average ROI metric.

