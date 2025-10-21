import { LucideIcon } from 'lucide-react';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

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

export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  icon: LucideIcon;
  defaultSize: WidgetSize;
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

// Size presets for common widget dimensions
export const WIDGET_SIZES: Record<WidgetSize, Pick<WidgetLayout, 'w' | 'h'>> = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 12, h: 4 },
  xlarge: { w: 12, h: 6 },
};
