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
        "relative bg-card border-border transition-all duration-200",
        !isVisible && isCustomizing && "opacity-50",
        isCustomizing && "cursor-move hover:shadow-lg hover:border-accent/50",
        className
      )}
    >
      {/* Widget Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2 drag-handle">
          {isCustomizing && (
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          )}
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        
        {isCustomizing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
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
      <CardContent className={cn(!isVisible && isCustomizing && "pointer-events-none")}>
        {children}
      </CardContent>

      {/* Overlay when customizing and hidden */}
      {isCustomizing && !isVisible && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Widget Hidden</p>
        </div>
      )}
    </Card>
  );
}
