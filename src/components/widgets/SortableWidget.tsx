import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memo } from 'react';

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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="widget-item relative"
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="drag-handle h-8 w-8 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur-sm hover:bg-background/90"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {children}
    </div>
  );
});

SortableWidget.displayName = 'SortableWidget';
