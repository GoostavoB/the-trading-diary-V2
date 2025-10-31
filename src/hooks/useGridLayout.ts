import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/config/widgetCatalog';

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
  // Row 0: Starter Pack - Core metrics (always unlocked)
  { id: 'winRate', column: 0, row: 0 },
  { id: 'currentROI', column: 1, row: 0 },
  { id: 'totalTrades', column: 2, row: 0 },
  { id: 'avgPnLPerDay', column: 3, row: 0 },
  
  // Row 1: Total Balance / Absolute Profit / Avg PNL Per Trade / Capital Growth
  { id: 'totalBalance', column: 0, row: 1 },
  { id: 'absoluteProfit', column: 1, row: 1 },
  { id: 'avgPnLPerTrade', column: 2, row: 1 },
  { id: 'capitalGrowth', column: 3, row: 1 },
  
  // Row 2: Quick Actions / Recent Transactions / Spot Wallet / Top Movers
  { id: 'quickActions', column: 0, row: 2 },
  { id: 'recentTransactions', column: 1, row: 2 },
  { id: 'spotWallet', column: 2, row: 2 },
  { id: 'topMovers', column: 3, row: 2 },
  
  // Row 3: Trading Quality / Weekly Heatmap / Goals
  { id: 'tradingQuality', column: 0, row: 3 },
  { id: 'heatmap', column: 1, row: 3 },
  { id: 'goals', column: 2, row: 3 },
  
  // Row 4: Behavior Analytics / Week Performance
  { id: 'behaviorAnalytics', column: 0, row: 4 },
  { id: 'weekPerformance', column: 2, row: 4 },
  
  // Row 5: AI Insights / Weekly PnL Chart
  { id: 'aiInsights', column: 0, row: 5 },
  { id: 'weeklyPnLChart', column: 2, row: 5 },
];

