import { memo } from 'react';
import { Target } from 'lucide-react';
import { formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { WidgetWrapper } from './WidgetWrapper';
import { useTranslation } from '@/hooks/useTranslation';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface WinRateWidgetProps extends WidgetProps {
  winRate: number;
  wins: number;
  losses: number;
}

export const WinRateWidget = memo(({
  id,
  isEditMode,
  onRemove,
  onExpand,
  winRate,
  wins,
  losses,
}: WinRateWidgetProps) => {
  const { t } = useTranslation();
  const { isPinned, togglePin } = usePinnedWidgets();
  // Map catalog widget ID to pinned widget ID
  const catalogId = id;
  const pinnedId = catalogId === 'winRate' ? 'win-rate' as const : undefined;
  
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
          <p className="text-sm font-medium text-muted-foreground">{t('widgets.winRate.title')}</p>
          <div className="p-2 rounded-xl bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight text-primary">
            {formatPercent(winRate)}
          </p>
          
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neon-green font-medium">{wins}W</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-neon-red font-medium">{losses}L</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
});

WinRateWidget.displayName = 'WinRateWidget';
