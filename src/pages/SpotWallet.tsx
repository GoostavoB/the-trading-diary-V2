import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown, Wallet, Coins } from 'lucide-react';
import { useSpotWallet } from '@/hooks/useSpotWallet';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { useWalletAnalytics } from '@/hooks/useWalletAnalytics';
import { AddTokenModal } from '@/components/spot-wallet/AddTokenModal';
import { TokenAllocationChart } from '@/components/spot-wallet/TokenAllocationChart';
import { TokenList } from '@/components/spot-wallet/TokenList';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';

export default function SpotWallet() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { holdings, isLoading, addHolding, deleteHolding } = useSpotWallet();
  
  const symbols = holdings.map(h => h.token_symbol);
  const { prices } = useTokenPrices(symbols);
  const analytics = useWalletAnalytics(holdings, prices);

  const handleAddToken = (token: any) => {
    addHolding.mutate(token);
  };

  const handleDeleteToken = (symbol: string) => {
    const holding = holdings.find(h => h.token_symbol === symbol);
    if (holding) {
      deleteHolding.mutate(holding.id);
    }
  };

  const tokenListData = analytics.allocation.map(item => ({
    ...item,
    priceChange24h: prices[item.symbol]?.priceChangePercentage24h,
    priceChange7d: prices[item.symbol]?.priceChangePercentage7d,
    priceChange30d: prices[item.symbol]?.priceChangePercentage30d,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Spot Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your holdings and token performance in real time
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Token
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallet Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</div>
            <div className="flex items-center gap-1 mt-1">
              {analytics.totalChange24h >= 0 ? (
                <TrendingUp className="h-3 w-3 text-neon-green" />
              ) : (
                <TrendingDown className="h-3 w-3 text-neon-red" />
              )}
              <p className={`text-xs ${analytics.totalChange24h >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {analytics.totalChange24h >= 0 ? '+' : ''}{formatCurrency(analytics.totalChange24h)} ({formatPercent(analytics.totalChangePercent24h)}) 24h
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio P/L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.unrealizedPnL >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {analytics.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(analytics.unrealizedPnL)}
            </div>
            <p className={`text-xs mt-1 ${analytics.unrealizedPnL >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {analytics.unrealizedPnL >= 0 ? '+' : ''}{formatPercent(analytics.unrealizedPnLPercent)} unrealized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            {analytics.bestPerformer ? (
              <>
                <div className="text-2xl font-bold">{analytics.bestPerformer.symbol}</div>
                <p className="text-xs text-neon-green mt-1">
                  +{formatPercent(analytics.bestPerformer.changePercent)} (24h)
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.tokenCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.tokenCount === 1 ? 'Token' : 'Tokens'} tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TokenAllocationChart data={analytics.allocation} />
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                <span className="text-sm text-muted-foreground">Total Invested</span>
                <span className="font-mono font-semibold">{formatCurrency(analytics.totalInvested)}</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                <span className="text-sm text-muted-foreground">Current Value</span>
                <span className="font-mono font-semibold">{formatCurrency(analytics.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                <span className="text-sm text-muted-foreground">Unrealized P/L</span>
                <span className={`font-mono font-semibold ${analytics.unrealizedPnL >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                  {analytics.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(analytics.unrealizedPnL)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                <span className="text-sm text-muted-foreground">ROI</span>
                <span className={`font-mono font-semibold ${analytics.unrealizedPnLPercent >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                  {analytics.unrealizedPnLPercent >= 0 ? '+' : ''}{formatPercent(analytics.unrealizedPnLPercent)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token List */}
      <TokenList 
        tokens={tokenListData}
        onDelete={handleDeleteToken}
      />

      {/* Add Token Modal */}
      <AddTokenModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddToken}
      />
    </div>
  );
}
