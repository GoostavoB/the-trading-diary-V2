import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memo, useEffect, useRef, useState } from 'react';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
  onRemove: () => void;
}

export const SortableWidget = memo(({ id, children, isEditMode, onRemove }: SortableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [lockedSize, setLockedSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (isDragging && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setLockedSize({ width: rect.width, height: rect.height });
    } else if (!isDragging) {
      setLockedSize(null);
    }
  }, [isDragging]);

  const transformStr = transform
    ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
    : undefined;

  const style = {
    transform: transformStr,
    transition: isDragging ? 'transform 0s linear' : (transition || undefined),
    opacity: 1,
    touchAction: 'none',
    zIndex: isDragging ? 1000 : 'auto',
    width: isDragging && lockedSize ? `${lockedSize.width}px` : undefined,
    height: isDragging && lockedSize ? `${lockedSize.height}px` : undefined,
  } as React.CSSProperties;

  return (
    <div
      ref={(el) => { setNodeRef(el); nodeRef.current = el; }}
      style={style}
      data-sortable-id={id}
      className={`widget-item relative ${isEditMode ? '' : ''} ${isDragging ? 'dragging ring-2 ring-primary/60 shadow-2xl shadow-primary/40 rounded-lg' : ''}`}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 select-none pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="drag-handle h-8 w-8 cursor-grab active:cursor-grabbing bg-background/95 backdrop-blur-sm hover:bg-primary/10 hover:scale-105 transition-all duration-150"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 bg-background/95 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground hover:scale-105 transition-all duration-150"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={isDragging ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
});

SortableWidget.displayName = 'SortableWidget';
