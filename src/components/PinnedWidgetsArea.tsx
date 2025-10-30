import { Pin } from 'lucide-react';
import { usePinnedWidgets, WidgetId } from '@/contexts/PinnedWidgetsContext';
import { LongShortRatioWidget } from '@/components/widgets/LongShortRatioWidget';
import { OpenInterestWidget } from '@/components/widgets/OpenInterestWidget';
import { PersonalGoalsWidget } from '@/components/widgets/PersonalGoalsWidget';

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
}

const renderWidget = (widgetId: WidgetId, props: PinnedWidgetsAreaProps) => {
  switch (widgetId) {
    case 'win-rate':
      return <WinRateWidget winRate={props.winRate} winCount={props.winCount} lossCount={props.lossCount} />;
    case 'total-profit':
      return <TotalProfitWidget totalProfit={props.totalProfit} />;
    case 'current-roi':
      return <CurrentROIWidget currentROI={props.currentROI} />;
    case 'total-trades':
      return <TotalTradesWidget totalTrades={props.totalTrades} />;
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

  if (pinnedWidgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-2">
        <Pin className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Pinned Widgets</h2>
        <span className="text-xs text-muted-foreground">
          ({pinnedWidgets.length} pinned)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pinnedWidgets.map((widgetId) => (
          <div key={widgetId}>{renderWidget(widgetId, props)}</div>
        ))}
      </div>
    </div>
  );
}
