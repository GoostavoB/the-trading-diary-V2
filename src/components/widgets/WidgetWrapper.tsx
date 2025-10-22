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
  isCompact?: boolean;
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
  isCompact = false,
  onRemove,
  onExpand,
  className,
  headerActions,
}: WidgetWrapperProps) => {
  return (
    <GlassCard 
      className={cn(
        "relative flex flex-col overflow-hidden",
        "transition-all duration-300",
        isEditMode && "animate-border-pulse",
        isCompact && "widget-compact",
        className
      )}
    >
      {/* Elegant Shimmer Effect for Edit Mode */}
      {isEditMode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div 
            className="absolute inset-y-0 w-1/2 -left-1/2 animate-shimmer opacity-50"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)',
            }}
          />
        </div>
      )}
      
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          <div className="drag-handle cursor-move p-1.5 rounded bg-background/95 hover:bg-background shadow-md border border-primary/40">
            <GripVertical className="h-4 w-4 text-primary" />
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/95 hover:bg-destructive hover:text-destructive-foreground shadow-md border border-primary/40"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-visible",
        isCompact ? "px-4 py-3" : "px-6 py-4"
      )}>
        {title && (
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn("font-semibold", isCompact ? "text-base" : "text-lg")}>{title}</h3>
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
        {children}
      </div>
    </GlassCard>
  );
});

WidgetWrapper.displayName = 'WidgetWrapper';
