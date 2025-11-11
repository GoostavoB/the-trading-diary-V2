import { memo } from 'react';
import { QuickActionCard } from '@/components/QuickActionCard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from '@/types/widget';

interface QuickActionsWidgetProps extends WidgetProps {
  // Component is self-contained
}

export const QuickActionsWidget = memo(({
  id,
  isEditMode,
  onRemove,
}: QuickActionsWidgetProps) => {
  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
    >
      <QuickActionCard id={id} isEditMode={isEditMode} onRemove={onRemove} />
    </WidgetWrapper>
  );
});

QuickActionsWidget.displayName = 'QuickActionsWidget';
