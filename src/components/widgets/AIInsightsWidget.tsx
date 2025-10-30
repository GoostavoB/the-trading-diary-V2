import { memo } from 'react';
import { AIInsightCard } from '@/components/AIInsightCard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface AIInsightsWidgetProps extends WidgetProps {
  trades: Trade[];
}

export const AIInsightsWidget = memo(({
  id,
  isEditMode,
  onRemove,
  trades,
}: AIInsightsWidgetProps) => {
  const { isPinned, togglePin } = usePinnedWidgets();
  const pinnedId = 'aiInsights' as const;

  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
      className="h-full p-0"
      headerActions={
        !isEditMode && (
          <PinButton
            isPinned={isPinned(pinnedId)}
            onToggle={() => togglePin(pinnedId)}
          />
        )
      }
    >
      <AIInsightCard trades={trades} />
    </WidgetWrapper>
  );
});

AIInsightsWidget.displayName = 'AIInsightsWidget';
