import { memo } from 'react';
import { BarChart3 } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { WidgetProps } from '@/types/widget';
import { WidgetWrapper } from './WidgetWrapper';
import { useTranslation } from '@/hooks/useTranslation';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface TotalTradesWidgetProps extends WidgetProps {
  totalTrades: number;
  trend?: number;
}

export const TotalTradesWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  totalTrades,
  trend,
}: TotalTradesWidgetProps) => {
  const { t } = useTranslation();
  const { isPinned, togglePin } = usePinnedWidgets();
  // Map catalog widget ID to pinned widget ID
  const catalogId = id;
  const pinnedId = catalogId === 'totalTrades' ? 'total-trades' as const : undefined;
  
  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onExpand={onExpand}
      headerActions={
        !isEditMode && pinnedId && (
          <PinButton
            isPinned={isPinned(pinnedId)}
            onToggle={() => togglePin(pinnedId)}
          />
        )
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{t('widgets.totalTrades.title')}</p>
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight">
            <AnimatedCounter value={totalTrades} />
          </p>
          
          {trend !== undefined && (
            <p className="text-sm text-muted-foreground">
              {trend > 0 ? '+' : ''}{trend} {t('widgets.thisWeek')}
            </p>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
});

TotalTradesWidget.displayName = 'TotalTradesWidget';