export const useGridLayout = (userId: string | undefined, availableWidgets: string[]) => {
  const [positions, setPositions] = useState<WidgetPosition[]>(DEFAULT_POSITIONS);
  const [columnCount, setColumnCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Helper: Pack widgets row-major with absoluteProfit at top-left
  const packRowMajor = useCallback((ids: string[], columns: number): WidgetPosition[] => {
    const allowed = ids.filter(id => availableWidgets.includes(id));
    const unique = Array.from(new Set(allowed));
    
    // Ensure absoluteProfit is first
    const first = 'absoluteProfit';
    const rest = unique.filter(id => id !== first);
    const all = unique.includes(first) ? [first, ...rest] : unique;
    
    return all.map((id, idx) => ({
      id,
      column: idx % columns,
      row: Math.floor(idx / columns),
    }));
  }, [availableWidgets]);

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

        if (!data?.layout_json) {
          // No saved layout - create first-time default with 3 columns
          console.log('[useGridLayout] No saved layout, creating default with 3 columns');
          const packed = packRowMajor(DEFAULT_DASHBOARD_LAYOUT, 3);
          setPositions(packed);
          setColumnCount(3);
          
          // Persist immediately so user's first view becomes their preference
          try {
            const layoutToSave: LayoutData = { positions: packed, columnCount: 3 };
            await supabase
              .from('user_settings')
              .update({ layout_json: layoutToSave as any, updated_at: new Date().toISOString() })
              .eq('user_id', userId!);
            console.log('[useGridLayout] Default layout persisted');
          } catch (e) {
            console.error('[useGridLayout] Failed to persist default layout:', e);
          }
        } else {
          const layoutData = data.layout_json as any;
          
          // Check if layout_json is empty object
          const isEmptyObject = typeof layoutData === 'object' && 
                               !Array.isArray(layoutData) && 
                               Object.keys(layoutData).length === 0;
          
          if (isEmptyObject) {
            console.log('[useGridLayout] Empty layout object, creating default');
            const packed = packRowMajor(DEFAULT_DASHBOARD_LAYOUT, 3);
            setPositions(packed);
            setColumnCount(3);
            
            try {
              const layoutToSave: LayoutData = { positions: packed, columnCount: 3 };
              await supabase
                .from('user_settings')
                .update({ layout_json: layoutToSave as any, updated_at: new Date().toISOString() })
                .eq('user_id', userId!);
            } catch (e) {
              console.error('[useGridLayout] Failed to persist default:', e);
            }
          }
          // Handle new format with positions and columnCount
          else if (layoutData?.positions && Array.isArray(layoutData.positions)) {
            console.log('[useGridLayout] Loading saved layout:', layoutData);
            const desiredCols = (typeof layoutData.columnCount === 'number' && layoutData.columnCount >= 1 && layoutData.columnCount <= 4)
              ? layoutData.columnCount
              : 3;

            // If positions array is empty, create default
            if (layoutData.positions.length === 0) {
              console.log('[useGridLayout] Empty positions array, creating default');
              const packed = packRowMajor(DEFAULT_DASHBOARD_LAYOUT, 3);
              setPositions(packed);
              setColumnCount(3);
              
              try {
                const layoutToSave: LayoutData = { positions: packed, columnCount: 3 };
                await supabase
                  .from('user_settings')
                  .update({ layout_json: layoutToSave as any, updated_at: new Date().toISOString() })
                  .eq('user_id', userId!);
              } catch (e) {
                console.error('[useGridLayout] Failed to persist default:', e);
              }
            } else {
              // Check for legacy single-column bug (all widgets in column 0 but desiredCols > 1)
              const allInCol0 = layoutData.positions.every((p: WidgetPosition) => p.column === 0);
              if (allInCol0 && desiredCols > 1) {
                console.log('[useGridLayout] Detected legacy single-column layout. Rebalancing to', desiredCols, 'columns');
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
                  console.error('[useGridLayout] Failed to persist layout auto-fix:', e);
                }
              } else {
                // Valid user layout - check if absoluteProfit needs to be moved to top-left
                const absoluteProfitPos = layoutData.positions.find((p: WidgetPosition) => p.id === 'absoluteProfit');
                
                if (absoluteProfitPos && (absoluteProfitPos.column !== 0 || absoluteProfitPos.row !== 0)) {
                  console.log('[useGridLayout] Moving absoluteProfit to top-left');
                  
                  // Re-pack with absoluteProfit at top-left
                  const activeIds = layoutData.positions.map((p: WidgetPosition) => p.id);
                  const corrected = packRowMajor(activeIds, desiredCols);
                  
                  setPositions(corrected);
                  setColumnCount(desiredCols);
                  
                  // Persist the correction
                  try {
                    const layoutToSave: LayoutData = { positions: corrected, columnCount: desiredCols };
                    await supabase
                      .from('user_settings')
                      .update({ layout_json: layoutToSave as any, updated_at: new Date().toISOString() })
                      .eq('user_id', userId!);
                    toast.info('Total Trading Profit moved to top-left');
                  } catch (e) {
                    console.error('[useGridLayout] Failed to persist correction:', e);
                  }
                } else {
                  // Valid user layout - respect it completely
                  setPositions(layoutData.positions);
                  setColumnCount(desiredCols);
                  console.log('[useGridLayout] User layout loaded:', desiredCols, 'columns');
                }
              }
            }
          }
          // Handle position-based format (backwards compatibility)
          else if (Array.isArray(layoutData) && layoutData.length > 0 && layoutData[0]?.column !== undefined) {
            console.log('[useGridLayout] Loading position-based layout:', layoutData);
            setPositions(layoutData);
          }
          // Handle old order-based format - convert to positions
          else if (Array.isArray(layoutData) && layoutData.length > 0 && typeof layoutData[0] === 'string') {
            console.log('[useGridLayout] Converting old layout format:', layoutData);
            const newPositions = layoutData.map((id: string, idx: number) => ({
              id,
              column: idx % 3,
              row: Math.floor(idx / 3),
            }));
            setPositions(newPositions);
            setColumnCount(3);
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
    
    const removedWidget = positions.find(p => p.id === widgetId);
    if (!removedWidget) return;

    // Filter out the removed widget
    let newPositions = positions.filter(p => p.id !== widgetId);
    
    // Column Compaction: Move widgets below the removed one up
    newPositions = newPositions.map(p => {
      if (p.column === removedWidget.column && p.row > removedWidget.row) {
        return { ...p, row: p.row - 1 };
      }
      return p;
    });
    
    // Update state first for immediate UI feedback
    setPositions(newPositions);
    
    // Save to backend
    await saveLayout(newPositions);
    
    toast.success('Widget removed');
  }, [positions, saveLayout]);

  const resetLayout = useCallback(() => {
    // Re-pack using current column count (respects user's column preference)
    const packed = packRowMajor(DEFAULT_DASHBOARD_LAYOUT, columnCount);
    setPositions(packed);
    saveLayout(packed, columnCount);
    toast.success('Layout reset');
  }, [saveLayout, columnCount]);

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
