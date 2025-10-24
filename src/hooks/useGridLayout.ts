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
}

const DEFAULT_POSITIONS: WidgetPosition[] = [
  { id: 'totalBalance', column: 0, row: 0 },
  { id: 'winRate', column: 1, row: 0 },
  { id: 'totalTrades', column: 2, row: 0 },
  { id: 'portfolioOverview', column: 0, row: 1 },
  { id: 'spotWallet', column: 1, row: 1 },
  { id: 'topMovers', column: 2, row: 1 },
  { id: 'recentTransactions', column: 0, row: 2 },
  { id: 'quickActions', column: 1, row: 2 },
  { id: 'capitalGrowth', column: 0, row: 3 },
  { id: 'avgPnLPerTrade', column: 1, row: 3 },
  { id: 'avgPnLPerDay', column: 2, row: 3 },
  { id: 'currentROI', column: 0, row: 4 },
  { id: 'avgROIPerTrade', column: 1, row: 4 },
];

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
          
          // Handle new format with positions and columnCount
          if (layoutData?.positions && Array.isArray(layoutData.positions)) {
            console.log('Loading layout with column count:', layoutData);
            setPositions(layoutData.positions);
            if (layoutData.columnCount && layoutData.columnCount >= 1 && layoutData.columnCount <= 4) {
              setColumnCount(layoutData.columnCount);
            }
          }
          // Handle position-based format (backwards compatibility)
          else if (Array.isArray(layoutData) && layoutData.length > 0 && layoutData[0]?.column !== undefined) {
            console.log('Loading position-based layout:', layoutData);
            setPositions(layoutData);
          }
          // Handle old order-based format - convert to positions
          else if (Array.isArray(layoutData) && layoutData.length > 0 && typeof layoutData[0] === 'string') {
            console.log('Converting old layout format:', layoutData);
            const newPositions = layoutData.map((id: string, idx: number) => ({
              id,
              column: idx % 3,
              row: Math.floor(idx / 3),
            }));
            setPositions(newPositions);
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

  const addWidget = useCallback((widgetId: string) => {
    if (positions.find(p => p.id === widgetId)) {
      toast.info('Widget already added');
      return;
    }

    const maxRow = Math.max(0, ...positions.map(p => p.row));
    const newPositions = [...positions, { id: widgetId, column: 0, row: maxRow + 1 }];
    setPositions(newPositions);
    saveLayout(newPositions);
    toast.success('Widget added');
  }, [positions, saveLayout]);

  const removeWidget = useCallback(async (widgetId: string) => {
    console.log('Removing widget:', widgetId);
    
    // Optimistically update UI immediately
    const newPositions = positions.filter(p => p.id !== widgetId);
    
    // Update state first for immediate UI feedback
    setPositions(newPositions);
    
    // Save to backend
    await saveLayout(newPositions);
    
    toast.success('Widget removed');
  }, [positions, saveLayout]);

  const resetLayout = useCallback(() => {
    setPositions(DEFAULT_POSITIONS);
    saveLayout(DEFAULT_POSITIONS);
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
