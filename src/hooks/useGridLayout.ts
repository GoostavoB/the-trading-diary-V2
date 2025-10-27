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
  // Row 0: Total Trading Profit (most important widget)
  { id: 'absoluteProfit', column: 0, row: 0 },
  
  // Row 1: Current ROI / Win Rate / Avg PNL Per Trade / Avg PNL Per Day
  { id: 'currentROI', column: 0, row: 1 },
  { id: 'winRate', column: 1, row: 1 },
  { id: 'avgPnLPerTrade', column: 2, row: 1 },
  { id: 'avgPnLPerDay', column: 3, row: 1 },
  
  // Row 2: Capital Growth / Weekly Heatmap / Top Movers
  { id: 'capitalGrowth', column: 0, row: 2 },
  { id: 'heatmap', column: 1, row: 2 },
  { id: 'topMovers', column: 2, row: 2 },
  
  // Row 3: Trading Behaviour Patterns
  { id: 'behaviorAnalytics', column: 0, row: 3 },
  
  // Additional widgets
  { id: 'totalBalance', column: 0, row: 4 },
  { id: 'spotWallet', column: 1, row: 4 },
  { id: 'totalTrades', column: 2, row: 4 },
  { id: 'goals', column: 3, row: 4 },
  { id: 'recentTransactions', column: 0, row: 5 },
  { id: 'quickActions', column: 1, row: 5 },
  { id: 'aiInsights', column: 2, row: 5 },
];

export const useGridLayout = (userId: string | undefined, availableWidgets: string[]) => {
  const [positions, setPositions] = useState<WidgetPosition[]>(DEFAULT_POSITIONS);
  const [columnCount, setColumnCount] = useState<number>(4);
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
          
          // Check if layout_json is empty object
          const isEmptyObject = typeof layoutData === 'object' && 
                               !Array.isArray(layoutData) && 
                               Object.keys(layoutData).length === 0;
          
          if (isEmptyObject) {
            console.log('Empty layout object, using DEFAULT_POSITIONS');
            setPositions(DEFAULT_POSITIONS);
            setColumnCount(4);
          }
          // Handle new format with positions and columnCount
          else if (layoutData?.positions && Array.isArray(layoutData.positions)) {
            console.log('Loading layout with column count:', layoutData);
            const desiredCols = (typeof layoutData.columnCount === 'number' && layoutData.columnCount >= 1 && layoutData.columnCount <= 4)
              ? layoutData.columnCount
              : 4;

            // If positions array is empty, use defaults
            if (layoutData.positions.length === 0) {
              console.log('Empty positions array, using DEFAULT_POSITIONS');
              setPositions(DEFAULT_POSITIONS);
              setColumnCount(4);
            } else {
              const allInCol0 = layoutData.positions.every((p: WidgetPosition) => p.column === 0);
              if (allInCol0 && desiredCols > 1) {
                console.log('Detected legacy single-column layout. Rebalancing to', desiredCols, 'columns');
                const sorted = [...layoutData.positions].sort((a: WidgetPosition, b: WidgetPosition) => a.row - b.row);
                const rebalanced: WidgetPosition[] = sorted.map((p, idx) => ({
                  id: p.id,
                  column: idx % desiredCols,
                  row: Math.floor(idx / desiredCols),
                }));
                setPositions(rebalanced);
                setColumnCount(desiredCols);
                toast.success('Layout fixed to multiple columns');
                // Persist fix immediately to backend
                try {
                  const layoutToSave: LayoutData = { positions: rebalanced, columnCount: desiredCols };
                  await supabase
                    .from('user_settings')
                    .update({ layout_json: layoutToSave as any, updated_at: new Date().toISOString() })
                    .eq('user_id', userId!);
                } catch (e) {
                  console.error('Failed to persist layout auto-fix:', e);
                }
              } else {
                setPositions(layoutData.positions);
                setColumnCount(desiredCols);
              }
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
              column: idx % 4,
              row: Math.floor(idx / 4),
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
