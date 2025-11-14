import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WidgetPosition {
  id: string;
  column: number;
  row: number;
}

export interface LayoutData {
  positions: WidgetPosition[];
  columnCount?: number;
  version?: number;
}

const DEFAULT_POSITIONS: WidgetPosition[] = [
  // Row 0
  { id: 'currentROI', column: 0, row: 0 },
  { id: 'avgPnLPerDay', column: 1, row: 0 },
  { id: 'winRate', column: 2, row: 0 },
  
  // Row 1
  { id: 'topMovers', column: 0, row: 1 },
  { id: 'capitalGrowth', column: 1, row: 1 },
  { id: 'combinedPnLROI', column: 2, row: 1 },
  
  // Row 2
  { id: 'aiInsights', column: 0, row: 2 },
  
  // Row 3
  { id: 'goals', column: 0, row: 3 },
  
  // Row 4
  { id: 'emotionMistakeCorrelation', column: 0, row: 4 },
  
  // Row 5
  { id: 'behaviorAnalytics', column: 0, row: 5 },
  { id: 'costEfficiency', column: 1, row: 5 },
  
  // Row 6
  { id: 'performanceHighlights', column: 0, row: 6 },
  { id: 'tradingQuality', column: 1, row: 6 },
];

const CURRENT_OVERVIEW_LAYOUT_VERSION = 3;

