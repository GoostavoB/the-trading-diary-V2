import { memo } from 'react';
import { RecentTransactionsCard } from '@/components/RecentTransactionsCard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';

interface RecentTransactionsWidgetProps extends WidgetProps {
  trades: Trade[];
}

export const RecentTransactionsWidget = memo(({
  id,
  isEditMode,
  onRemove,
  trades,
}: RecentTransactionsWidgetProps) => {
  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
      className="h-full p-0"
    >
      <RecentTransactionsCard trades={trades} className="border-0 bg-transparent" />
    </WidgetWrapper>
  );
});

RecentTransactionsWidget.displayName = 'RecentTransactionsWidget';
