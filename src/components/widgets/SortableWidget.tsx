import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className={`widget-item relative ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'dragging ring-2 ring-primary/60 shadow-2xl shadow-primary/40 rounded-lg' : ''}`}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      {/* Remove button in edit mode */}
      {isEditMode && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 z-50 h-6 w-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      
      {/* Wrap children in measurable content div for masonry */}
      <div className="widget-content group">
        <div className={isDragging ? 'pointer-events-none' : ''}>
          {children}
        </div>
      </div>
    </div>
  );
});

SortableWidget.displayName = 'SortableWidget';
