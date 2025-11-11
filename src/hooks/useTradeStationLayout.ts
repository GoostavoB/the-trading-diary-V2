import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TradeStationWidgetPosition {
  id: string;
  column: number;
  row: number;
}

interface TradeStationLayoutData {
  positions: TradeStationWidgetPosition[];
  columnCount: number;
  version?: number;
}

// Default widgets for Trade Station
const DEFAULT_TRADE_STATION_POSITIONS: TradeStationWidgetPosition[] = [
  // Row 1: Leverage, Risk, Error Reflection
  { id: 'simpleLeverage', column: 0, row: 0 },
  { id: 'riskCalculator', column: 1, row: 0 },
  { id: 'errorReflection', column: 2, row: 0 },
  // Row 2: Rolling Target (spans all columns)
  { id: 'rollingTarget', column: 0, row: 1 },
];

const CURRENT_TRADE_STATION_LAYOUT_VERSION = 2;

export const useTradeStationLayout = (userId: string | undefined) => {
  const [positions, setPositions] = useState<TradeStationWidgetPosition[]>(DEFAULT_TRADE_STATION_POSITIONS);
  const [columnCount, setColumnCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load layout from database
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('trade_station_layout_json')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error loading Trade Station layout:', error);
          return;
        }

if (data?.trade_station_layout_json) {
  const layoutData = data.trade_station_layout_json as any;
  
  // Consider newer/older versions or invalid shapes as outdated
  const hasValidLegacyPositions = Array.isArray(layoutData.positions) && layoutData.positions.every((p: any) => 
    p && typeof p.id === 'string' && typeof p.column === 'number' && typeof p.row === 'number'
  );
  const isVersionMismatch = !layoutData.version || layoutData.version !== CURRENT_TRADE_STATION_LAYOUT_VERSION;
  
  if (hasValidLegacyPositions && !isVersionMismatch) {
    setPositions(layoutData.positions);
    if (typeof layoutData.columnCount === 'number') {
      setColumnCount(layoutData.columnCount);
    }
  } else {
    // Attempt simple migration from x/y format (from a newer resizable layout), else fallback to defaults
    const looksLikeXY = Array.isArray(layoutData.positions) && layoutData.positions.every((p: any) => 
      p && typeof p.id === 'string' && typeof p.x === 'number' && typeof p.y === 'number'
    );

    if (looksLikeXY) {
      const cols = typeof layoutData.columnCount === 'number' ? layoutData.columnCount : 3;
      const migrated: TradeStationWidgetPosition[] = layoutData.positions.map((p: any) => ({
        id: p.id,
        column: Math.max(0, Math.min(cols - 1, Number.isFinite(p.x) ? p.x : 0)),
        row: Math.max(0, Number.isFinite(p.y) ? p.y : 0),
      }));

      setPositions(migrated);
      setColumnCount(cols);
      await saveLayout(migrated, cols);
    } else {
      // Saved layout is missing or invalid - enforce latest defaults
      setPositions(DEFAULT_TRADE_STATION_POSITIONS);
      setColumnCount(3);
      await saveLayout(DEFAULT_TRADE_STATION_POSITIONS, 3);
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
  const saveLayout = useCallback(async (newPositions: TradeStationWidgetPosition[], newColumnCount?: number) => {
    if (!userId) return;

    setIsSaving(true);
    try {
const layoutData: TradeStationLayoutData = {
        positions: newPositions,
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
        throw error;
      }

      setPositions(newPositions);
      if (newColumnCount !== undefined) {
        setColumnCount(newColumnCount);
      }
      
      toast.success('Trade Station layout saved');
    } catch (error) {
      console.error('Failed to save Trade Station layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [userId, columnCount]);

  // Update position of a specific widget
  const updatePosition = useCallback((widgetId: string, column: number, row: number) => {
    setPositions(prev => {
      const updated = prev.map(p =>
        p.id === widgetId ? { ...p, column, row } : p
      );
      return updated;
    });
  }, []);

  // Add widget to layout
  const addWidget = useCallback((widgetId: string) => {
    if (positions.find(p => p.id === widgetId)) {
      toast.info('Widget already added');
      return;
    }

    // Find the first available spot
    const grid: { [col: number]: { [row: number]: boolean } } = {};
    positions.forEach(pos => {
      if (!grid[pos.column]) grid[pos.column] = {};
      grid[pos.column][pos.row] = true;
    });

    // Find first empty slot
    let targetCol = 0;
    let targetRow = 0;
    for (let col = 0; col < columnCount; col++) {
      let row = 0;
      while (grid[col]?.[row]) {
        row++;
      }
      if (row < 10) { // Max 10 rows
        targetCol = col;
        targetRow = row;
        break;
      }
    }

    const newPositions = [...positions, { id: widgetId, column: targetCol, row: targetRow }];
    saveLayout(newPositions);
  }, [positions, columnCount, saveLayout]);

  // Remove widget from layout
  const removeWidget = useCallback((widgetId: string) => {
    const newPositions = positions.filter(p => p.id !== widgetId);
    saveLayout(newPositions);
  }, [positions, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    saveLayout(DEFAULT_TRADE_STATION_POSITIONS, 3);
    toast.success('Trade Station reset to default');
  }, [saveLayout]);

  // Update column count
  const updateColumnCount = useCallback((count: number) => {
    // Reflow positions to fit new column count
    const sortedPositions = [...positions].sort((a, b) => {
      if (a.column !== b.column) return a.column - b.column;
      return a.row - b.row;
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

    saveLayout(reflowed, count);
  }, [positions, saveLayout]);

  return {
    positions,
    columnCount,
    isLoading,
    isSaving,
    updatePosition,
    saveLayout,
    addWidget,
    removeWidget,
    resetLayout,
    updateColumnCount,
  };
};
