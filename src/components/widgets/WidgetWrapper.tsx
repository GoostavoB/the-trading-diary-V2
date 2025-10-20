import { memo, ReactNode } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Trash2, Maximize2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  id: string;
  title?: string;
  children: ReactNode;
  isEditMode?: boolean;
  onRemove?: () => void;
  onExpand?: () => void;
  className?: string;
  headerActions?: ReactNode;
}

export const WidgetWrapper = memo(({
  id,
  title,
  children,
  isEditMode = false,
  onRemove,
  onExpand,
  className,
  headerActions,
}: WidgetWrapperProps) => {
  return (
    <GlassCard 
      className={cn(
        "relative flex flex-col",
        "transition-all duration-200",
        isEditMode && "ring-2 ring-primary/20 hover:ring-primary/40",
        className
      )}
      style={{ height: 'auto', minHeight: 'fit-content' }}
    >
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          <div className="drag-handle cursor-move p-1.5 rounded bg-background/80 hover:bg-background">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      {title && (
        <div className={cn(
          "flex items-center justify-between px-6 pt-5 pb-3",
          isEditMode && "pt-12"
        )}>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            {headerActions}
            {onExpand && !isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onExpand}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "overflow-visible",
        title ? "px-6 pb-5" : "p-6"
      )}>
        {children}
      </div>
    </GlassCard>
  );
});

WidgetWrapper.displayName = 'WidgetWrapper';
