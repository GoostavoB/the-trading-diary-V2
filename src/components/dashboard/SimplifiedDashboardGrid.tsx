import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { useState, useMemo } from 'react';
import { WidgetPosition } from '@/hooks/useGridLayout';
import { WIDGET_SIZE_TO_COLUMNS, WidgetSize } from '@/types/widget';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { SortableWidget } from './SortableWidget';
import { calculateDensity } from '@/hooks/useAdaptiveWidgetSize';

interface SimplifiedDashboardGridProps {
    positions: WidgetPosition[];
    order: string[];
    columnCount: number;
    isCustomizing: boolean;
    onDragStart?: (event: DragStartEvent) => void;
    onDragEnd?: (event: DragEndEvent) => void;
    onDragCancel?: () => void;
    renderWidget: (widgetId: string) => React.ReactNode;
    className?: string;
}

// Get minimum height class based on widget size and density
function getMinHeightClass(size: WidgetSize, widgetCount: number): string {
    const density = calculateDensity(widgetCount);
    
    const heights: Record<string, Record<WidgetSize, string>> = {
        spacious: { small: 'min-h-[140px]', medium: 'min-h-[180px]', large: 'min-h-[160px]' },
        comfortable: { small: 'min-h-[120px]', medium: 'min-h-[150px]', large: 'min-h-[130px]' },
        compact: { small: 'min-h-[100px]', medium: 'min-h-[130px]', large: 'min-h-[110px]' },
        dense: { small: 'min-h-[80px]', medium: 'min-h-[110px]', large: 'min-h-[90px]' },
    };
    
    return heights[density]?.[size] || 'min-h-[100px]';
}

export function SimplifiedDashboardGrid({
    positions,
    order,
    columnCount,
    isCustomizing,
    onDragStart,
    onDragEnd,
    onDragCancel,
    renderWidget,
    className
}: SimplifiedDashboardGridProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const widgetCount = order.length;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        if (onDragStart) onDragStart(event);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        if (onDragEnd) onDragEnd(event);
    };

    const handleDragCancel = () => {
        setActiveId(null);
        if (onDragCancel) onDragCancel();
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    // Calculate gap based on density
    const gapClass = useMemo(() => {
        const density = calculateDensity(widgetCount);
        switch (density) {
            case 'spacious': return 'gap-4';
            case 'comfortable': return 'gap-3';
            case 'compact': return 'gap-2';
            case 'dense': return 'gap-1.5';
            default: return 'gap-3';
        }
    }, [widgetCount]);

    const getGridCols = () => {
        switch (columnCount) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-2';
            case 3: return 'grid-cols-3';
            case 4: return 'grid-cols-4';
            case 6: return 'grid-cols-6';
            default: return 'grid-cols-3';
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext items={order} strategy={rectSortingStrategy}>
                <div
                    className={cn(
                        "grid transition-all duration-300",
                        getGridCols(),
                        gapClass,
                        className
                    )}
                    style={{
                        gridAutoRows: 'minmax(0, 1fr)',
                        gridAutoFlow: 'dense',
                        maxHeight: 'calc(100vh - 220px)',
                        overflow: 'hidden',
                    }}
                >
                    {order.map((id) => {
                        const position = positions.find(p => p.id === id);
                        const widgetSize = position?.size || 'medium';
                        const sizeInColumns = WIDGET_SIZE_TO_COLUMNS[widgetSize] || 1;
                        const colSpan = `col-span-${Math.min(sizeInColumns, columnCount)}`;
                        const minHeightClass = getMinHeightClass(widgetSize, widgetCount);

                        return (
                            <SortableWidget
                                key={id}
                                id={id}
                                className={cn(colSpan, minHeightClass)}
                            >
                                {renderWidget(id)}
                            </SortableWidget>
                        );
                    })}
                </div>
            </SortableContext>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <div className="opacity-80 scale-105 cursor-grabbing">
                            {renderWidget(activeId)}
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
