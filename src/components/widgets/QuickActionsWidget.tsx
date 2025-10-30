import { memo } from 'react';
import { QuickActionCard } from '@/components/QuickActionCard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from '@/types/widget';
import { PinButton } from '@/components/widgets/PinButton';
import { usePinnedWidgets } from '@/contexts/PinnedWidgetsContext';

interface QuickActionsWidgetProps extends WidgetProps {
  // Component is self-contained
}

export const QuickActionsWidget = memo(({
  id,
  isEditMode,
  onRemove,
}: QuickActionsWidgetProps) => {
  const { isPinned, togglePin } = usePinnedWidgets();
  const pinnedId = 'quickActions' as const;

  return (
    <WidgetWrapper
      id={id}
      isEditMode={isEditMode}
      onRemove={onRemove}
      headerActions={
        !isEditMode && (
          <PinButton
            isPinned={isPinned(pinnedId)}
            onToggle={() => togglePin(pinnedId)}
          />
        )
      }
    >
      <QuickActionCard />
    </WidgetWrapper>
  );
});

QuickActionsWidget.displayName = 'QuickActionsWidget';
