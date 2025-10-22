import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet, Package } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { RangeSelector } from '@/components/portfolio/RangeSelector';
import { PortfolioChart } from '@/components/portfolio/PortfolioChart';
import { TokenList } from '@/components/spot-wallet/TokenList';
import { TokenAllocationChart } from '@/components/spot-wallet/TokenAllocationChart';
import { AddTokenModal } from '@/components/spot-wallet/AddTokenModal';
import type { TimeRange } from '@/utils/timeframeReturns';

export default function SpotWallet() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewType, setViewType] = useState<'value' | 'percent'>('value');

  const {
    holdings,
    metrics,
    bestPerformers,
    worstPerformers,
    isLoading,
    baseCurrency,
    costMethod,
  } = usePortfolio(selectedRange);
  
  const { addHolding, deleteHolding } = useSpotWallet();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading portfolio...</div>
        </div>
      </AppLayout>
    );
  }

  const totalValue = holdings?.reduce((sum, h) => sum + (h.quantity * (h.purchase_price || 0)), 0) || 1;
  const chartData = holdings?.map((h) => ({
    symbol: h.token_symbol,
    name: h.token_name || h.token_symbol,
    value: h.quantity * (h.purchase_price || 0),
    percentage: ((h.quantity * (h.purchase_price || 0)) / totalValue) * 100,
  })) || [];

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Spot Wallet</h1>
          <p className="text-muted-foreground">
            Track your portfolio with real-time P&L, cost basis, and performance analytics · {holdings?.length || 0} assets · {costMethod} · {baseCurrency}
          </p>
        </div>
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RangeSelector selected={selectedRange} onChange={setSelectedRange} />
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'value' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('value')}
            >
              Value
            </Button>
            <Button
              variant={viewType === 'percent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('percent')}
            >
              Percent
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <AnimatedCounter
              value={metrics.total_value}
              className="text-3xl font-bold"
              prefix="$"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cost Basis: {formatCurrency(metrics.total_cost_basis)}
            </p>
          </Card>

          {/* Unrealized P&L */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
              {metrics.unrealized_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </div>
            <AnimatedCounter
              value={Math.abs(metrics.unrealized_pnl)}
              className={`text-3xl font-bold ${metrics.unrealized_pnl >= 0 ? 'text-profit' : 'text-loss'}`}
              prefix={metrics.unrealized_pnl >= 0 ? '$' : '-$'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              ROI: {formatPercent(metrics.unrealized_roi)}
            </p>
          </Card>

          {/* Realized P&L */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Realized P&L</span>
              {metrics.realized_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </div>
            <AnimatedCounter
              value={Math.abs(metrics.realized_pnl)}
              className={`text-3xl font-bold ${metrics.realized_pnl >= 0 ? 'text-profit' : 'text-loss'}`}
              prefix={metrics.realized_pnl >= 0 ? '$' : '-$'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              From closed positions
            </p>
          </Card>

          {/* Total Assets */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Assets</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{holdings?.length || 0}</div>
            {bestPerformers.length > 0 && (
              <p className="text-xs text-profit mt-1">
                Best: {bestPerformers[0].symbol} +{((bestPerformers[0].quantity * bestPerformers[0].current_price - bestPerformers[0].cost_basis) / bestPerformers[0].cost_basis * 100).toFixed(2)}%
              </p>
            )}
          </Card>
        </div>

        {/* Portfolio Chart */}
        <PortfolioChart 
          data={[]} // TODO: Implement timeseries data
          showPercent={viewType === 'percent'}
          deposits={[]}
          withdrawals={[]}
        />

        {/* Holdings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Allocation */}
          <Card className="p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Allocation</h3>
            <TokenAllocationChart data={chartData} />
          </Card>

          {/* Token List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Holdings</h3>
              <div className="space-y-3">
                {holdings && holdings.length > 0 ? (
                  holdings.map((holding) => (
                    <div key={holding.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="font-semibold">{holding.token_symbol}</div>
                        <div className="text-sm text-muted-foreground">{holding.token_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{holding.quantity.toFixed(8)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${((holding.purchase_price || 0) * holding.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No holdings yet. Add your first token to get started.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AddTokenModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onAdd={(token) => {
          addHolding.mutate(token);
          setShowAddModal(false);
        }}
      />
    </AppLayout>
  );
};


