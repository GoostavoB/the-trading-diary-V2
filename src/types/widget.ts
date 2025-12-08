import { LucideIcon } from 'lucide-react';

// Simplified widget sizes: small (1/3 width), medium (2/3 width), large (full width)
export type WidgetSize = 'small' | 'medium' | 'large';

// Legacy numeric sizes for migration
export type LegacyWidgetSize = 1 | 2 | 4 | 6;

// Widget height options: 2, 4, 6 (rows)
export type WidgetHeight = 2 | 4 | 6;

// Legacy size names for compatibility (deprecated)
export type WidgetSizeName = 'small' | 'medium' | 'large' | 'xlarge' | 'tiny';

export interface WidgetLayout {
  i: string; // widget ID
  x: number;
  y: number;
  w: number; // width in grid columns (out of 12)
  h: number; // height in grid rows
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// Widget size configuration for the new 6-subcolumn system
export interface WidgetSizeConfig {
  id: string;
  size: WidgetSize;
  height?: 'small' | 'medium' | 'large'; // Standardized heights
}

export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  icon: LucideIcon;
  defaultSize: WidgetSizeName; // Legacy size name
  defaultLayout?: Pick<WidgetLayout, 'w' | 'h' | 'minW' | 'minH' | 'maxW' | 'maxH'>;
  component: React.ComponentType<WidgetProps>;
  isPremium?: boolean;
  requiresData?: string[]; // Dependencies like 'trades', 'holdings'
}

export interface WidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  onExpand?: () => void;
  // Props that will be passed from Dashboard
  [key: string]: any;
}

export type WidgetCategory =
  | 'trading'
  | 'market'
  | 'portfolio'
  | 'performance'
  | 'insights'
  | 'ai'
  | 'overview';

export interface UserWidgetLayout {
  user_id: string;
  layout: WidgetLayout[];
  updated_at: string;
}

// Size presets mapping to grid columns (fixed 3-column grid)
export const WIDGET_SIZE_TO_COLUMNS: Record<WidgetSize, number> = {
  small: 1,   // 1/3 width
  medium: 2,  //2/3 width
  large: 3,   // Full width
};

// Legacy size mapping for migration
export const LEGACY_SIZE_TO_NEW: Record<LegacyWidgetSize, WidgetSize> = {
  1: 'small',   // 1 subcolumn → small
  2: 'small',   // 2 subcolumns → small
  4: 'medium',  // 4 subcolumns → medium
  6: 'large',   // 6 subcolumns → large
};

// Default widget size configurations (NEW: semantic sizes)
export const WIDGET_SIZE_MAP: Record<string, WidgetSize> = {
  // Small widgets (1/3 width) - KPIs and metrics
  'totalBalance': 'small',
  'winRate': 'small',
  'avgPnLPerDay': 'small',
  'currentROI': 'small',
  'avgPnLPerTrade': 'small',
  'spotWallet': 'small',
  'weightedAvgROI': 'small',
  'totalTrades': 'small',
  'simpleAvgROI': 'small',
  'avgROIPerTrade': 'small',
  'dailyLossLock': 'small',
  'simpleLeverage': 'small',
  'quickActions': 'small',

  // Medium widgets (2/3 width) - Charts and tables
  'goals': 'medium',
  'capitalGrowth': 'medium',
  'topMovers': 'medium',
  'behaviorAnalytics': 'medium',
  'costEfficiency': 'medium',
  'tradingQuality': 'medium',
  'performanceHighlights': 'medium',
  'portfolioOverview': 'medium',
  'recentTransactions': 'medium',
  'riskCalculator': 'medium',
  'errorReflection': 'medium',
  'heatmap': 'medium',
  'longShortRatio': 'medium',

  // Large widgets (full width) - Wide layouts
  'combinedPnLROI': 'large',
  'aiInsights': 'large',
  'emotionMistakeCorrelation': 'large',
  'rollingTarget': 'large',
  'compactPerformance': 'large',
};

// Trade Station widget sizes (NEW: semantic)
export const TRADE_STATION_WIDGET_SIZE_MAP: Record<string, WidgetSize> = {
  'simpleLeverage': 'small',
  'riskCalculator': 'medium',
  'errorReflection': 'medium',
  'rollingTarget': 'large',
};

// Helper functions for widget sizing
export function getDefaultSizeForWidget(widgetId: string, isTradeStation = false): WidgetSize {
  const sizeMap = isTradeStation ? TRADE_STATION_WIDGET_SIZE_MAP : WIDGET_SIZE_MAP;
  return sizeMap[widgetId] || 'medium'; // Default to medium if not found
}

// Migration helper: convert old numeric sizes to new semantic sizes
export function migrateLegacySize(legacySize: LegacyWidgetSize | number): WidgetSize {
  if (legacySize === 1 || legacySize === 2) return 'small';
  if (legacySize === 4) return 'medium';
  if (legacySize === 6) return 'large';
  return 'medium'; // Default fallback
}

export function getDefaultHeightForWidget(widgetId: string, size?: WidgetSize): WidgetHeight {
  // Small widgets always have height 2
  const widgetSize = size ?? getDefaultSizeForWidget(widgetId);
  if (widgetSize === 'small') {
    return 2;
  }

  // Large widgets get height 4
  const largeWidgets = ['portfolioOverview', 'rollingTarget', 'behaviorAnalytics', 'aiInsights', 'emotionMistakeCorrelation'];
  if (largeWidgets.includes(widgetId)) {
    return 4;
  }

  // Default height for medium widgets
  return 2;
}

// Backward compatibility: export available widget sizes
export const WIDGET_SIZES: WidgetSize[] = ['small', 'medium', 'large'];
