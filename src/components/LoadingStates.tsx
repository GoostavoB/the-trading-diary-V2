import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Comprehensive loading state components for consistent UX
 */

// Generic card skeleton
export const CardSkeleton = () => (
  <Card className="p-6 space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </Card>
);

// Stats card skeleton
export const StatCardSkeleton = () => (
  <Card className="p-6">
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  </Card>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <Card className="p-6">
    <Skeleton className="h-4 w-1/3 mb-4" />
    <Skeleton className="w-full" style={{ height: `${height}px` }} />
  </Card>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <Card className="p-6">
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </Card>
);

// Inline loader
export const InlineLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span className="text-sm">{text}</span>
  </div>
);

// Full page loader
export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <Loader2 className="w-12 h-12 animate-spin text-primary" />
    <p className="text-lg text-muted-foreground">{text}</p>
  </div>
);

// Dashboard grid skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton height={400} />
      <ChartSkeleton height={400} />
    </div>

    {/* Table */}
    <TableSkeleton rows={8} columns={6} />
  </div>
);

// Button loading state
export const ButtonLoader = () => (
  <Loader2 className="w-4 h-4 animate-spin mr-2" />
);

// List skeleton
export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <Card key={i} className="p-4 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Card>
    ))}
  </div>
);

// Widget skeleton
export const WidgetSkeleton = () => (
  <Card className="p-6 glass">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </Card>
);

// Empty state (not loading, but no data)
export const EmptyState = ({ 
  title = 'No data yet', 
  description = 'Get started by adding your first item',
  icon: Icon,
  action,
}: { 
  title?: string; 
  description?: string; 
  icon?: any;
  action?: React.ReactNode;
}) => (
  <Card className="p-12 text-center">
    <div className="max-w-md mx-auto space-y-4">
      {Icon && (
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  </Card>
);
