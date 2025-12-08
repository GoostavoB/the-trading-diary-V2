import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WidgetSize, WidgetHeight, migrateLegacySize } from '@/types/widget';

export interface TradeStationWidgetPosition {
  id: string;
  column: number;
  row: number;
  size: WidgetSize;
  height: WidgetHeight;
}

interface TradeStationLayoutData {
  mode: 'adaptive' | 'fixed';
  positions: TradeStationWidgetPosition[];
  order: string[];
  columnCount: number;
  version?: number;
}

// Default widgets for Trade Station with semantic sizes
const DEFAULT_TRADE_STATION_POSITIONS: TradeStationWidgetPosition[] = [
  { id: 'riskCalculator', column: 0, row: 0, size: 'medium', height: 4 },
  { id: 'simpleLeverage', column: 2, row: 0, size: 'small', height: 2 },
  { id: 'errorReflection', column: 2, row: 1, size: 'small', height: 2 },
  { id: 'rollingTarget', column: 0, row: 2, size: 'large', height: 4 },
];

const CURRENT_TRADE_STATION_LAYOUT_VERSION = 3;

export const useTradeStationLayout = (userId: string | undefined) => {
  const [mode, setMode] = useState<'adaptive' | 'fixed'>('fixed');
  const [positions, setPositions] = useState<TradeStationWidgetPosition[]>(DEFAULT_TRADE_STATION_POSITIONS);
  const [order, setOrder] = useState<string[]>(DEFAULT_TRADE_STATION_POSITIONS.map(p => p.id));
  const [columnCount, setColumnCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previousLayout, setPreviousLayout] = useState<{ mode: 'adaptive' | 'fixed', positions: TradeStationWidgetPosition[], order: string[], columnCount: number } | null>(null);

  // Load layout from database
  useEffect(() => {
    if (!userId) {
      console.log('[TradeStation] 🔵 No userId, skipping layout load');
      setIsLoading(false);
      return;
    }

    const loadLayout = async () => {
      console.log('[TradeStation] 🔵 Load Start:', { userId });
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('trade_station_layout_json')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('[TradeStation] ❌ Error loading layout:', error);
          return;
        }

if (data?.trade_station_layout_json) {
  const layoutData = data.trade_station_layout_json as any;
  console.log('[TradeStation] 📦 Raw layout data:', { 
    mode: layoutData.mode, 
    version: layoutData.version, 
    positionCount: layoutData.positions?.length 
  });
  
  // AGGRESSIVE MIGRATION DETECTION
  const checks = {
    wrongMode: layoutData.mode === 'adaptive' || layoutData.mode === undefined,
    missingVersion: !layoutData.version || layoutData.version < CURRENT_TRADE_STATION_LAYOUT_VERSION,
    missingSizeHeight: layoutData.positions?.some((p: any) => p.size === undefined || p.height === undefined),
    invalidSizeValues: layoutData.positions?.some((p: any) => 
      typeof p.size !== 'number' || ![1, 2, 4, 6].includes(p.size)
    ),
    invalidHeightValues: layoutData.positions?.some((p: any) => 
      typeof p.height !== 'number' || ![2, 4, 6].includes(p.height)
    ),
    invalidColumns: layoutData.positions?.some((p: any) => 
      p.column === undefined || typeof p.column !== 'number' || p.column < 0 || p.column > 5
    ),
    countMismatch: layoutData.positions?.length !== layoutData.order?.length,
  };

  const needsMigration = Object.values(checks).some(Boolean);

  console.log('[TradeStation] 🔍 Migration Check:', {
    needsMigration,
    currentMode: layoutData.mode,
    currentVersion: layoutData.version,
    expectedVersion: CURRENT_TRADE_STATION_LAYOUT_VERSION,
    positionCount: layoutData.positions?.length,
    checks,
  });

  if (needsMigration && layoutData.positions && Array.isArray(layoutData.positions)) {
    console.log('[TradeStation] ⚠️ Migration Needed - Starting migration process...');
    
    // Import helper functions
    const { getDefaultSizeForWidget, getDefaultHeightForWidget } = await import('@/types/widget');
    
    // Assign default sizes based on widget ID with detailed logging
    const migratedPositions = layoutData.positions.map((p: any, index: number) => {
      const defaultSize = getDefaultSizeForWidget(p.id, true);
      const defaultHeight = getDefaultHeightForWidget(p.id, defaultSize);
      
      const migrated = {
        id: p.id,
        column: (typeof p.column === 'number' && p.column >= 0 && p.column <= 5) 
          ? p.column 
          : (index % 6),
        row: (typeof p.row === 'number' && p.row >= 0) 
          ? p.row 
          : Math.floor(index / 3),
        size: ([1, 2, 4, 6].includes(p.size)) ? p.size : defaultSize,
        height: ([2, 4, 6].includes(p.height)) ? p.height : defaultHeight,
      };
      
      console.log(`[Migration] Widget ${p.id}:`, {
        before: { column: p.column, row: p.row, size: p.size, height: p.height },
        after: migrated,
        usedDefaults: {
          column: migrated.column !== p.column,
          row: migrated.row !== p.row,
          size: migrated.size !== p.size,
          height: migrated.height !== p.height,
        }
      });
      
      return migrated;
    });

    console.log('[TradeStation] 📊 Migration Summary:', {
      total: migratedPositions.length,
      sizes: migratedPositions.reduce((acc, p) => {
        acc[`size${p.size}`] = (acc[`size${p.size}`] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      heights: migratedPositions.reduce((acc, p) => {
        acc[`height${p.height}`] = (acc[`height${p.height}`] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });

    // Convert to fixed mode and save
    setMode('fixed');
    setPositions(migratedPositions);
    setOrder(migratedPositions.map(p => p.id));
    setColumnCount(3);
    await saveLayout(migratedPositions, migratedPositions.map(p => p.id), 'fixed', 3);
    console.log('[TradeStation] ✅ Migration Complete - Layout saved with version', CURRENT_TRADE_STATION_LAYOUT_VERSION);
    toast.success('Trade Station upgraded to puzzle system!', {
      description: `${migratedPositions.length} widgets migrated to Fixed mode with sizes (1,2,4,6) and heights (2,4,6)`,
      duration: 5000,
    });
  }
  // Check if this is the new format
  else if (layoutData.mode && layoutData.version === CURRENT_TRADE_STATION_LAYOUT_VERSION) {
    setMode(layoutData.mode);
    setPositions(layoutData.positions || DEFAULT_TRADE_STATION_POSITIONS);
    setOrder(layoutData.order || layoutData.positions?.map((p: any) => p.id) || DEFAULT_TRADE_STATION_POSITIONS.map(p => p.id));
    setColumnCount(layoutData.columnCount || 3);
  } else {
    // Legacy format - migrate to new format
    const hasValidLegacyPositions = Array.isArray(layoutData.positions) && layoutData.positions.every((p: any) => 
      p && typeof p.id === 'string' && typeof p.column === 'number' && typeof p.row === 'number'
    );
    
    if (hasValidLegacyPositions) {
      const migratedPositions = layoutData.positions;
      const migratedOrder = migratedPositions.map((p: any) => p.id);
      setMode('fixed');
      setPositions(migratedPositions);
      setOrder(migratedOrder);
      setColumnCount(layoutData.columnCount || 3);
      // Save in new format
      await saveLayout(migratedPositions, migratedOrder, 'fixed', layoutData.columnCount || 3);
    } else {
      console.warn('[TradeStation] Invalid layout detected. Resetting to defaults.');
      setMode('fixed');
      setPositions(DEFAULT_TRADE_STATION_POSITIONS);
      setOrder(DEFAULT_TRADE_STATION_POSITIONS.map(p => p.id));
      setColumnCount(3);
      await saveLayout(DEFAULT_TRADE_STATION_POSITIONS, DEFAULT_TRADE_STATION_POSITIONS.map(p => p.id), 'fixed', 3);
    }
  }
}
      } catch (error) {
        console.error('Failed to load Trade Station layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [userId]);

  // Save layout to database
  const saveLayout = useCallback(async (newPositions: TradeStationWidgetPosition[], newOrder: string[], newMode?: 'adaptive' | 'fixed', newColumnCount?: number) => {
    if (!userId) {
      console.warn('[TradeStation] 💾 Cannot save: no userId');
      return;
    }

    console.log('[TradeStation] 💾 Saving Layout:', { 
      positionCount: newPositions.length,
      orderCount: newOrder.length,
      mode: newMode ?? mode,
      columnCount: newColumnCount ?? columnCount,
      version: CURRENT_TRADE_STATION_LAYOUT_VERSION,
    });

    setIsSaving(true);
    try {
      const layoutData: TradeStationLayoutData = {
        mode: newMode ?? mode,
        positions: newPositions,
        order: newOrder,
        columnCount: newColumnCount ?? columnCount,
        version: CURRENT_TRADE_STATION_LAYOUT_VERSION,
      };

      const { error } = await supabase
        .from('user_settings')
        .update({
          trade_station_layout_json: layoutData as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[TradeStation] ❌ Save error:', error);
        throw error;
      }

      setPositions(newPositions);
      setOrder(newOrder);
      if (newMode) setMode(newMode);
      if (newColumnCount !== undefined) {
        setColumnCount(newColumnCount);
      }
      
      console.log('[TradeStation] ✅ Layout saved successfully');
      toast.success('Trade Station layout saved');
    } catch (error) {
      console.error('[TradeStation] ❌ Failed to save layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [userId, mode, columnCount]);

  // Toggle layout mode
  const toggleLayoutMode = useCallback((newMode: 'adaptive' | 'fixed') => {
    console.log('[TradeStation] 🔄 Mode Change Requested:', { from: mode, to: newMode });
    if (newMode === mode) {
      console.log('[TradeStation] ⏭️ Same mode, skipping');
      return;
    }
    
    if (newMode === 'fixed') {
      console.log('[TradeStation] 🔄 Converting Adaptive → Fixed');
      // Convert adaptive order to fixed positions
      const newPositions: TradeStationWidgetPosition[] = [];
      order.forEach((widgetId, index) => {
        const col = index % columnCount;
        const row = Math.floor(index / columnCount);
        const defaultWidget = DEFAULT_TRADE_STATION_POSITIONS.find(p => p.id === widgetId);
        const size: WidgetSize = defaultWidget?.size || 'small';
        const height: WidgetHeight = defaultWidget?.height || 2;
        newPositions.push({ id: widgetId, column: col, row, size, height });
      });
      console.log('[TradeStation] 📐 New positions:', { count: newPositions.length });
      saveLayout(newPositions, order, newMode, columnCount);
    } else {
      console.log('[TradeStation] 🔄 Converting Fixed → Adaptive');
      // Convert fixed positions to adaptive order
      const sortedPositions = [...positions].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.column - b.column;
      });
      const newOrder = sortedPositions.map(p => p.id);
      console.log('[TradeStation] 📋 New order:', { count: newOrder.length });
      saveLayout(positions, newOrder, newMode, columnCount);
    }
  }, [mode, positions, order, columnCount, saveLayout]);

  // Update position of a specific widget
  const updatePosition = useCallback((widgetId: string, column: number, row: number) => {
    const newPositions = positions.map(p =>
      p.id === widgetId ? { ...p, column, row } : p
    );
    saveLayout(newPositions, order, mode, columnCount);
  }, [positions, order, mode, columnCount, saveLayout]);

  // Add widget to layout
  const addWidget = useCallback((widgetId: string) => {
    if (positions.find(p => p.id === widgetId)) {
      toast.info('Widget already added');
      return;
    }

    const newOrder = [...order, widgetId];
    
    if (mode === 'fixed') {
      // Build grid to find occupied positions
      const grid: { [row: number]: { [col: number]: boolean } } = {};
      positions.forEach(pos => {
        if (!grid[pos.row]) grid[pos.row] = {};
        grid[pos.row][pos.column] = true;
      });

      const maxRow = Math.max(-1, ...positions.map(p => p.row));
      let targetCol = 0;
      let targetRow = maxRow + 1;
      
      if (maxRow >= 0 && grid[maxRow]) {
        const occupiedInBottomRow = Object.keys(grid[maxRow]).length;
        if (occupiedInBottomRow < columnCount) {
          for (let col = 0; col < columnCount; col++) {
            if (!grid[maxRow][col]) {
              targetCol = col;
              targetRow = maxRow;
              break;
            }
          }
        }
      }

      const newPositions = [...positions, { id: widgetId, column: targetCol, row: targetRow, size: 'small' as WidgetSize, height: 2 as WidgetHeight }];
      saveLayout(newPositions, newOrder, mode, columnCount);
    } else {
      // Adaptive mode: just add to order
      saveLayout(positions, newOrder, mode, columnCount);
    }
    
    toast.success('Widget added');
  }, [positions, order, mode, columnCount, saveLayout]);

  // Remove widget from layout
  const removeWidget = useCallback((widgetId: string) => {
    const newPositions = positions.filter(p => p.id !== widgetId);
    const newOrder = order.filter(id => id !== widgetId);
    saveLayout(newPositions, newOrder, mode, columnCount);
  }, [positions, order, mode, columnCount, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    // Save current layout for undo
    setPreviousLayout({ mode, positions: [...positions], order: [...order], columnCount });
    const defaultOrder = DEFAULT_TRADE_STATION_POSITIONS.map(p => p.id);
    saveLayout(DEFAULT_TRADE_STATION_POSITIONS, defaultOrder, 'adaptive', 3);
    toast.success('Trade Station reset to default');
  }, [saveLayout, mode, positions, order, columnCount]);

  // Undo last reset
  const undoReset = useCallback(() => {
    if (previousLayout) {
      saveLayout(previousLayout.positions, previousLayout.order, previousLayout.mode, previousLayout.columnCount);
      setPreviousLayout(null);
      toast.success('Layout restored');
    }
  }, [previousLayout, saveLayout]);

  // Update column count
  const updateColumnCount = useCallback((count: number) => {
    if (mode === 'fixed') {
      // Reflow positions to fit new column count
      const sortedPositions = [...positions].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.column - b.column;
      });

      const reflowed: TradeStationWidgetPosition[] = [];
      let currentCol = 0;
      let currentRow = 0;

      sortedPositions.forEach(pos => {
        reflowed.push({
          ...pos,
          column: currentCol,
          row: currentRow,
        });

        currentCol++;
        if (currentCol >= count) {
          currentCol = 0;
          currentRow++;
        }
      });

      saveLayout(reflowed, order, mode, count);
    } else {
      // Adaptive mode: just update column count
      saveLayout(positions, order, mode, count);
    }
  }, [mode, positions, order, saveLayout]);

  // Resize widget
  const resizeWidget = useCallback(async (widgetId: string, newSize?: WidgetSize, newHeight?: WidgetHeight) => {
    const widget = positions.find(p => p.id === widgetId);
    console.log('[TradeStation] 📐 Resize Widget:', { 
      widgetId, 
      currentSize: widget?.size, 
      currentHeight: widget?.height,
      newSize, 
      newHeight 
    });
    
    const newPositions = positions.map(p => {
      if (p.id === widgetId) {
        const updates: Partial<TradeStationWidgetPosition> = {};
        
        if (newSize !== undefined && p.size !== 'small') {
          updates.size = newSize;
        }
        
        if (newHeight !== undefined) {
          if (p.size === 'small') {
            updates.height = 2;
          } else {
            updates.height = newHeight;
          }
        }
        
        console.log('[TradeStation] 📐 Applied updates:', updates);
        return { ...p, ...updates };
      }
      return p;
    });
    
    try {
      await saveLayout(newPositions, order, mode, columnCount);
      console.log('[TradeStation] ✅ Widget resized successfully');
      toast.success('Widget resized');
    } catch (error) {
      console.error('[TradeStation] ❌ Failed to resize:', error);
      toast.error('Failed to resize widget');
    }
  }, [positions, order, mode, columnCount, saveLayout]);

  return {
    mode,
    positions,
    order,
    columnCount,
    isLoading,
    isSaving,
    toggleLayoutMode,
    updatePosition,
    resizeWidget,
    saveLayout,
    addWidget,
    removeWidget,
    resetLayout,
    undoReset,
    canUndo: previousLayout !== null,
    updateColumnCount,
  };
};
