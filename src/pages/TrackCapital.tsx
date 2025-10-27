import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { CapitalDepositsTab } from '@/components/capital/CapitalDepositsTab';
import { CapitalWithdrawalsTab } from '@/components/capital/CapitalWithdrawalsTab';
import { CapitalTimeline } from '@/components/capital/CapitalTimeline';
import { CapitalImpactAnalysis } from '@/components/capital/CapitalImpactAnalysis';
import { useCapitalGrowthData } from '@/hooks/useCapitalGrowthData';
import { formatCurrency } from '@/utils/formatters';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

export default function TrackCapital() {
  const [activeTab, setActiveTab] = useState('deposits');
  const {
    totalDeposits,
    totalWithdrawals,
    currentBalance,
    tradingPnL,
    isLoading,
  } = useCapitalGrowthData();

  const netCapitalChange = totalDeposits - totalWithdrawals;
  const netCapitalChangePercent = totalDeposits > 0 
    ? ((netCapitalChange / totalDeposits) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Track Capital</h1>
          <p className="text-muted-foreground">
            Manage your deposits and withdrawals, track capital evolution
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Deposited</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">
              <BlurredCurrency amount={totalDeposits} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time capital added
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Withdrawn</span>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold">
              <BlurredCurrency amount={totalWithdrawals} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time capital removed
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Available Capital</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">
              <BlurredCurrency amount={currentBalance} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current account balance
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Net Capital</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">
              <BlurredCurrency amount={netCapitalChange} />
            </div>
            <p className={`text-xs mt-1 ${netCapitalChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netCapitalChangePercent >= 0 ? '+' : ''}{netCapitalChangePercent.toFixed(1)}% net change
            </p>
          </Card>
        </div>

        {/* Capital Impact Analysis */}
        <CapitalImpactAnalysis 
          totalDeposits={totalDeposits}
          totalWithdrawals={totalWithdrawals}
          tradingPnL={tradingPnL}
          currentBalance={currentBalance}
        />

        {/* Tabs for Deposits, Withdrawals, Timeline */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="mt-6">
              <CapitalDepositsTab />
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-6">
              <CapitalWithdrawalsTab />
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <CapitalTimeline />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
}
