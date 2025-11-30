import { memo } from 'react';
import { QuickActionCard } from '@/components/QuickActionCard';
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

    <div className="p-4 h-full">
      <QuickActionCard id={id} isEditMode={isEditMode} onRemove={onRemove} />
    </div>
  );
});

QuickActionsWidget.displayName = 'QuickActionsWidget';
