import { memo } from 'react';
import { RecentTransactionsCard } from '@/components/RecentTransactionsCard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface RecentTransactionsWidgetProps extends WidgetProps {
  trades: Trade[];
}

export const RecentTransactionsWidget = memo(({
  id,
  isEditMode,
  onRemove,
  trades,
}: RecentTransactionsWidgetProps) => {
  const { isPinned, togglePin } = usePinnedWidgets();
  const pinnedId = 'recentTransactions' as const;

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
      <RecentTransactionsCard trades={trades} className="border-0 bg-transparent" />
    </WidgetWrapper>
  );
});

RecentTransactionsWidget.displayName = 'RecentTransactionsWidget';
