import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WidgetId = 
  | 'win-rate'
  | 'total-profit'
  | 'current-roi'
  | 'total-trades'
  | 'lsrMarketData'
  | 'openInterestChart'
  | 'goals';

// Map catalog widget IDs to pinned widget IDs
export const CATALOG_TO_PINNED_MAP: Record<string, WidgetId> = {
  'winRate': 'win-rate',
  'absoluteProfit': 'total-profit',
  'currentROI': 'current-roi',
  'totalTrades': 'total-trades',
  'lsrMarketData': 'lsrMarketData',
  'openInterestChart': 'openInterestChart',
  'goals': 'goals',
};

interface PinnedWidgetsContextType {
  pinnedWidgets: WidgetId[];
  isPinned: (widgetId: WidgetId) => boolean;
  togglePin: (widgetId: WidgetId) => void;
  pinWidget: (widgetId: WidgetId) => void;
  unpinWidget: (widgetId: WidgetId) => void;
}

const PinnedWidgetsContext = createContext<PinnedWidgetsContextType | undefined>(undefined);

const DEFAULT_PINNED_WIDGETS: WidgetId[] = [
  'win-rate',
  'total-profit',
  'current-roi',
  'total-trades'
];

const STORAGE_KEY = 'pinned-widgets';

export function PinnedWidgetsProvider({ children }: { children: ReactNode }) {
  const [pinnedWidgets, setPinnedWidgets] = useState<WidgetId[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PINNED_WIDGETS;
      }
    }
    return DEFAULT_PINNED_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedWidgets));
  }, [pinnedWidgets]);

  const isPinned = (widgetId: WidgetId) => pinnedWidgets.includes(widgetId);

  const togglePin = (widgetId: WidgetId) => {
    setPinnedWidgets(prev => 
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const pinWidget = (widgetId: WidgetId) => {
    setPinnedWidgets(prev => 
      prev.includes(widgetId) ? prev : [...prev, widgetId]
    );
  };

  const unpinWidget = (widgetId: WidgetId) => {
    setPinnedWidgets(prev => prev.filter(id => id !== widgetId));
  };

  return (
    <PinnedWidgetsContext.Provider
      value={{
        pinnedWidgets,
        isPinned,
        togglePin,
        pinWidget,
        unpinWidget,
      }}
    >
      {children}
    </PinnedWidgetsContext.Provider>
  );
}

export function usePinnedWidgets() {
  const context = useContext(PinnedWidgetsContext);
  if (!context) {
    throw new Error('usePinnedWidgets must be used within PinnedWidgetsProvider');
  }
  return context;
}
