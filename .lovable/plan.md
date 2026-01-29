
# Fix Rolling Target Widget Overlapping Layout

## Problem
In the Rolling Target tab, the chart Y-axis labels (`$0k`, `$1k`, `$2k`) overlap with the Summary Metrics section below (Current Status, Drift from Plan, Success Rate, Avg Daily Capital Growth).

**Root Cause**: The chart container at line 637 (`h-32`) has no bottom margin, and the Y-axis labels extend outside the chart bounds, visually colliding with the metrics grid below.

## Solution

### File: `src/components/widgets/RollingTargetWidget.tsx`

**Changes to make:**

1. **Add bottom margin to chart container** (line 637)
   - Current: `<div className="h-32 w-full">`
   - Fix: `<div className="h-32 w-full mb-6">`
   - Adds `mb-6` (24px) margin between chart and metrics

2. **Increase chart height for better readability** (line 637)
   - Change from `h-32` (128px) to `h-40` (160px)
   - Gives more vertical space for Y-axis labels

3. **Add left padding to metrics grid** (line 693)
   - Current: `<div className="grid grid-cols-2 md:grid-cols-4 gap-4">`
   - Fix: `<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">`
   - Adds top padding to create visual separation

4. **Increase Y-axis width in chart** (line 653-658)
   - Add `width={40}` prop to `YAxis` to ensure tick labels don't overflow
   - This ensures `$0k`, `$1k`, `$2k` labels have adequate space

## Summary of Changes

| Line | Current | New |
|------|---------|-----|
| 637 | `h-32 w-full` | `h-40 w-full mb-6` |
| 653 | `<YAxis ...` | `<YAxis width={45} ...` |
| 693 | `grid grid-cols-2 md:grid-cols-4 gap-4` | `grid grid-cols-2 md:grid-cols-4 gap-4 pt-2` |

## Files to Modify
- `src/components/widgets/RollingTargetWidget.tsx`

## Expected Result
- Chart Y-axis labels no longer overlap with metrics section
- Clear visual separation between chart and summary stats
- "Current Status" / "Ahead" text displays cleanly without any overlap
