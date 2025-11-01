import { Helmet } from 'react-helmet';
import AppLayout from '@/components/layout/AppLayout';
import { AdvancedMetricsCard } from '@/components/analytics/AdvancedMetricsCard';
import { ABTestingPanel } from '@/components/analytics/ABTestingPanel';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumFeatureLock } from '@/components/PremiumFeatureLock';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Mock data
const performanceData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  value: Math.random() * 1000 + 5000,
}));

const winRateData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  value: Math.random() * 30 + 50,
}));

const profitData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  value: Math.random() * 2000 - 500,
}));

export default function AdvancedAnalytics() {
  const { isFeatureLocked } = useSubscription();
  const isPremiumLocked = isFeatureLocked('pro');

  return (
    <>
      <Helmet>
        <title>Advanced Analytics - The Trading Diary</title>
        <meta name="description" content="Deep dive into your trading performance with advanced analytics and A/B testing." />
      </Helmet>

      <AppLayout>
        <PremiumFeatureLock requiredPlan="pro" isLocked={isPremiumLocked}>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
              <p className="text-muted-foreground">
                Detailed performance insights and experimentation tools
              </p>
            </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AdvancedMetricsCard
              title="Total P&L"
              value="$12,450"
              change={15.3}
              data={performanceData}
              type="area"
              icon="dollar"
            />
            <AdvancedMetricsCard
              title="Win Rate"
              value="68.5%"
              change={5.2}
              data={winRateData}
              type="line"
              icon="percent"
            />
            <AdvancedMetricsCard
              title="Average Profit"
              value="$245"
              change={-2.1}
              data={profitData}
              type="area"
              icon="trending"
            />
          </div>

          <Tabs defaultValue="metrics" className="w-full">
            <TabsList>
              <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
              <TabsTrigger value="testing">A/B Testing</TabsTrigger>
              <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Trade Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Scalping ({"<"}5min)</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Day Trading (5min-1d)</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Swing Trading ({">"}1d)</span>
                      <span className="font-medium">20%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                      <span className="font-medium">2.34</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max Drawdown</span>
                      <span className="font-medium text-red-500">-12.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Profit Factor</span>
                      <span className="font-medium">1.85</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="mt-6">
              <ABTestingPanel />
            </TabsContent>

            <TabsContent value="cohorts" className="space-y-4 mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Cohorts</h3>
                <p className="text-muted-foreground mb-4">
                  Analyze performance across different time periods and user segments
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">January 2025 Cohort</p>
                      <p className="text-sm text-muted-foreground">45 active users</p>
                    </div>
                    <span className="text-green-500 font-medium">+18.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">December 2024 Cohort</p>
                      <p className="text-sm text-muted-foreground">62 active users</p>
                    </div>
                    <span className="text-green-500 font-medium">+12.3%</span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </PremiumFeatureLock>
      </AppLayout>
    </>
  );
}
