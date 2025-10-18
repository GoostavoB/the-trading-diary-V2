import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Settings2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  isCustomizing?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: (id: string) => void;
  className?: string;
}

export function DashboardWidget({
  id,
  title,
  children,
  isCustomizing = false,
  isVisible = true,
  onToggleVisibility,
  className
}: DashboardWidgetProps) {
  if (!isVisible && !isCustomizing) return null;

  return (
    <Card 
      className={cn(
        "relative glass h-full transition-all duration-200",
        !isVisible && isCustomizing && "opacity-50 ring-2 ring-destructive/50",
        isCustomizing && "cursor-move hover:shadow-xl hover:border-primary/30",
        className
      )}
    >
      {/* Widget Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2 drag-handle">
          {isCustomizing && (
            <GripVertical className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          )}
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        
        {isCustomizing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
              onClick={() => onToggleVisibility?.(id)}
              title={isVisible ? "Hide widget" : "Show widget"}
            >
              {isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </CardHeader>

      {/* Widget Content */}
      <CardContent className={cn("pb-4", !isVisible && isCustomizing && "pointer-events-none")}>
        {children}
      </CardContent>

      {/* Overlay when customizing and hidden */}
      {isCustomizing && !isVisible && (
        <div className="absolute inset-0 glass-strong rounded-xl flex items-center justify-center">
          <div className="text-center space-y-2">
            <EyeOff className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">Widget Hidden</p>
          </div>
        </div>
      )}
    </Card>
  );
}
