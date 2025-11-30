import { memo } from 'react';
import { RecentTransactionsCard } from '@/components/RecentTransactionsCard';
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
    <div className="h-full">
      <RecentTransactionsCard trades={trades} className="border-0 bg-transparent h-full" />
    </div>
  );
});

RecentTransactionsWidget.displayName = 'RecentTransactionsWidget';
