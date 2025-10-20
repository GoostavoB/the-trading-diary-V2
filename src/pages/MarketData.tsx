import AppLayout from '@/components/layout/AppLayout';
import { Bell } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LSRAlertSettings } from '@/components/LSRAlertSettings';
import { useLSRNotifications } from '@/hooks/useLSRNotifications';

// Lazy load heavy components
const LongShortRatioContent = lazy(() => import('@/pages/LongShortRatio').then(m => ({ default: () => {
  const Component = m.default;
  return <Component />;
}})));

const MarketData = () => {
  useLSRNotifications(); // Initialize notifications

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market Data</h1>
            <p className="text-muted-foreground mt-1">
              Monitor market sentiment indicators
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Bell className="w-4 h-4" />
                Configure Alerts
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <LSRAlertSettings />
            </DialogContent>
          </Dialog>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <LongShortRatioContent />
        </Suspense>
      </div>
    </AppLayout>
  );
};

export default MarketData;
