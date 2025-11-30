import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
    id: string;
    children: ReactNode;
    className?: string;
}

export function SortableWidget({ id, children, className }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("h-full", className)}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
}
