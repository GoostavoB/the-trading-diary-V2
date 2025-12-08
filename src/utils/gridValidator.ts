import { WidgetPosition } from '@/hooks/useGridLayout';
import type { WidgetSize } from '@/types/widget';
import { WIDGET_SIZE_TO_COLUMNS } from '@/types/widget';

export interface GridCell {
  column: number;
  row: number;
}

export interface GridWidget {
  id: string;
  column: number;
  row: number;
  size: WidgetSize;  // 'small' | 'medium' | 'large'
  height: 2 | 4 | 6;
}

const TOTAL_SUBCOLUMNS = 6;

/**
 * Check if a widget fits within grid boundaries
 */
export function isWithinBounds(
  widget: GridWidget,
  totalColumns: number = TOTAL_SUBCOLUMNS
): boolean {
  const widgetColumns = WIDGET_SIZE_TO_COLUMNS[widget.size];
  const endColumn = widget.column + widgetColumns;
  return widget.column >= 0 && endColumn <= totalColumns && widget.row >= 0;
}

/**
 * Check if two widgets overlap in the grid
 */
export function doWidgetsOverlap(
  widget1: GridWidget,
  widget2: GridWidget
): boolean {
  const w1Columns = WIDGET_SIZE_TO_COLUMNS[widget1.size];
  const w2Columns = WIDGET_SIZE_TO_COLUMNS[widget2.size];

  const w1EndCol = widget1.column + w1Columns;
  const w1EndRow = widget1.row + Math.ceil(widget1.height / 2);
  const w2EndCol = widget2.column + w2Columns;
  const w2EndRow = widget2.row + Math.ceil(widget2.height / 2);

  // Check if they don't overlap
  const noOverlap = (
    w1EndCol <= widget2.column || // w1 is completely to the left
    widget1.column >= w2EndCol || // w1 is completely to the right
    w1EndRow <= widget2.row ||    // w1 is completely above
    widget1.row >= w2EndRow       // w1 is completely below
  );

  return !noOverlap;
}

/**
 * Find if placing a widget at a position would cause collisions
 */
export function hasCollision(
  targetWidget: GridWidget,
  allWidgets: GridWidget[],
  excludeId?: string
): boolean {
  return allWidgets.some(w => {
    if (w.id === excludeId || w.id === targetWidget.id) return false;
    return doWidgetsOverlap(targetWidget, w);
  });
}

/**
 * Find the nearest valid position for a widget using spiral search
 */
export function findNearestValidPosition(
  widget: GridWidget,
  targetColumn: number,
  targetRow: number,
  allWidgets: GridWidget[],
  totalColumns: number = TOTAL_SUBCOLUMNS
): GridCell | null {
  // Try the target position first
  const testWidget = { ...widget, column: targetColumn, row: targetRow };

  if (isWithinBounds(testWidget, totalColumns) && !hasCollision(testWidget, allWidgets, widget.id)) {
    return { column: targetColumn, row: targetRow };
  }

  // Search in expanding spiral pattern for nearest valid spot
  const maxSearchDistance = 8;
  for (let distance = 1; distance <= maxSearchDistance; distance++) {
    // Try positions at this distance
    for (let dc = -distance; dc <= distance; dc++) {
      for (let dr = -distance; dr <= distance; dr++) {
        // Skip if not at the edge of current distance (avoid redundant checks)
        if (Math.abs(dc) !== distance && Math.abs(dr) !== distance) continue;

        const newCol = targetColumn + dc;
        const newRow = Math.max(0, targetRow + dr);
        const candidate = { ...widget, column: newCol, row: newRow };

        if (isWithinBounds(candidate, totalColumns) && !hasCollision(candidate, allWidgets, widget.id)) {
          return { column: newCol, row: newRow };
        }
      }
    }
  }

  return null; // No valid position found
}

/**
 * Validate an entire grid layout
 */
export function validateLayout(
  widgets: GridWidget[],
  totalColumns: number = TOTAL_SUBCOLUMNS
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check bounds
  widgets.forEach(widget => {
    if (!isWithinBounds(widget, totalColumns)) {
      errors.push(`Widget ${widget.id} exceeds grid bounds (col: ${widget.column}, size: ${widget.size})`);
    }
  });

  // Check overlaps
  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      if (doWidgetsOverlap(widgets[i], widgets[j])) {
        errors.push(`Widgets ${widgets[i].id} and ${widgets[j].id} overlap`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Test if a swap between two widgets would be valid
 */
export function isValidSwap(
  widget1: GridWidget,
  widget2: GridWidget,
  allWidgets: GridWidget[],
  totalColumns: number = TOTAL_SUBCOLUMNS
): boolean {
  // Create test positions with swapped locations
  const testWidget1 = { ...widget1, column: widget2.column, row: widget2.row };
  const testWidget2 = { ...widget2, column: widget1.column, row: widget1.row };

  // Check if both widgets fit in bounds
  if (!isWithinBounds(testWidget1, totalColumns) || !isWithinBounds(testWidget2, totalColumns)) {
    return false;
  }

  // Create test layout with swapped positions
  const testLayout = allWidgets.map(w => {
    if (w.id === widget1.id) return testWidget1;
    if (w.id === widget2.id) return testWidget2;
    return w;
  });

  // Validate the test layout
  const validation = validateLayout(testLayout, totalColumns);
  return validation.isValid;
}

/**
 * Convert WidgetPosition to GridWidget format for validation
 */
export function toGridWidget(pos: WidgetPosition): GridWidget {
  return {
    id: pos.id,
    column: pos.column,
    row: pos.row,
    size: pos.size,
    height: pos.height
  };
}

/**
 * Convert array of WidgetPositions to GridWidgets
 */
export function toGridWidgets(positions: WidgetPosition[]): GridWidget[] {
  return positions.map(toGridWidget);
}

/**
 * Resolve collisions in a layout by moving overlapping widgets
 */
export function resolveLayoutCollisions(
  widgets: GridWidget[],
  totalColumns: number = TOTAL_SUBCOLUMNS
): GridWidget[] {
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.column - b.column;
  });

  const placedWidgets: GridWidget[] = [];

  for (const widget of sortedWidgets) {
    let newPos = { column: widget.column, row: widget.row };

    // Check if current position is valid
    const testWidget = { ...widget, ...newPos };
    const hasOverlap = hasCollision(testWidget, placedWidgets);
    const inBounds = isWithinBounds(testWidget, totalColumns);

    if (!hasOverlap && inBounds) {
      placedWidgets.push(testWidget);
    } else {
      // Find nearest valid position
      const validPos = findNearestValidPosition(
        widget,
        widget.column,
        widget.row,
        placedWidgets,
        totalColumns
      );

      if (validPos) {
        placedWidgets.push({ ...widget, ...validPos });
      } else {
        // Fallback: append to the bottom
        const maxRow = placedWidgets.reduce((max, w) => Math.max(max, w.row + Math.ceil(w.height / 2)), 0);
        placedWidgets.push({ ...widget, column: 0, row: maxRow });
      }
    }
  }

  return placedWidgets;
}
