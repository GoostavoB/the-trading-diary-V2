import { Pin } from 'lucide-react';
import { usePinnedWidgets, WidgetId } from '@/contexts/PinnedWidgetsContext';
import { LongShortRatioWidget } from '@/components/widgets/LongShortRatioWidget';
import { OpenInterestWidget } from '@/components/widgets/OpenInterestWidget';
import { PersonalGoalsWidget } from '@/components/widgets/PersonalGoalsWidget';
import { CapitalGrowthWidget } from '@/components/widgets/CapitalGrowthWidget';
import { SpotWalletWidget } from '@/components/widgets/SpotWalletWidget';
import { TotalBalanceWidget } from '@/components/widgets/TotalBalanceWidget';
import { TopMoversWidget } from '@/components/widgets/TopMoversWidget';
import { RecentTransactionsWidget } from '@/components/widgets/RecentTransactionsWidget';
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget';
import { AIInsightsWidget } from '@/components/widgets/AIInsightsWidget';
import { AvgPnLPerTradeWidget } from '@/components/widgets/AvgPnLPerTradeWidget';
import { AvgPnLPerDayWidget } from '@/components/widgets/AvgPnLPerDayWidget';
import { Trade } from '@/types/trade';

// Import pinnable stats widgets
import { 
  WinRateWidget,
  TotalProfitWidget,
  CurrentROIWidget,
  TotalTradesWidget 
} from '@/components/widgets/pinnable/StatsWidgets';

interface PinnedWidgetsAreaProps {
  winRate?: number;
  winCount?: number;
  lossCount?: number;
  totalProfit?: number;
  currentROI?: number;
  totalTrades?: number;
  totalBalance?: number;
  change24h?: number;
  changePercent24h?: number;
  spotTotalValue?: number;
  spotChange24h?: number;
  spotChangePercent24h?: number;
  tokenCount?: number;
  trades?: Trade[];
  avgPnLPerTrade?: number;
  avgPnLPerDay?: number;
  tradingDays?: number;
}

const renderWidget = (widgetId: WidgetId, props: PinnedWidgetsAreaProps) => {
  switch (widgetId) {
    case 'winRate':
      return <WinRateWidget winRate={props.winRate} winCount={props.winCount} lossCount={props.lossCount} />;
    case 'absoluteProfit':
      return <TotalProfitWidget totalProfit={props.totalProfit} />;
    case 'currentROI':
      return <CurrentROIWidget currentROI={props.currentROI} />;
    case 'totalTrades':
      return <TotalTradesWidget totalTrades={props.totalTrades} />;
    case 'totalBalance':
      return <TotalBalanceWidget id={widgetId} totalBalance={props.totalBalance || 0} change24h={props.change24h} changePercent24h={props.changePercent24h} />;
    case 'spotWallet':
      return <SpotWalletWidget id={widgetId} totalValue={props.spotTotalValue || 0} change24h={props.spotChange24h || 0} changePercent24h={props.spotChangePercent24h || 0} tokenCount={props.tokenCount || 0} />;
    case 'capitalGrowth':
      return <CapitalGrowthWidget id={widgetId} />;
    case 'topMovers':
      return <TopMoversWidget id={widgetId} trades={props.trades || []} />;
    case 'recentTransactions':
      return <RecentTransactionsWidget id={widgetId} trades={props.trades || []} />;
    case 'quickActions':
      return <QuickActionsWidget id={widgetId} />;
    case 'aiInsights':
      return <AIInsightsWidget id={widgetId} trades={props.trades || []} />;
    case 'avgPnLPerTrade':
      return <AvgPnLPerTradeWidget id={widgetId} avgPnLPerTrade={props.avgPnLPerTrade || 0} />;
    case 'avgPnLPerDay':
      return <AvgPnLPerDayWidget id={widgetId} avgPnLPerDay={props.avgPnLPerDay || 0} tradingDays={props.tradingDays || 0} />;
    case 'lsrMarketData':
      return <LongShortRatioWidget />;
    case 'openInterestChart':
      return <OpenInterestWidget />;
    case 'goals':
      return <PersonalGoalsWidget />;
    default:
      return null;
  }
};

export function PinnedWidgetsArea(props: PinnedWidgetsAreaProps) {
  const { pinnedWidgets } = usePinnedWidgets();

  // Filter to only include widgets that can be rendered
  const renderableWidgets = pinnedWidgets.filter((widgetId) => {
    const widget = renderWidget(widgetId, props);
    return widget !== null;
  });

  if (renderableWidgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-2">
        <Pin className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Pinned Widgets</h2>
        <span className="text-xs text-muted-foreground">
          ({renderableWidgets.length} pinned)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderableWidgets.map((widgetId) => (
          <div key={widgetId}>{renderWidget(widgetId, props)}</div>
        ))}
      </div>
    </div>
  );
}
