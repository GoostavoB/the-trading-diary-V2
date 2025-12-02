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
import { useState } from 'react';
import { WidgetPosition } from '@/hooks/useGridLayout';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { SortableWidget } from './SortableWidget';

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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts to prevent accidental drags
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

    // Calculate grid template columns based on column count
    // We use a 6-column grid system internally for flexibility
    // 1 column mode = 1 fr
    // 2 column mode = repeat(2, 1fr)
    // 3 column mode = repeat(3, 1fr)
    // 6 column mode = repeat(6, 1fr)

    const getGridCols = () => {
        switch (columnCount) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-2';
            case 3: return 'grid-cols-3';
            case 4: return 'grid-cols-4'; // Legacy support
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
                        "grid gap-3 auto-rows-[minmax(180px,auto)] transition-all duration-300",
                        getGridCols(),
                        className
                    )}
                >
                    {order.map((id) => {
                        const position = positions.find(p => p.id === id);
                        const colSpan = position?.size ? `col-span-${Math.min(position.size, columnCount)}` : 'col-span-1';
                        const rowSpan = position?.height ? `row-span-${position.height / 2}` : 'row-span-1';

                        return (
                            <SortableWidget
                                key={id}
                                id={id}
                                className={cn(colSpan, rowSpan)}
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
                            {/* We might need a simplified preview here or clone the widget */}
                            {/* For now, just render the widget content */}
                            {renderWidget(activeId)}
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
