

## Plan: Move Rolling Target to Command Center & Long Short Ratio to Trade Station

### What changes

1. **CommandCenterContent.tsx** — Add Rolling Target widget as a full-width row at the bottom
   - Import `RollingTargetWidget`
   - Add a new `col-span-3` row after Goals/Transactions
   - Adjust `gridTemplateRows` to `'auto 1fr 1fr auto'` to accommodate the new row
   - Pass `processedTrades` and `initialInvestment` as props

2. **TradeStationContent.tsx** — Add Long Short Ratio widget as a full-width row below the two calculators
   - Import `LongShortRatioWidget`
   - Change desktop layout from a simple 2-col grid to a vertical structure: top row = 2 calculators side-by-side, bottom row = full-width LSR widget
   - Mobile: add LSR widget as a third stacked card

3. **No removal of standalone tabs** — The dedicated Rolling Target and LSR tabs remain untouched (they serve as expanded/detailed views). This only adds these widgets into the respective dashboard tabs.

### Layout details

**Command Center (desktop)**:
```text
┌─────────────────────────────────┐
│         Compact KPI Row         │ auto
├──────────────────────┬──────────┤
│   Capital Growth     │  Movers  │ 1fr
├──────────────────────┬──────────┤
│      Goals           │  Recent  │ 1fr
├─────────────────────────────────┤
│     Rolling Target (full)       │ 1fr
└─────────────────────────────────┘
```

**Trade Station (desktop)**:
```text
┌───────────────┬─────────────────┐
│ Risk Calc     │  Leverage Calc  │ 1fr
├───────────────┴─────────────────┤
│   Long Short Ratio (full)       │ 1fr
└─────────────────────────────────┘
```

### Files modified
- `src/components/dashboard/tabs/CommandCenterContent.tsx`
- `src/components/dashboard/tabs/TradeStationContent.tsx`

