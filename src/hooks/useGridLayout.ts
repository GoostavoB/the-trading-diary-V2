import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WIDGET_SIZE_MAP } from '@/types/widget';
import { toGridWidgets, resolveLayoutCollisions, GridWidget } from '@/utils/gridValidator';
import { DEFAULT_DASHBOARD_LAYOUT, WIDGET_CATALOG } from '@/config/widgetCatalog';

export interface WidgetPosition {
  id: string;
  column: number; // 0-5 (6 subcolumns total)
  row: number;
  size: 1 | 2 | 4 | 6; // Widget size in subcolumns
  height: 2 | 4 | 6; // Widget height in rows
}

export interface LayoutData {
  mode: 'adaptive' | 'fixed';
  positions: WidgetPosition[];
  order: string[];
  columnCount?: number;
  version?: number;
}

/**
 * Generate default positions dynamically from DEFAULT_DASHBOARD_LAYOUT
 * This ensures Force Reset always uses the latest widget configuration
 */
const generateDefaultPositions = (): WidgetPosition[] => {
  return DEFAULT_DASHBOARD_LAYOUT.map((widgetId, index) => {
    const widget = WIDGET_CATALOG[widgetId];

    if (!widget) {
      console.warn(`[useGridLayout] Widget not found in catalog: ${widgetId}`);
      return {
        id: widgetId,
        column: 0,
        row: index,
        size: 4 as 1 | 2 | 4 | 6,
        height: 2 as 2 | 4 | 6,
      };
    }

    const defaultSize = widget.defaultSize || 'medium';

    // Convert size string to number (using 6-column grid)
    const sizeMap: Record<string, 1 | 2 | 4 | 6> = {
      tiny: 1,
      small: 2,
      medium: 4,
      large: 6,
      xlarge: 6,
    };

    return {
      id: widgetId,
      column: 0, // Adaptive grid will auto-layout
      row: index,
      size: sizeMap[defaultSize] || 4,
      height: 2 as 2 | 4 | 6,
    };
  });
};

// Generate default positions from catalog - single source of truth
const DEFAULT_POSITIONS: WidgetPosition[] = generateDefaultPositions();

const CURRENT_OVERVIEW_LAYOUT_VERSION = 4;

