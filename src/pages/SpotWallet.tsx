import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet, Package, RefreshCw } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { RangeSelector } from '@/components/portfolio/RangeSelector';
import { PortfolioChart } from '@/components/portfolio/PortfolioChart';
import { TokenList } from '@/components/spot-wallet/TokenList';
import { TokenAllocationChart } from '@/components/spot-wallet/TokenAllocationChart';
import { AddTokenModal } from '@/components/spot-wallet/AddTokenModal';
import { CategoryView } from '@/components/portfolio/CategoryView';
import { PortfolioSettings } from '@/components/portfolio/PortfolioSettings';
import { aggregatePortfolioByCategory } from '@/utils/categoryAggregation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TimeRange } from '@/utils/timeframeReturns';
import { SkipToContent } from '@/components/SkipToContent';

export default function SpotWallet() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewType, setViewType] = useState<'value' | 'percent'>('value');
  const [activeView, setActiveView] = useState<'tokens' | 'categories'>('tokens');
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const {
    holdings,
    metrics,
    bestPerformers,
    worstPerformers,
    timeseriesData,
    deposits,
    withdrawals,
    prices,
    isLoading,
    baseCurrency,
    costMethod,
    settings,
  } = usePortfolio(selectedRange);

  const { addHolding, deleteHolding } = useSpotWallet();

  const handleSyncCategories = async () => {
    setSyncing(true);
    try {
      toast({
        title: 'Syncing categories...',
        description: 'Fetching category data from CoinGecko. This may take a minute.',
      });

      const { data, error } = await supabase.functions.invoke('sync-coingecko-categories');

      if (error) throw error;

      toast({
        title: 'Categories synced',
        description: `Updated ${data.assetsUpdated} assets with category information.`,
      });

      window.location.reload();
    } catch (error) {
      console.error('Error syncing categories:', error);
      toast({
        title: 'Sync failed',
        description: 'Could not sync categories. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Aggregate by category
  const categoryData = aggregatePortfolioByCategory(
    holdings?.map(h => {
      const currentPrice = prices?.[h.token_symbol]?.price || h.purchase_price || 0;
      const currentValue = h.quantity * currentPrice;
      const costBasis = h.quantity * (h.purchase_price || 0);

      return {
        token_symbol: h.token_symbol,
        token_name: h.token_name || h.token_symbol,
        quantity: h.quantity,
        purchase_price: h.purchase_price,
        primary_category: (h as any).primary_category,
        categories_json: (h as any).categories_json,
        currentPrice,
        currentValue,
        unrealizedPnL: currentValue - costBasis,
        priceChange24h: prices?.[h.token_symbol]?.priceChange24h,
        priceChange7d: prices?.[h.token_symbol]?.priceChange7d,
        priceChange30d: prices?.[h.token_symbol]?.priceChange30d,
      };
    }) || [],
    settings?.category_split_mode || false
  );

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
    <>
      <SEO
        title={pageMeta.spotWallet.title}
        description={pageMeta.spotWallet.description}
        keywords={pageMeta.spotWallet.keywords}
        canonical={pageMeta.spotWallet.canonical}
        noindex={true}
      />
      <AppLayout>
      <SkipToContent />
      <main id="main-content" className="space-y-6 p-6">
        {/* Page Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight" id="spot-wallet-heading">Spot Wallet</h1>
          <p className="text-muted-foreground">
            Track your portfolio with real-time P&L, cost basis, and performance analytics · {holdings?.length || 0} assets · {costMethod} · {baseCurrency}
          </p>
        </header>
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RangeSelector selected={selectedRange} onChange={setSelectedRange} />

          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'value' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('value')}
              aria-label="View by value"
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncCategories}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            {settings && (
              <PortfolioSettings
                settings={settings}
                onSettingsChange={() => window.location.reload()}
              />
            )}
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value */}
          <PremiumCard className="p-6">
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
          </PremiumCard>

          {/* Unrealized P&L */}
          <PremiumCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
              {metrics.unrealized_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-neon-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-neon-red" />
              )}
            </div>
            <AnimatedCounter
              value={Math.abs(metrics.unrealized_pnl)}
              className={`text-3xl font-bold ${metrics.unrealized_pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}
              prefix={metrics.unrealized_pnl >= 0 ? '$' : '-$'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              ROI: {formatPercent(metrics.unrealized_roi)}
            </p>
          </PremiumCard>

          {/* Realized P&L */}
          <PremiumCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Realized P&L</span>
              {metrics.realized_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-neon-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-neon-red" />
              )}
            </div>
            <AnimatedCounter
              value={Math.abs(metrics.realized_pnl)}
              className={`text-3xl font-bold ${metrics.realized_pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}
              prefix={metrics.realized_pnl >= 0 ? '$' : '-$'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              From closed positions
            </p>
          </PremiumCard>

          {/* Total Assets */}
          <PremiumCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Assets</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{holdings?.length || 0}</div>
            {bestPerformers.length > 0 && (
              <p className="text-xs text-neon-green mt-1">
                Best: {bestPerformers[0].symbol} +{((bestPerformers[0].quantity * bestPerformers[0].current_price - bestPerformers[0].cost_basis) / bestPerformers[0].cost_basis * 100).toFixed(2)}%
              </p>
            )}
          </PremiumCard>
        </div>

        {/* Portfolio Chart */}
        <PortfolioChart
          data={timeseriesData || []}
          showPercent={viewType === 'percent'}
          deposits={deposits || []}
          withdrawals={withdrawals || []}
        />

        {/* View Toggle */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'tokens' | 'categories')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Holdings Grid */}
        {activeView === 'tokens' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Token Allocation */}
            <PremiumCard className="p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Allocation</h3>
              <TokenAllocationChart data={chartData} />
            </PremiumCard>

            {/* Token List */}
            <div className="lg:col-span-2">
              <TokenList
                tokens={holdings?.map(h => {
                  const currentPrice = prices?.[h.token_symbol]?.price || h.purchase_price || 0;
                  const value = h.quantity * currentPrice;
                  const priceData = prices?.[h.token_symbol];

                  return {
                    symbol: h.token_symbol,
                    name: h.token_name || h.token_symbol,
                    value,
                    percentage: ((value / totalValue) * 100),
                    quantity: h.quantity,
                    priceChange24h: priceData?.priceChange24h,
                    priceChange7d: priceData?.priceChange7d,
                    priceChange30d: priceData?.priceChange30d,
                  };
                }) || []}
                onDelete={(symbol) => {
                  const holding = holdings?.find(h => h.token_symbol === symbol);
                  if (holding) deleteHolding.mutate(holding.id);
                }}
              />
            </div>
          </div>
        ) : (
          <CategoryView
            categories={categoryData}
            baseCurrency={baseCurrency}
          />
        )}

        <AddTokenModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(token) => {
            addHolding.mutate(token);
            setShowAddModal(false);
          }}
        />
      </main>
    </AppLayout>
    </>
  );
};


