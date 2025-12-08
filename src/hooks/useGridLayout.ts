import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WIDGET_SIZE_MAP, WIDGET_SIZE_TO_COLUMNS, type WidgetSize, migrateLegacySize } from '@/types/widget';
import { toGridWidgets, resolveLayoutCollisions, GridWidget } from '@/utils/gridValidator';
import { DEFAULT_DASHBOARD_LAYOUT, WIDGET_CATALOG } from '@/config/widgetCatalog';

export interface WidgetPosition {
  id: string;
  column: number; // 0-2 (3 columns total)
  row: number;
  size: WidgetSize; // 'small' | 'medium' | 'large'
  height: 2 | 4 | 6; // Widget height in rows
}

export interface LayoutData {
  mode: 'adaptive' | 'fixed';
  positions: WidgetPosition[];
  order: string[];
  version?: number;
  // columnCount is deprecated - always use 3 columns now
}

/**
 * Generate default positions dynamically from DEFAULT_DASHBOARD_LAYOUT
 * This ensures Force Reset always uses the latest widget configuration
 * Now uses semantic sizes: small, medium, large
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
        size: 'medium' as WidgetSize,
        height: 2 as 2 | 4 | 6,
      };
    }

    // Get size from WIDGET_SIZE_MAP which now returns semantic sizes
    const size: WidgetSize = WIDGET_SIZE_MAP[widgetId] || 'medium';

    return {
      id: widgetId,
      column: 0, // Adaptive grid will auto-layout in 3 columns
      row: index,
      size,
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
  // columnCount removed - grid is always fixed to 3 columns
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previousLayout, setPreviousLayout] = useState<{ positions: WidgetPosition[], order: string[] } | null>(null);

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
            // Migrate old numeric sizes to new semantic sizes
            const migratedPositions = layoutData.positions.map((p: any) => {
              const size = typeof p.size === 'number' ? migrateLegacySize(p.size) : p.size;
              return { ...p, size };
            });

            setPositions(migratedPositions);
            // If order exists, use it. If not, derive from positions.
            const loadedOrder = layoutData.order || migratedPositions.map((p: any) => p.id);
            setOrder(loadedOrder);
          } else {
            // Empty or missing positions - use defaults
            console.log('[Dashboard] 📋 Empty layout detected, using DEFAULT_POSITIONS');
            setPositions(DEFAULT_POSITIONS);
            setOrder(DEFAULT_POSITIONS.map(p => p.id));
          }
        } else {
          // Fallback to defaults if data is malformed or not present
          setPositions(DEFAULT_POSITIONS);
          setOrder(DEFAULT_POSITIONS.map(p => p.id));
        }
      } catch (error) {
        console.error('[Dashboard] ❌ Failed to load layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [subAccountId]);

  const saveLayout = useCallback(async (newPositions: WidgetPosition[], newOrder: string[]) => {
    if (!subAccountId) {
      console.warn('[Dashboard] 💾 Cannot save: no subAccountId');
      return;
    }

    // Validate before saving
    const uniqueIds = new Set(newPositions.map(p => p.id));
    if (uniqueIds.size !== newPositions.length) {
      console.error('[Dashboard] ❌ Duplicate widget IDs detected!', newPositions);
      toast.error('Cannot save: duplicate widgets detected');
      return;
    }

    setIsSaving(true);
    try {
      // Save in new format with fixed 'adaptive' mode and 3-column grid
      const layoutData: LayoutData = {
        mode: 'adaptive',
        positions: newPositions,
        order: newOrder,
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

      console.log('[Dashboard] ✅ Layout saved successfully');
    } catch (error) {
      console.error('[Dashboard] ❌ Failed to save layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [subAccountId]);

  const updatePosition = useCallback((widgetId: string, column: number, row: number, size?: WidgetSize) => {
    const newPositions = positions.map(p =>
      p.id === widgetId ? { ...p, column, row, ...(size && { size }) } : p
    );
    saveLayout(newPositions, order);
  }, [positions, order, saveLayout]);

  const resizeWidget = useCallback(async (widgetId: string, newSize?: WidgetSize, newHeight?: 2 | 4 | 6) => {
    const newPositions = positions.map(p => {
      if (p.id === widgetId) {
        const updates: Partial<WidgetPosition> = {};
        if (newSize !== undefined && p.size !== 'small') updates.size = newSize;
        if (newHeight !== undefined) updates.height = p.size === 'small' ? 2 : newHeight;
        return { ...p, ...updates };
      }
      return p;
    });

    try {
      await saveLayout(newPositions, order);
      toast.success('Widget resized');
    } catch (error) {
      toast.error('Failed to resize widget');
    }
  }, [positions, order, saveLayout]);

  // Add widget to layout
  const addWidget = useCallback(async (widgetId: string) => {
    if (positions.find(p => p.id === widgetId)) {
      toast.info('Widget already added');
      return;
    }

    const newOrder = [...order, widgetId];
    // Default position (will be handled by adaptive grid)
    const newPositions: WidgetPosition[] = [...positions, {
      id: widgetId,
      column: 0,
      row: 0,
      size: WIDGET_SIZE_MAP[widgetId] || 'medium',
      height: 2 as 2 | 4 | 6
    }];

    setOrder(newOrder);
    setPositions(newPositions);

    try {
      await saveLayout(newPositions, newOrder);
      toast.success('Widget added');
    } catch (error) {
      setOrder(order);
      setPositions(positions);
      toast.error('Failed to add widget');
    }
  }, [positions, order, saveLayout]);

  const removeWidget = useCallback(async (widgetId: string) => {
    const newPositions = positions.filter(p => p.id !== widgetId);
    const newOrder = order.filter(id => id !== widgetId);

    setPositions(newPositions);
    setOrder(newOrder);

    try {
      await saveLayout(newPositions, newOrder);
      toast.success('Widget removed');
    } catch (error) {
      setPositions(positions);
      setOrder(order);
      toast.error('Failed to remove widget');
    }
  }, [positions, order, saveLayout]);

  const resetLayout = useCallback(() => {
    setPreviousLayout({ positions: [...positions], order: [...order] });
    const defaultOrder = DEFAULT_POSITIONS.map(p => p.id);
    setPositions(DEFAULT_POSITIONS);
    setOrder(defaultOrder);
    saveLayout(DEFAULT_POSITIONS, defaultOrder);
    toast.success('Layout reset');
  }, [saveLayout, positions, order]);

  const undoReset = useCallback(() => {
    if (previousLayout) {
      saveLayout(previousLayout.positions, previousLayout.order);
      setPreviousLayout(null);
      toast.success('Layout restored');
    }
  }, [previousLayout, saveLayout]);

  // updateColumnCount function removed - grid is always 3 columns

  return {
    mode,
    positions,
    order,
    columnCount: 3, // Fixed to 3 columns for responsive grid - added back for backward compatibility
    isLoading,
    isSaving,
    updatePosition,
    resizeWidget,
    saveLayout,
    // updateColumnCount removed - grid is always 3 columns
    addWidget,
    removeWidget,
    resetLayout,
    undoReset,
    canUndo: previousLayout !== null,
    // Assuming `availableWidgets` is defined in the scope, adding it here.
    // If not, this will cause an error.
    // The instruction snippet implies it should be added.
    availableWidgets,
    // Legacy support (noop)
    toggleLayoutMode: () => { },
  };
};
