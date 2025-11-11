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
  // Row 1
  { id: 'currentROI', column: 0, row: 0 },
  { id: 'winRate', column: 1, row: 0 },
  { id: 'avgPnLPerDay', column: 2, row: 0 },
  
  // Row 2
  { id: 'capitalGrowth', column: 0, row: 1 },
  { id: 'topMovers', column: 1, row: 1 },
  { id: 'combinedPnLROI', column: 2, row: 1 },
];

const CURRENT_OVERVIEW_LAYOUT_VERSION = 2;

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
    if (!userId) return;

    const countToSave = newColumnCount ?? columnCount;
    console.log('Saving layout with positions and column count:', newPositions, countToSave);
    
    // Validate before saving
    const uniqueIds = new Set(newPositions.map(p => p.id));
    if (uniqueIds.size !== newPositions.length) {
      console.error('Duplicate widget IDs detected!', newPositions);
      toast.error('Cannot save: duplicate widgets detected');
      return;
    }

    setIsSaving(true);
    try {
      // Update local state first
      setPositions(newPositions);
      if (newColumnCount !== undefined) {
        setColumnCount(newColumnCount);
      }
      
// Save in new format with both positions and columnCount
      const layoutData: LayoutData = {
        positions: newPositions,
        columnCount: countToSave,
        version: CURRENT_OVERVIEW_LAYOUT_VERSION,
      };
      
      // Then save to database
      const { error } = await supabase
        .from('user_settings')
        .update({
          layout_json: layoutData as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      console.log('Layout saved successfully');
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast.error('Failed to save layout');
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

  const addWidget = useCallback((widgetId: string, shouldSave: boolean = true) => {
    if (positions.find(p => p.id === widgetId)) {
      toast.info('Widget already added');
      return;
    }

    const maxRow = Math.max(0, ...positions.map(p => p.row));
    const newPositions = [...positions, { id: widgetId, column: 0, row: maxRow + 1 }];
    setPositions(newPositions);
    
    // Only save if explicitly requested (not during customize mode)
    if (shouldSave) {
      saveLayout(newPositions);
    }
    
    toast.success('Widget added');
  }, [positions, saveLayout]);

  const removeWidget = useCallback(async (widgetId: string, shouldSave: boolean = true) => {
    console.log('Removing widget:', widgetId);
    
    // Optimistically update UI immediately
    const newPositions = positions.filter(p => p.id !== widgetId);
    
    // Update state first for immediate UI feedback
    setPositions(newPositions);
    
    // Save to backend only if requested
    if (shouldSave) {
      await saveLayout(newPositions);
    }
    
    toast.success('Widget removed');
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
