

# Dashboard Tab Reorganization: Above-the-Fold Compact Layout

## Problem Analysis

The current dashboard has several issues preventing a compact, above-the-fold layout:

1. **Too many widgets on one tab**: The Command Center (Overview) tries to display 12+ widgets, causing inevitable scrolling
2. **No viewport-height constraint**: The grid doesn't enforce `100vh` bounds
3. **Current tabs structure**:
   - Trade Station (tools)
   - Command Center (performance widgets - overcrowded)
   - Insights (analytics - separate page view)
   - Trade History (journal)

4. **Reference image analysis**: The example shows:
   - Top row: 5 compact KPI chips (Net P&L, Trade Expectancy, Profit Factor, Win/Loss Trade, Win Rate)
   - Second row: 3 medium widgets (Score radar chart, Cumulative P&L chart, Daily P&L bars)
   - Third row: 2 medium widgets (Open Positions table, Calendar heatmap)
   - Total: ~10 widgets fitting above the fold with no scroll

## Solution: 5-Tab Organization with Viewport-Locked Layouts

### New Tab Structure

| Tab | Purpose | Max Widgets | Focus |
|-----|---------|-------------|-------|
| **Trade Station** | Daily trading tools | 4-6 | Risk calc, leverage, loss lock, quick actions |
| **Command Center** | Core KPIs & charts | 6-8 | Balance, ROI, Win Rate, Capital Growth, Top Movers |
| **Behavior** | Psychology & patterns | 4-6 | Emotions, mistakes, heatmap, quality metrics |
| **Insights** | Deep analytics | 4-6 | Cost efficiency, highlights, behavior analytics |
| **Trade History** | Journal & records | 1 (full page) | Trade table |

### Widget Distribution

**Trade Station (Tools Tab)**
```text
┌─────────────┬─────────────┬─────────────┐
│ Risk Calc   │ Loss Lock   │ Leverage    │
│ (medium)    │ (small)     │ (small)     │
├─────────────┴─────────────┴─────────────┤
│     Long/Short Ratio (full width)       │
└─────────────────────────────────────────┘
```

**Command Center (Performance Tab)**
```text
┌──────┬──────┬──────┬──────┬──────┐
│ P&L  │ ROI  │ Win% │Trades│Streak│  ← KPI Row (5 compact chips)
├──────┴──────┴──────┴──────┴──────┤
│ Capital Growth Chart │ Top Movers│  ← Chart Row
├──────────────────────┴───────────┤
│        Goals Progress            │  ← Goals Row
└──────────────────────────────────┘
```

**Behavior Analytics Tab**
```text
┌─────────────────────────────────────────┐
│   Emotion & Mistake Correlation         │
├─────────────────────┬───────────────────┤
│   Trading Heatmap   │ Quality Metrics   │
└─────────────────────┴───────────────────┘
```

**Insights Tab**
```text
┌─────────────────────────────────────────┐
│        Performance Highlights           │
├─────────────────────┬───────────────────┤
│   Cost Efficiency   │ Behavior Patterns │
└─────────────────────┴───────────────────┘
```

## Technical Implementation

### 1. Update Tab Types and Structure

**File: `src/components/dashboard/DashboardTabs.tsx`**
- Add new tab type: `'behavior'`
- Update icons to match new tab purposes

**File: `src/pages/Dashboard.tsx`**
- Add 5th tab for "Behavior Analytics"
- Create dedicated content components for each tab
- Lock grid height to viewport: `max-h-[calc(100vh-180px)] overflow-hidden`

### 2. Create New Tab Content Components

**New File: `src/components/dashboard/tabs/CommandCenterContent.tsx`**
- Compact KPI row with 5 small stat chips
- Capital Growth chart (medium width)
- Top Movers + Goals (compact)
- Viewport-locked height

**New File: `src/components/dashboard/tabs/BehaviorContent.tsx`**
- Emotion/Mistake correlation widget
- Trading heatmap
- Quality metrics
- Viewport-locked height

### 3. Update Grid System for Fixed Height

**File: `src/components/dashboard/SimplifiedDashboardGrid.tsx`**
```typescript
// Add viewport height constraint
style={{
  gridAutoRows: 'minmax(0, 1fr)', // Flex rows
  maxHeight: 'calc(100vh - 200px)', // Viewport lock
  overflow: 'hidden',
}}
```

### 4. Create Compact KPI Row Component

**New File: `src/components/widgets/CompactKPIRow.tsx`**
A horizontal row of 5 compact KPI chips matching the reference design:
- Net P&L
- ROI %
- Win Rate
- Total Trades
- Current Streak

Each chip: icon + value + label, minimal padding, no card borders

### 5. Widget Catalog Updates

**File: `src/config/widgetCatalog.ts`**
- Define default layouts per tab
- Add tab assignment to widget configs

### 6. Tab-Specific Default Layouts

```typescript
// Command Center defaults (8 widgets max)
export const COMMAND_CENTER_LAYOUT = [
  'compactKPIs', // New compact row component
  'capitalGrowth',
  'topMovers', 
  'goals',
];

// Behavior Tab defaults (4 widgets)
export const BEHAVIOR_TAB_LAYOUT = [
  'emotionMistakeCorrelation',
  'heatmap',
  'tradingQuality',
];

// Trade Station defaults (5 widgets)
export const TRADE_STATION_LAYOUT = [
  'riskCalculator',
  'dailyLossLock',
  'simpleLeverage',
  'longShortRatio',
];
```

## Implementation Files

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Dashboard.tsx` | Edit | Add 5th tab, update TabsList grid |
| `src/components/dashboard/tabs/CommandCenterContent.tsx` | Create | Compact performance dashboard |
| `src/components/dashboard/tabs/BehaviorContent.tsx` | Create | Behavior analytics tab |
| `src/components/widgets/CompactKPIRow.tsx` | Create | Horizontal KPI strip |
| `src/components/dashboard/SimplifiedDashboardGrid.tsx` | Edit | Viewport lock |
| `src/config/widgetCatalog.ts` | Edit | Tab-specific layouts |

## Visual Result

After implementation:

```text
┌─────────────────────────────────────────────────────────────┐
│ [Trade Station] [Command Center] [Behavior] [Insights] [History] │
├─────────────────────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │
│ │ +$248 │ │ +12%  │ │ 62%   │ │ 156   │ │ 4W    │          │ ← KPI Row
│ │ P&L   │ │ ROI   │ │ Win   │ │Trades │ │Streak │          │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘          │
│ ┌────────────────────────┐ ┌──────────────────┐            │
│ │                        │ │    Top Movers    │            │ ← Charts
│ │    Capital Growth      │ ├──────────────────┤            │
│ │        Chart           │ │   Recent Trades  │            │
│ │                        │ │                  │            │
│ └────────────────────────┘ └──────────────────┘            │
│ ┌──────────────────────────────────────────────┐           │
│ │              Goals Progress                  │           │ ← Goals
│ └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                    ↑ NO SCROLL - All above the fold
```

## Summary

| Change | Before | After |
|--------|--------|-------|
| Tabs | 4 tabs | 5 tabs |
| Widgets per tab | 12+ | 4-8 |
| Scroll required | Yes | No (viewport locked) |
| KPI display | Individual cards | Compact chip row |
| Height behavior | Auto-expand | Fixed to viewport |

