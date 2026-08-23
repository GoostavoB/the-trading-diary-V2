import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

const MultiAssetLSRGridContent = lazy(() => import('@/components/market-data/MultiAssetLSRGrid').then(m => ({ default: m.MultiAssetLSRGrid })));

const LSROIGrid = () => {
  return (
    <>
      <SEO
        title="LSR & OI Grid - The Trading Diary"
        description="Long/Short ratio and open interest across BTC, ETH, XAU and top altcoins in a single grid."
        keywords={pageMeta.marketData.keywords}
        canonical="/lsr-oi-grid"
        noindex={true}
      />
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">LSR & OI Grid</h1>
            <p className="text-muted-foreground mt-1">
              BTC, ETH, XAU e principais altcoins — razao long/short e open interest em um so lugar
            </p>
          </div>
          <Suspense fallback={<DashboardSkeleton />}>
            <MultiAssetLSRGridContent />
          </Suspense>
        </div>
      </AppLayout>
    </>
  );
};

export default LSROIGrid;
