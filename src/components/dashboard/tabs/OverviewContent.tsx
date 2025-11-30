import { useState, useCallback } from 'react';
import { useDashboard } from '@/providers/dashboard/DashboardProvider';
import { SimplifiedDashboardGrid } from '@/components/dashboard/SimplifiedDashboardGrid';
import { useGridLayout } from '@/hooks/useGridLayout';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { resolveLayoutCollisions, toGridWidgets } from '@/utils/gridValidator';

interface OverviewContentProps {
    renderWidget: (widget: any) => React.ReactNode;
}

export function OverviewContent({ renderWidget }: OverviewContentProps) {
    const { loading } = useDashboard();
    const { activeSubAccount } = useSubAccount();
    const activeSubAccountId = activeSubAccount?.id || null;

    const {
        positions,
        order,
        updatePosition,
        saveLayout,
        isLoading: isLayoutLoading,
        columnCount
    } = useGridLayout(activeSubAccountId);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        // Optional: Add any specific start logic here
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(order, oldIndex, newIndex);

            // Reconstruct widgets with new order to recalculate positions
            const orderedWidgets = newOrder.map(id => {
                const pos = positions.find(p => p.id === id);
                return {
                    id,
                    column: pos?.column || 0,
                    row: pos?.row || 0,
                    size: pos?.size || 2,
                    height: pos?.height || 2
                };
            });

            const newPositions = resolveLayoutCollisions(
                toGridWidgets(orderedWidgets),
                columnCount
            );

            saveLayout(newPositions, newOrder, columnCount);
        }
    }, [order, positions, columnCount, saveLayout]);

    const handleDragCancel = useCallback(() => {
        // Optional: Add cancel logic
    }, []);

    if (loading || isLayoutLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <SimplifiedDashboardGrid
            positions={positions}
            order={order}
            columnCount={columnCount}
            isCustomizing={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            renderWidget={renderWidget}
        />
    );
}
