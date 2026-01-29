
# Fix Translation Keys - Merge Duplicate Dashboard Sections

## Problem Identified
The translation files have **duplicate `"dashboard"` keys** causing translations to fail:

| File | First `dashboard` | Second `dashboard` | Result |
|------|-------------------|-------------------|--------|
| English | Line 606 (has `totalPnL`) | Line 858 (missing `totalPnL`) | Second overwrites first, `totalPnL` lost |
| Spanish | Similar structure | Similar structure | Same issue |
| Portuguese | Similar structure | Similar structure | Same issue |
| Arabic | Similar structure | Similar structure | Same issue |
| Vietnamese | Similar structure | Similar structure | Same issue |

This causes `t('dashboard.totalPnL')` to return the raw key instead of "Total P&L".

## Solution
Merge both `dashboard` sections into ONE section containing all required keys in each translation file.

## Files to Modify

### 1. `src/locales/en/translation.json`
- Delete first `dashboard` block (lines 606-612)
- Ensure second `dashboard` block (line 858) includes ALL required keys:
  - `totalPnL: "Total P&L"` (missing, must add)
  - `avgProfit: "Avg Profit"` (missing, must add)
  - `marketSentiment: "Market Sentiment"` (missing, must add)

### 2. `src/locales/es/translation.json`
- Same merge operation - ensure single `dashboard` block with all keys

### 3. `src/locales/pt/translation.json`
- Same merge operation - ensure single `dashboard` block with all keys

### 4. `src/locales/ar/translation.json`
- Same merge operation - ensure single `dashboard` block with all keys

### 5. `src/locales/vi/translation.json`
- Same merge operation - ensure single `dashboard` block with all keys

## Required Keys for InsightsQuickSummary
The merged `dashboard` section must include:
- `totalPnL`
- `winRate`
- `profitFactor`
- `avgROI`
- `totalTrades`
- Plus all other existing dashboard keys

## Technical Changes

For each file:
1. Identify both `dashboard` sections
2. Remove the first `dashboard` block entirely
3. Add missing keys to the second `dashboard` block
4. Verify no duplicate keys within the merged section

## Expected Result
After this fix:
- `t('dashboard.totalPnL')` will display "Total P&L" instead of the raw key
- All metric labels in InsightsQuickSummary will show proper translated text
- No duplicate JSON keys causing override issues
