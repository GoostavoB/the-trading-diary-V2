import AppLayout from '@/components/layout/AppLayout';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LSRAlertSettings } from '@/components/LSRAlertSettings';
import { useLSRNotifications } from '@/hooks/useLSRNotifications';

// Lazy load heavy components
const LongShortRatioContent = lazy(() => import('@/pages/LongShortRatio').then(m => ({ default: () => {
  const Component = m.default;
  return <Component />;
}})));

const OpenInterestChartsContent = lazy(() => import('@/components/OpenInterestCharts').then(m => ({ default: m.OpenInterestCharts })));

const MarketData = () => {
  const { permission, requestPermission, isEnabled } = useLSRNotifications();

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

        {/* One-Click Notification Prompt */}
        {!isEnabled && (
          <Card className="glass border-neon-green/50 bg-gradient-to-r from-neon-green/5 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/20">
                  <Bell className="w-6 h-6 text-neon-green" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Get Real-Time Market Alerts 🔔
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Never miss important sentiment shifts. Get instant notifications when the Long/Short ratio changes dramatically.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                      <span>Rapid changes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      <span>Bearish signals</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                      <span>Bullish signals</span>
                    </div>
                  </div>
                  <Button 
                    onClick={requestPermission} 
                    size="lg" 
                    className="gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Enable Alerts (One Click)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
  );
};

export default MarketData;
