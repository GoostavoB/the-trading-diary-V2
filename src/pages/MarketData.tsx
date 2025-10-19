import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import { Calendar, TrendingUp, Coins } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

// Lazy load heavy components
const EconomicCalendarContent = lazy(() => import('@/pages/EconomicCalendar').then(m => ({ default: () => {
  const Component = m.default;
  return <Component />;
}})));

const LongShortRatioContent = lazy(() => import('@/pages/LongShortRatio').then(m => ({ default: () => {
  const Component = m.default;
  return <Component />;
}})));

const MarketData = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Market Data</h1>
          <p className="text-muted-foreground mt-1">
            Monitor economic events and market sentiment indicators
          </p>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-2 glass">
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Economic Calendar
            </TabsTrigger>
            <TabsTrigger value="longshort" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Long/Short Ratio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <EconomicCalendarContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="longshort" className="space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <LongShortRatioContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MarketData;
