import { memo, ReactNode, Suspense } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetResizeControls } from './WidgetResizeControls';
import { WidgetSize, WidgetHeight } from '@/types/widget';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from 'react-error-boundary';

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
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-2 min-h-[150px]">
            <AlertCircle className="h-8 w-8 text-destructive/50" />
            <p className="text-sm font-medium text-destructive">Widget Error</p>
            <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={error.message}>
                {error.message}
            </p>
            <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="h-7 text-xs mt-2">
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
        </div>
    );
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
}: SmartWidgetWrapperProps) => {

    if (isLoading) {
        return (
            <PremiumCard className={cn("h-full flex flex-col p-4 space-y-3", className)}>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-full w-full rounded-lg flex-1" />
            </PremiumCard>
        );
    }

    return (
        <PremiumCard
            className={cn(
                "h-full flex flex-col relative group transition-all duration-200",
                isEditMode && "ring-2 ring-primary/50 scale-[0.99] hover:ring-primary",
                className
            )}
            contentClassName={!hasPadding ? "p-0" : undefined}
            title={title}
            action={headerActions}
        >
            {/* Edit Mode Controls */}
            {isEditMode && (
                <div className="absolute top-2 right-2 z-50 flex gap-1 opacity-100 transition-opacity">
                    <div className="cursor-move p-1.5 rounded bg-background/80 hover:bg-background border border-primary/20 text-primary shadow-sm">
                        <GripVertical className="h-4 w-4" />
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
                            className="h-7 w-7 shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            )}

            {/* Content with Error Boundary */}
            <div className="flex-1 overflow-hidden mt-2">
                <ErrorBoundary
                    FallbackComponent={ErrorFallback}
                    onReset={onRetry}
                >
                    <Suspense fallback={<Skeleton className="h-full w-full" />}>
                        {error ? (
                            <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-2">
                                <AlertCircle className="h-6 w-6 text-destructive/50" />
                                <p className="text-xs text-muted-foreground">{error.message}</p>
                                {onRetry && (
                                    <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 text-xs">
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
    );
});

SmartWidgetWrapper.displayName = 'SmartWidgetWrapper';
