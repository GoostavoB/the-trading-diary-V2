
# Fix Long Short Ratio Chart Flickering and Missing Lines

## Problem Identified

The Long Short Ratio charts are flickering and not displaying lines properly due to **missing animation stability settings**.

### Root Cause

After reviewing the code and a known memory from a previous similar fix:

1. **All 10 Line components in `LongShortRatio.tsx` are missing `isAnimationActive={false}`**
   - The Recharts library re-animates lines on every re-render
   - When data is refreshed or the container resizes, the animation restarts causing visible "flashing"

2. **ResponsiveContainer + Animation = Flickering**
   - The charts use `ResponsiveContainer` which detects size changes
   - Each resize triggers a re-render, which triggers a new animation
   - This creates the visual "blinking" effect

3. **Lazy Loading Compounds the Issue**
   - The component is lazy-loaded via `Suspense` in `LSRContent.tsx`
   - Mount/unmount cycles during tab switches can restart animations

### Evidence

Other charts in the app already have this fix:
- `CapitalGrowthWidget.tsx` line 126: `isAnimationActive={false}`
- `TotalBalanceCard.tsx` line 119: `isAnimationActive={false}`

The `LongShortRatio.tsx` charts do NOT have this property set.

---

## Solution

### File: `src/pages/LongShortRatio.tsx`

Add `isAnimationActive={false}` to all 10 `<Line>` components across the three chart views (Combined, Binance, Bybit).

**Lines to modify:**

| Location | Line | Current | Add |
|----------|------|---------|-----|
| Combined L/S Ratio chart | ~249-255 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Combined Account Distribution (Long) | ~285-291 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Combined Account Distribution (Short) | ~292-298 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Binance L/S Ratio chart | ~397-403 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Binance Account Distribution (Long) | ~433-439 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Binance Account Distribution (Short) | ~440-445 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Bybit L/S Ratio chart | ~550-556 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Bybit Account Distribution (Long) | ~586-592 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |
| Bybit Account Distribution (Short) | ~593-599 | `<Line ... strokeWidth={2} />` | `isAnimationActive={false}` |

**Example change:**

Before:
```tsx
<Line
  type="monotone"
  dataKey="longShortRatio"
  stroke="hsl(var(--neon-blue))"
  name="Avg Long/Short Ratio"
  strokeWidth={2}
/>
```

After:
```tsx
<Line
  type="monotone"
  dataKey="longShortRatio"
  stroke="hsl(var(--neon-blue))"
  name="Avg Long/Short Ratio"
  strokeWidth={2}
  isAnimationActive={false}
/>
```

---

## Files to Modify

- `src/pages/LongShortRatio.tsx` — Add `isAnimationActive={false}` to all Line components

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Chart flickering | Visible blinking on resize/refresh | Static, stable lines |
| Missing lines | Lines disappear during animation reset | Lines always visible |
| Tab switching | Animations restart on each mount | Instant display |

This is the same fix already applied to other charts in the codebase (`CapitalGrowthWidget`, `TotalBalanceCard`) and follows the established pattern for Recharts stability.
