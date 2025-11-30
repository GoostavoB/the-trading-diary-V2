import { memo } from 'react';
import { BarChart3 } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-sm">{t('widgets.totalTrades.title')}</h3>
        <div className="p-2 rounded-xl bg-primary/10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="p-4 space-y-2">
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
  );
});

TotalTradesWidget.displayName = 'TotalTradesWidget';
