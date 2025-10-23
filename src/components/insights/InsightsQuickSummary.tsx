import { memo } from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, Activity } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { ExplainMetricButton } from '@/components/ExplainMetricButton';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface InsightsQuickSummaryProps {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  avgROI: number;
  totalTrades: number;
}

export const InsightsQuickSummary = memo(({ 
  totalPnL, 
  winRate, 
  profitFactor, 
  avgROI, 
  totalTrades 
}: InsightsQuickSummaryProps) => {
  const { openWithPrompt } = useAIAssistant();
  const { t } = useTranslation();

  const metrics = [
    {
      label: t('dashboard.totalPnL'),
      value: totalPnL,
      displayValue: <BlurredCurrency amount={totalPnL} className="inline" />,
      icon: DollarSign,
      color: totalPnL >= 0 ? 'text-profit' : 'text-loss',
      bgColor: totalPnL >= 0 ? 'bg-profit/10' : 'bg-loss/10',
      trend: totalPnL >= 0 ? 'up' : 'down',
    },
    {
      label: t('dashboard.winRate'),
      value: winRate,
      displayValue: formatPercent(winRate),
      icon: Target,
      color: winRate >= 55 ? 'text-profit' : winRate >= 45 ? 'text-yellow-500' : 'text-loss',
      bgColor: winRate >= 55 ? 'bg-profit/10' : 'bg-yellow-500/10',
      trend: winRate >= 50 ? 'up' : 'down',
    },
    {
      label: t('dashboard.profitFactor'),
      value: profitFactor,
      displayValue: profitFactor.toFixed(2),
      icon: Activity,
      color: profitFactor >= 1.5 ? 'text-profit' : profitFactor >= 1 ? 'text-yellow-500' : 'text-loss',
      bgColor: 'bg-primary/10',
      trend: profitFactor >= 1 ? 'up' : 'down',
    },
    {
      label: t('dashboard.avgROI'),
      value: avgROI,
      displayValue: `${avgROI >= 0 ? '+' : ''}${avgROI.toFixed(2)}%`,
      icon: TrendingUp,
      color: avgROI >= 0 ? 'text-profit' : 'text-loss',
      bgColor: avgROI >= 0 ? 'bg-profit/10' : 'bg-loss/10',
      trend: avgROI >= 0 ? 'up' : 'down',
    },
    {
      label: t('dashboard.totalTrades'),
      value: totalTrades,
      displayValue: totalTrades.toString(),
      icon: Activity,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div 
            key={index}
            className={cn(
              "p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center min-h-[80px] lg:min-h-[90px] transition-all hover:scale-[1.02] relative group animate-fade-in",
              metric.bgColor
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            role="article"
            aria-label={`${metric.label}: ${metric.value}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", metric.color)} aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-2xl lg:text-3xl font-bold", metric.color)}>
                {metric.displayValue}
              </span>
              {metric.trend && (
                metric.trend === 'up' ? 
                  <TrendingUp className="h-3 w-3 text-profit" aria-hidden="true" /> : 
                  <TrendingDown className="h-3 w-3 text-loss" aria-hidden="true" />
              )}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExplainMetricButton
                metricName={metric.label}
                metricValue={typeof metric.value === 'number' && metric.label === t('dashboard.totalPnL') ? formatCurrency(metric.value) : metric.displayValue?.toString() || metric.value.toString()}
                onExplain={openWithPrompt}
                className="h-6 w-6"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

InsightsQuickSummary.displayName = 'InsightsQuickSummary';