export const useGridLayout = (subAccountId: string | undefined, availableWidgets: string[]) => {
  // Mode is always adaptive now
  const mode = 'adaptive';
  const [positions, setPositions] = useState<WidgetPosition[]>(DEFAULT_POSITIONS);
  const [order, setOrder] = useState<string[]>(DEFAULT_POSITIONS.map(p => p.id));
  const [columnCount, setColumnCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previousLayout, setPreviousLayout] = useState<{ positions: WidgetPosition[], order: string[], columnCount: number } | null>(null);

  useEffect(() => {
    if (!subAccountId) {
      console.log('[Dashboard] 🔵 No subAccountId, skipping layout load');
      setIsLoading(false);
      return;
    }

    const loadLayout = async () => {
      console.log('[Dashboard] 🔵 Load Start:', { subAccountId });
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('layout_json')
          .eq('sub_account_id', subAccountId)
          .maybeSingle();

        if (error) {
          console.error('[Dashboard] ❌ Error loading layout:', error);
          return;
        }

        if (data?.layout_json) {
          const layoutData = data.layout_json as any;

          // Always load into adaptive mode structure
          // CRITICAL: Check if positions array is NOT EMPTY before using it
          if (layoutData.positions && Array.isArray(layoutData.positions) && layoutData.positions.length > 0) {
            setPositions(layoutData.positions);
            // If order exists, use it. If not, derive from positions.
            const loadedOrder = layoutData.order || layoutData.positions.map((p: any) => p.id);
            setOrder(loadedOrder);

            if (layoutData.columnCount) {
              setColumnCount(layoutData.columnCount);
            }
          } else {
            // Empty or missing positions - use defaults
            console.log('[Dashboard] 📋 Empty layout detected, using DEFAULT_POSITIONS');
            setPositions(DEFAULT_POSITIONS);
            setOrder(DEFAULT_POSITIONS.map(p => p.id));
          }
        } else {
          // Fallback to defaults if data is malformed
          setPositions(DEFAULT_POSITIONS);
          setOrder(DEFAULT_POSITIONS.map(p => p.id));
        }
      }
      } catch (error) {
      console.error('Failed to load layout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadLayout();
}, [subAccountId]);

const saveLayout = useCallback(async (newPositions: WidgetPosition[], newOrder: string[], newColumnCount?: number) => {
  if (!subAccountId) {
    console.warn('[Dashboard] 💾 Cannot save: no subAccountId');
    return;
  }

  const countToSave = newColumnCount ?? columnCount;

  // Validate before saving
  const uniqueIds = new Set(newPositions.map(p => p.id));
  if (uniqueIds.size !== newPositions.length) {
    console.error('[Dashboard] ❌ Duplicate widget IDs detected!', newPositions);
    toast.error('Cannot save: duplicate widgets detected');
    return;
  }

  setIsSaving(true);
  try {
    // Save in new format with fixed 'adaptive' mode
    const layoutData: LayoutData = {
      mode: 'adaptive',
      positions: newPositions,
      order: newOrder,
      columnCount: countToSave,
      version: CURRENT_OVERVIEW_LAYOUT_VERSION,
    };

    const { error } = await supabase
      .from('user_settings')
      .update({
        layout_json: layoutData as any,
        updated_at: new Date().toISOString(),
      })
      .eq('sub_account_id', subAccountId);

    if (error) {
      throw error;
    }

    // Update local state
    setPositions(newPositions);
    setOrder(newOrder);
    if (newColumnCount !== undefined) {
      setColumnCount(newColumnCount);
    }

    console.log('[Dashboard] ✅ Layout saved successfully');
  } catch (error) {
    console.error('[Dashboard] ❌ Failed to save layout:', error);
    toast.error('Failed to save layout');
  } finally {
    setIsSaving(false);
  }
}, [subAccountId, columnCount]);

const updatePosition = useCallback((widgetId: string, column: number, row: number, size?: 1 | 2 | 4 | 6) => {
  const newPositions = positions.map(p =>
    p.id === widgetId ? { ...p, column, row, ...(size && { size }) } : p
  );
  saveLayout(newPositions, order, columnCount);
}, [positions, order, columnCount, saveLayout]);

const resizeWidget = useCallback(async (widgetId: string, newSize?: 1 | 2 | 4 | 6, newHeight?: 2 | 4 | 6) => {
  const newPositions = positions.map(p => {
    if (p.id === widgetId) {
      const updates: Partial<WidgetPosition> = {};
      if (newSize !== undefined && p.size !== 1) updates.size = newSize;
      if (newHeight !== undefined) updates.height = p.size === 1 ? 2 : newHeight;
      return { ...p, ...updates };
    }
    return p;
  });

  try {
    await saveLayout(newPositions, order, columnCount);
    toast.success('Widget resized');
  } catch (error) {
    toast.error('Failed to resize widget');
  }
}, [positions, order, columnCount, saveLayout]);

// Add widget to layout
const addWidget = useCallback(async (widgetId: string) => {
  if (positions.find(p => p.id === widgetId)) {
    toast.info('Widget already added');
    return;
  }

  const newOrder = [...order, widgetId];
  // Default position (will be handled by adaptive grid)
  const newPositions = [...positions, {
    id: widgetId,
    column: 0,
    row: 0,
    size: WIDGET_SIZE_MAP[widgetId] || 2,
    height: 2 as 2 | 4 | 6
  }];

  setOrder(newOrder);
  setPositions(newPositions);

  try {
    await saveLayout(newPositions, newOrder, columnCount);
    toast.success('Widget added');
  } catch (error) {
    setOrder(order);
    setPositions(positions);
    toast.error('Failed to add widget');
  }
}, [positions, order, columnCount, saveLayout]);

const removeWidget = useCallback(async (widgetId: string) => {
  const newPositions = positions.filter(p => p.id !== widgetId);
  const newOrder = order.filter(id => id !== widgetId);

  setPositions(newPositions);
  setOrder(newOrder);

  try {
    await saveLayout(newPositions, newOrder, columnCount);
    toast.success('Widget removed');
  } catch (error) {
    setPositions(positions);
    setOrder(order);
    toast.error('Failed to remove widget');
  }
}, [positions, order, columnCount, saveLayout]);

const resetLayout = useCallback(() => {
  setPreviousLayout({ positions: [...positions], order: [...order], columnCount });
  const defaultOrder = DEFAULT_POSITIONS.map(p => p.id);
  setPositions(DEFAULT_POSITIONS);
  setOrder(defaultOrder);
  setColumnCount(3);
  saveLayout(DEFAULT_POSITIONS, defaultOrder, 3);
  toast.success('Layout reset');
}, [saveLayout, positions, order, columnCount]);

const undoReset = useCallback(() => {
  if (previousLayout) {
    saveLayout(previousLayout.positions, previousLayout.order, previousLayout.columnCount);
    setPreviousLayout(null);
    toast.success('Layout restored');
  }
}, [previousLayout, saveLayout]);

const updateColumnCount = useCallback((newCount: number) => {
  if (newCount >= 1 && newCount <= 4) {
    setColumnCount(newCount);
    saveLayout(positions, order, newCount);
  }
}, [positions, order, saveLayout]);

return {
  mode,
  positions,
  order,
  columnCount,
  isLoading,
  isSaving,
  updatePosition,
  resizeWidget,
  saveLayout,
  updateColumnCount,
  addWidget,
  removeWidget,
  resetLayout,
  undoReset,
  canUndo: previousLayout !== null,
  // Legacy support (noop)
  toggleLayoutMode: () => { },
};
};
