import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// Lazy load heavy components
const LongShortRatioContent = lazy(() => import('@/pages/LongShortRatio').then(m => ({ default: () => {
  const Component = m.default;
  return <Component />;
}})));

const OpenInterestChartsContent = lazy(() => import('@/components/OpenInterestCharts').then(m => ({ default: m.OpenInterestCharts })));

const MarketData = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Data</h1>
        <p className="text-muted-foreground mt-1">
          Monitor market sentiment indicators
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <LongShortRatioContent />
        </Suspense>

        {/* Open Interest Charts Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Open Interest Analysis</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor open interest trends to gauge market leverage and sentiment
            </p>
          </div>
          <Suspense fallback={<DashboardSkeleton />}>
            <OpenInterestChartsContent />
          </Suspense>
        </div>
      </div>
  );
};

export default MarketData;
