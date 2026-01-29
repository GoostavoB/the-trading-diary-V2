import { memo, ReactNode, Suspense, createContext, useContext } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetResizeControls } from './WidgetResizeControls';
import { WidgetSize, WidgetHeight } from '@/types/widget';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from 'react-error-boundary';
import { calculateDensity, WidgetDensity } from '@/hooks/useAdaptiveWidgetSize';

// Context to pass widget count down to child widgets
export const WidgetDensityContext = createContext<WidgetDensity>('comfortable');

export function useWidgetDensity() {
  return useContext(WidgetDensityContext);
}

interface SmartWidgetWrapperProps {
    id: string;
    title?: string;
    children: ReactNode;
    isLoading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
    isEditMode?: boolean;
    onRemove?: () => void;
    onResize?: (newSize?: WidgetSize, newHeight?: WidgetHeight) => void;
    currentSize?: WidgetSize;
    currentHeight?: WidgetHeight;
    className?: string;
    headerActions?: ReactNode;
    hasPadding?: boolean;
    widgetCount?: number; // Total widgets on dashboard for density calculation
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-3 text-center space-y-1.5">
            <AlertCircle className="h-6 w-6 text-destructive/50" />
            <p className="text-xs font-medium text-destructive">Widget Error</p>
            <p className="text-[10px] text-muted-foreground max-w-[180px] truncate" title={error.message}>
                {error.message}
            </p>
            <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="h-6 text-[10px] mt-1">
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
        </div>
    );
}

// Get padding class based on density
function getPaddingClass(density: WidgetDensity, hasPadding: boolean): string {
    if (!hasPadding) return '';
    switch (density) {
        case 'spacious': return 'p-5';
        case 'comfortable': return 'p-4';
        case 'compact': return 'p-3';
        case 'dense': return 'p-2';
        default: return 'p-3';
    }
}

export const SmartWidgetWrapper = memo(({
    id,
    title,
    children,
    isLoading = false,
    error = null,
    onRetry,
    isEditMode = false,
    onRemove,
    onResize,
    currentSize,
    currentHeight,
    className,
    headerActions,
    hasPadding = true,
    widgetCount = 6, // Default to comfortable density
}: SmartWidgetWrapperProps) => {
    const density = calculateDensity(widgetCount);
    const paddingClass = getPaddingClass(density, hasPadding);

    if (isLoading) {
        return (
            <PremiumCard className={cn("h-full flex flex-col space-y-2", paddingClass, className)}>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                </div>
                <Skeleton className="h-full w-full rounded-lg flex-1" />
            </PremiumCard>
        );
    }

    return (
        <WidgetDensityContext.Provider value={density}>
            <PremiumCard
                className={cn(
                    "h-full flex flex-col relative group transition-all duration-200",
                    isEditMode && "ring-2 ring-primary/50 scale-[0.99] hover:ring-primary",
                    className
                )}
                contentClassName={!hasPadding ? "p-0" : paddingClass}
                title={title}
                action={headerActions}
            >
                {/* Edit Mode Controls */}
                {isEditMode && (
                    <div className="absolute top-1.5 right-1.5 z-50 flex gap-0.5 opacity-100 transition-opacity">
                        <div className="cursor-move p-1 rounded bg-background/80 hover:bg-background border border-primary/20 text-primary shadow-sm">
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>

                        {onResize && currentSize && currentHeight && (
                            <WidgetResizeControls
                                currentSize={currentSize}
                                currentHeight={currentHeight}
                                onResize={onResize}
                            />
                        )}

                        {onRemove && (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Content with Error Boundary */}
                <div className="flex-1 overflow-hidden">
                    <ErrorBoundary
                        FallbackComponent={ErrorFallback}
                        onReset={onRetry}
                    >
                        <Suspense fallback={<Skeleton className="h-full w-full" />}>
                            {error ? (
                                <div className="flex flex-col items-center justify-center h-full p-3 text-center space-y-1.5">
                                    <AlertCircle className="h-5 w-5 text-destructive/50" />
                                    <p className="text-[10px] text-muted-foreground">{error.message}</p>
                                    {onRetry && (
                                        <Button variant="ghost" size="sm" onClick={onRetry} className="h-5 text-[10px]">
                                            Retry
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                children
                            )}
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </PremiumCard>
        </WidgetDensityContext.Provider>
    );
});

SmartWidgetWrapper.displayName = 'SmartWidgetWrapper';