export const useGridLayout = (userId: string | undefined, availableWidgets: string[]) => {
  const [positions, setPositions] = useState<WidgetPosition[]>(DEFAULT_POSITIONS);
  const [columnCount, setColumnCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('layout_json')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error loading layout:', error);
          return;
        }

if (data?.layout_json) {
  const layoutData = data.layout_json as any;

  // New object format with positions/columnCount
  if (layoutData?.positions && Array.isArray(layoutData.positions)) {
    const isOutdated = !layoutData.version || layoutData.version < CURRENT_OVERVIEW_LAYOUT_VERSION;
    if (isOutdated) {
      console.warn('Outdated overview layout detected; applying defaults');
      setPositions(DEFAULT_POSITIONS);
      setColumnCount(3);
      await saveLayout(DEFAULT_POSITIONS, 3);
    } else {
      console.log('Loading layout with column count:', layoutData);
      setPositions(layoutData.positions);
      if (layoutData.columnCount && layoutData.columnCount >= 1 && layoutData.columnCount <= 4) {
        setColumnCount(layoutData.columnCount);
      }
    }
  }
  // Position-based array (legacy) -> treat as outdated and reset
  else if (Array.isArray(layoutData) && layoutData.length > 0 && layoutData[0]?.column !== undefined) {
    console.warn('Legacy position-based layout detected; applying defaults');
    setPositions(DEFAULT_POSITIONS);
    setColumnCount(3);
    await saveLayout(DEFAULT_POSITIONS, 3);
  }
  // Order-based array (legacy strings) -> treat as outdated and reset
  else if (Array.isArray(layoutData) && layoutData.length > 0 && typeof layoutData[0] === 'string') {
    console.warn('Legacy order-based layout detected; applying defaults');
    setPositions(DEFAULT_POSITIONS);
    setColumnCount(3);
    await saveLayout(DEFAULT_POSITIONS, 3);
  }
}
      } catch (error) {
        console.error('Failed to load layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [userId]);

  const saveLayout = useCallback(async (newPositions: WidgetPosition[], newColumnCount?: number) => {
    if (!userId) {
      console.warn('[useGridLayout] Cannot save: no userId');
      return;
    }

    const countToSave = newColumnCount ?? columnCount;
    console.log('[useGridLayout] Saving layout:', { 
      positionCount: newPositions.length, 
      columnCount: countToSave,
      widgetIds: newPositions.map(p => p.id)
    });
    
    // Validate before saving
    const uniqueIds = new Set(newPositions.map(p => p.id));
    if (uniqueIds.size !== newPositions.length) {
      console.error('[useGridLayout] Duplicate widget IDs detected!', newPositions);
      toast.error('Cannot save: duplicate widgets detected');
      return;
    }

    setIsSaving(true);
    try {
      // Save in new format with both positions and columnCount
      const layoutData: LayoutData = {
        positions: newPositions,
        columnCount: countToSave,
        version: CURRENT_OVERVIEW_LAYOUT_VERSION,
      };
      
      const { error } = await supabase
        .from('user_settings')
        .update({
          layout_json: layoutData as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[useGridLayout] Save error:', error);
        throw error;
      }
      
      // Update local state to match what was saved
      setPositions(newPositions);
      if (newColumnCount !== undefined) {
        setColumnCount(newColumnCount);
      }
      
      console.log('[useGridLayout] ✅ Layout saved successfully');
      toast.success('Layout saved');
    } catch (error) {
      console.error('[useGridLayout] Failed to save layout:', error);
      toast.error('Failed to save layout. Please try again.');
      throw error; // Let caller handle the error
    } finally {
      setIsSaving(false);
    }
  }, [userId, columnCount]);

  const updatePosition = useCallback((widgetId: string, column: number, row: number) => {
    setPositions(prev => {
      const filtered = prev.filter(p => p.id !== widgetId);
      return [...filtered, { id: widgetId, column, row }];
    });
  }, []);

  // Add widget to layout - place in first free position (bottom row, left to right)
  const addWidget = useCallback(async (widgetId: string) => {
    console.log('[useGridLayout] addWidget called:', { widgetId, currentPositions: positions.length });
    
    if (positions.find(p => p.id === widgetId)) {
      console.warn('[useGridLayout] Widget already exists:', widgetId);
      toast.info('Widget already added');
      return;
    }

    // Build grid to find occupied positions
    const grid: { [row: number]: { [col: number]: boolean } } = {};
    positions.forEach(pos => {
      if (!grid[pos.row]) grid[pos.row] = {};
      grid[pos.row][pos.column] = true;
    });

    // Find max row
    const maxRow = Math.max(-1, ...positions.map(p => p.row));
    
    // Start from bottom row, move left to right
    let targetCol = 0;
    let targetRow = maxRow + 1;
    
    // Check if there's space in the bottom row
    if (maxRow >= 0 && grid[maxRow]) {
      // Count occupied positions in bottom row
      const occupiedInBottomRow = Object.keys(grid[maxRow]).length;
      if (occupiedInBottomRow < columnCount) {
        // Find first free column in bottom row
        for (let col = 0; col < columnCount; col++) {
          if (!grid[maxRow][col]) {
            targetCol = col;
            targetRow = maxRow;
            break;
          }
        }
      }
    }

    const newPositions = [...positions, { id: widgetId, column: targetCol, row: targetRow }];
    console.log('[useGridLayout] Widget placement:', { 
      widgetId, 
      position: { column: targetCol, row: targetRow },
      totalWidgets: newPositions.length 
    });
    
    // Update local state immediately for responsive UI
    setPositions(newPositions);
    
    // Save to database immediately
    try {
      await saveLayout(newPositions);
      console.log('[useGridLayout] ✅ Widget added and saved');
    } catch (error) {
      // Revert on error
      console.error('[useGridLayout] ❌ Failed to save widget, reverting:', error);
      setPositions(positions);
      toast.error('Failed to add widget');
    }
  }, [positions, columnCount, saveLayout]);

  const removeWidget = useCallback(async (widgetId: string) => {
    console.log('[useGridLayout] Removing widget:', widgetId);
    
    const newPositions = positions.filter(p => p.id !== widgetId);
    
    // Update UI immediately
    setPositions(newPositions);
    
    // Save to database
    try {
      await saveLayout(newPositions);
      console.log('[useGridLayout] ✅ Widget removed and saved');
      toast.success('Widget removed');
    } catch (error) {
      // Revert on error
      console.error('[useGridLayout] ❌ Failed to remove widget, reverting:', error);
      setPositions(positions);
      toast.error('Failed to remove widget');
    }
  }, [positions, saveLayout]);

  const resetLayout = useCallback(() => {
    setPositions(DEFAULT_POSITIONS);
    setColumnCount(3);
    saveLayout(DEFAULT_POSITIONS, 3);
    toast.success('Layout reset');
  }, [saveLayout]);

  const updateColumnCount = useCallback((newCount: number) => {
    if (newCount >= 1 && newCount <= 4) {
      setColumnCount(newCount);
      saveLayout(positions, newCount);
    }
  }, [positions, saveLayout]);

  return {
    positions,
    columnCount,
    isLoading,
    isSaving,
    updatePosition,
    saveLayout,
    updateColumnCount,
    addWidget,
    removeWidget,
    resetLayout,
  };
};
