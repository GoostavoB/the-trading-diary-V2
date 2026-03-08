
# Remove AI Trading Assistant - Complete Removal Plan

## Summary

Remove the AI Trading Assistant feature entirely, including:
- The floating bot button on the dashboard
- The AIAssistant component and its context
- The ExplainMetricButton components that trigger AI explanations
- The AI Tools page (/ai-tools route)
- Related navigation links
- Related edge functions

---

## Files to Delete

| File | Description |
|------|-------------|
| `src/components/AIAssistant.tsx` | Main floating bot button + chat sheet |
| `src/contexts/AIAssistantContext.tsx` | Context provider for AI assistant state |
| `src/components/ExplainMetricButton.tsx` | "Ask AI" button on metrics |
| `src/pages/AITools.tsx` | AI Tools page with Analysis, Patterns, Psychology, etc. |
| `supabase/functions/ai-chat/` | Edge function for AI chat |
| `supabase/functions/ai-dashboard-assistant/` | Edge function for dashboard AI |
| `supabase/functions/ai-widget-clarify/` | Edge function for widget clarification |

---

## Files to Modify

### 1. `src/App.tsx`
**Remove:**
- Import of `AIAssistantProvider` (line 9)
- Import of lazy `AITools` page (line 55)
- `<AIAssistantProvider>` wrapper (lines 263, 272)
- Route `/ai-tools` (line 195)

### 2. `src/pages/Dashboard.tsx`
**Remove:**
- Import of `AIAssistant` (line 67)
- `<AIAssistant />` render (lines 660-662)

### 3. `src/components/SidebarQuickLinks.tsx`
**Remove:**
- Navigation link to `/ai-tools` (line 17)

### 4. `src/components/GlobalSearch.tsx`
**Remove:**
- Search result entry for 'ai-tools' (lines 117-125)

### 5. Components using `useAIAssistant` and `ExplainMetricButton`
Remove AI-related imports and button usage from these files:
- `src/components/insights/InsightsQuickSummary.tsx`
- `src/components/TopMoversCard.tsx`
- `src/components/TotalBalanceCard.tsx`
- `src/components/TradingStreaks.tsx`
- `src/components/CurrentStreakCard.tsx`
- `src/components/MaxDrawdownCard.tsx`
- `src/components/StatCard.tsx`
- `src/components/PerformanceInsights.tsx`
- `src/components/TradingHeatmap.tsx`
- `src/components/RecentTransactionsCard.tsx`
- `src/components/charts/AssetPerformanceRadar.tsx`
- `src/components/charts/WinsByHourChart.tsx`

### 6. `src/components/KeyboardShortcutsHelp.tsx`
**Remove:**
- AI Assistant category from keyboard shortcuts (lines 40-44)

---

## Technical Details

### Changes per component (example pattern)

**Before:**
```tsx
import { ExplainMetricButton } from '@/components/ExplainMetricButton';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

const Component = () => {
  const { openWithPrompt } = useAIAssistant();
  return (
    <ExplainMetricButton onExplain={openWithPrompt} ... />
  );
};
```

**After:**
```tsx
// Remove imports and ExplainMetricButton usage entirely
const Component = () => {
  return (
    // Component without AI button
  );
};
```

---

## Edge Functions to Delete

These edge functions will be deleted from the deployed environment:
1. `ai-chat`
2. `ai-dashboard-assistant` 
3. `ai-widget-clarify`

Note: Other AI-related edge functions (`ai-generate-report`, `ai-pattern-recognition`, etc.) are used by the AITools page components, so they will also become unused and can be deleted.

---

## Impact

| Area | Change |
|------|--------|
| Dashboard | Floating bot button removed |
| Metric cards | "Ask AI" help buttons removed |
| Navigation | /ai-tools link removed from sidebar |
| Search | AI Tools removed from global search |
| Keyboard shortcuts | Alt+I shortcut removed |
| Bundle size | Reduced (fewer components/dependencies) |

---

## Files Count

- **Delete**: 7+ files (components, context, page, edge functions)
- **Modify**: 15+ files (remove imports and usage)

