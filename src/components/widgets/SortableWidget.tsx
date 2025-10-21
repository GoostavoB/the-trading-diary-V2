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
    transition: transition || 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? '1.02' : '1',
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget-item relative transition-all duration-200 ${
        isDragging 
          ? 'shadow-2xl shadow-primary/30 ring-2 ring-primary/50' 
          : 'hover:shadow-lg'
      }`}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            className="drag-handle h-8 w-8 cursor-grab active:cursor-grabbing bg-background/95 backdrop-blur-sm hover:bg-primary/10 hover:scale-110 transition-all duration-200 shadow-md"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 bg-background/95 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground hover:scale-110 transition-all duration-200 shadow-md"
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
