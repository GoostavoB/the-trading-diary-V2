

## Plan: Add Explanatory Tooltips to Every DRE Metric

### Goal
Add tooltips to each number/metric in the DRE tab so the user understands exactly where each value comes from and how it's calculated.

### Changes

**File: `src/components/dashboard/tabs/DREContent.tsx`**

Import `MetricTooltip` (already exists at `src/components/MetricTooltip.tsx`) and wrap each metric label with it:

1. **Saldo Inicial** — Tooltip: "Comes from your Initial Investment setting (user_settings). Click to edit manually for this session. Default: $500."

2. **Meta Diária** — Tooltip: "Calculated as 5% of your Initial Balance. Formula: Initial Balance × 0.05"

3. **PnL Hoje** — Tooltip: "Sum of all profit/loss from today's trades (trades table, filtered by today's date)."

4. **PRÓXIMO TRADE - STOP MÁXIMO** — Tooltip: "Maximum allowed stop loss based on your current tier. Calculated as Surplus × Tier Risk %. If in Protection zone, risk = $0."

5. **Excedente** — Tooltip: "Surplus above your daily goal. Formula: Today's PnL − Daily Goal ($25). Determines your risk tier."

6. **Curva de Risco** — Tooltip: "Visual gauge of your surplus position across the 5 risk tiers: Protection (<$10), Aggressive ($10-50), Moderate ($50-150), Conservative ($150-500), Institutional ($500+)."

7. **Health Check trades** — The "max:" label already exists per trade; add a small tooltip on the header explaining: "Each trade is checked against the allowed risk at the time it was placed. Green = respected DRE limits. Red = violated."

### Implementation
- Use the existing `MetricTooltip` component with `variant="info"` and `side` appropriate to each position
- Wrap each `<p className="text-muted-foreground text-[10px]">` label with a MetricTooltip
- Keep the layout compact — use the inline icon variant (small info icon next to the label)
- No new dependencies needed

### Files Modified
- `src/components/dashboard/tabs/DREContent.tsx` — add MetricTooltip imports and wrap 7 metric labels

