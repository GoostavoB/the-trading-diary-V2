import { memo } from 'react';
import { TopMoversCard } from '@/components/TopMoversCard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from '@/types/widget';
import { Trade } from '@/types/trade';

interface TopMoversWidgetProps extends WidgetProps {
  trades: Trade[];
}

export const TopMoversWidget = memo(({
  id,
  isEditMode,
  onRemove,
  trades,
}: TopMoversWidgetProps) => {
  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
      className="h-full p-0"
    >
      <TopMoversCard trades={trades} className="border-0 bg-transparent" />
    </WidgetWrapper>
  );
});

TopMoversWidget.displayName = 'TopMoversWidget';
