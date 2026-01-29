
# Fix Translation Keys and Restructure Insights Tab

## Issues Identified

### Issue 1: Translation Key Display ("dashboard.totalPnL")
The label shows the raw translation key instead of translated text because multiple translation files have **duplicate `"dashboard"` keys**. When JSON is parsed, the second occurrence overwrites the first, causing keys like `totalPnL`, `profitFactor`, and `avgROI` to be lost.

**Affected files:**
| File | Problem |
|------|---------|
| `es/translation.json` | Two `dashboard` keys (line 261 and 485) |
| `pt/translation.json` | Two `dashboard` keys (line 261 and 485) |
| `ar/translation.json` | Two `dashboard` keys (line 165 and 451) |
| `en/translation.json` | Two `dashboard` keys (line 606 and 858) - but works because second has all needed keys |

### Issue 2: Rolling Target in Insights Tab
User wants Rolling Target removed from Insights and placed in its own standalone tab.

### Issue 3: Potentially Incorrect Numbers
Based on analysis of the network data, the numbers appear correct when accounting for trading fees:
- Total P&L ($394): Sum of profit_loss minus fees = ~$395 (correct)
- Win Rate (85.7%): 6 out of 7 trades are net profitable after fees (correct)
- Trade 7 (ADAUSDT): profit_loss $5.64 - trading_fee $11.42 = -$5.78 (net loss)

The metrics are correctly calculated using net P&L (after fees), but the labels are not showing due to the translation issue.

---

## Solution Plan

### Step 1: Merge Duplicate Translation Keys
For each affected translation file, merge the two `dashboard` sections into one complete section containing all required keys:

**Required keys for InsightsQuickSummary:**
- `totalPnL`
- `winRate`
- `profitFactor`
- `avgROI`
- `totalTrades`

**Files to modify:**

1. **`src/locales/es/translation.json`**
   - Delete first `dashboard` block (lines 261-267)
   - Add missing keys (`totalPnL`, `profitFactor`, `avgROI`, `avgProfit`) to second `dashboard` block (line 485)

2. **`src/locales/pt/translation.json`**
   - Same structure as Spanish

3. **`src/locales/ar/translation.json`**
   - Delete first `dashboard` block (lines 165-...)
   - Add missing keys to second `dashboard` block (line 451)

4. **`src/locales/vi/translation.json`**
   - Check for duplicates and merge if needed

### Step 2: Create New Rolling Target Tab

**New file:** `src/components/dashboard/tabs/RollingTargetContent.tsx`

```typescript
// Structure:
// - Uses useDashboard() to get processedTrades, initialInvestment
// - Full-height container: calc(100vh - 220px)
// - Renders RollingTargetWidget with proper props
```

### Step 3: Update Dashboard Tabs

**File:** `src/pages/Dashboard.tsx`

Changes:
- Import new `RollingTargetContent` component
- Add 7th tab: "Target" between "Insights" and "Trade History"
- Update grid from `grid-cols-6` to `grid-cols-7`
- Add new `TabsTrigger` for "target"
- Add new `TabsContent` for "target" rendering `RollingTargetContent`

**New tab order:**
1. Trade Station
2. Command Center
3. Behavior
4. Errors
5. Insights
6. **Target** (NEW)
7. Trade History

### Step 4: Simplify Insights Tab Layout

**File:** `src/components/dashboard/tabs/InsightsContent.tsx`

Changes:
- Remove `RollingTargetWidget` import and usage
- Remove `SmartWidgetWrapper` for rollingTarget
- Desktop: Change 3-column grid to 2-column grid
- Mobile: Remove Rolling Target section

**Updated desktop layout:**
```text
+----------------------------+----------------------------+
|                            |                            |
|   Performance Highlights   |   Trading Quality Metrics  |
|       (full height)        |        (50% height)        |
|                            |----------------------------+
|                            |                            |
|                            |    Behavior Analytics      |
|                            |        (50% height)        |
+----------------------------+----------------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/tabs/RollingTargetContent.tsx` | New tab content component for Rolling Target |

## Files to Modify

| File | Changes |
|------|---------|
| `src/locales/es/translation.json` | Merge duplicate dashboard keys |
| `src/locales/pt/translation.json` | Merge duplicate dashboard keys |
| `src/locales/ar/translation.json` | Merge duplicate dashboard keys |
| `src/locales/vi/translation.json` | Check and merge if needed |
| `src/pages/Dashboard.tsx` | Add 7th "Target" tab |
| `src/components/dashboard/tabs/InsightsContent.tsx` | Remove Rolling Target, simplify to 2-column layout |

---

## Expected Results

After implementation:
1. All translation keys (e.g., `dashboard.totalPnL`) will display proper translated text
2. Rolling Target will have its own dedicated full-page tab
3. Insights tab will have a cleaner 2-column layout
4. No widgets will be cut off
5. All metrics will display correctly with proper labels
