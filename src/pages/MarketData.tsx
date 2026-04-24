import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LSRAlertSettings } from '@/components/LSRAlertSettings';
import { useLSRNotifications } from '@/hooks/useLSRNotifications';

// Lazy load heavy components
const LongShortRatioContent = lazy(() => import('@/pages/LongShortRatio').then(m => ({
  default: () => {
    const Component = m.default;
    return <Component />;
  }
})));

const OpenInterestChartsContent = lazy(() => import('@/components/OpenInterestCharts').then(m => ({ default: m.OpenInterestCharts })));

const MarketData = () => {
  const { permission, requestPermission, isEnabled } = useLSRNotifications();

  return (
    <>
      <SEO
        title={pageMeta.marketData.title}
        description={pageMeta.marketData.description}
        keywords={pageMeta.marketData.keywords}
        canonical={pageMeta.marketData.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market Data</h1>
            <p className="text-muted-foreground mt-1">
              Monitor market sentiment indicators
            </p>
          </div>
          {isEnabled && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Bell className="w-4 h-4" />
                  Alert Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <LSRAlertSettings />
              </DialogContent>
            </Dialog>
          )}
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
    </AppLayout>
    </>
  );
};

export default MarketData;
