import { memo, useMemo } from 'react';
import { formatPercent } from '@/utils/formatNumber';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { cn } from '@/lib/utils';

interface TotalBalanceWidgetProps extends WidgetProps {
  totalBalance: number;
  change24h?: number;
  changePercent24h?: number;
  tradingDays?: number;
}

/**
 * Total Balance Widget — Apple Premium oscilloscope.
 * Live account-value waveform, electric-blue for positive, apple-red for negative.
 */
export const TotalBalanceWidget = memo(({
  totalBalance,
  change24h = 0,
  changePercent24h = 0,
  tradingDays = 0,
}: TotalBalanceWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = change24h >= 0;

  // Deterministic waveform based on balance/change
  const points = useMemo(() => {
    const n = 64;
    const seed = Math.abs(totalBalance + change24h * 31) % 997 || 11;
    const amp = change24h === 0 ? 0.15 : 0.75;
    const bias = isPositive ? 1 : -1;
    const pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 100;
      const t = (i + seed % 9) * 0.37;
      const y =
        50 -
        bias * (i / n) * 8 * amp +
        Math.sin(t) * 16 * amp +
        Math.sin(t * 2.4 + seed) * 7 * amp +
        Math.sin(t * 0.6) * 3;
      pts.push(`${x.toFixed(2)},${Math.max(5, Math.min(95, y)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [totalBalance, change24h, isPositive]);

  const stroke = isPositive ? 'hsl(var(--electric-blue))' : 'hsl(var(--apple-red))';
  const areaFill = isPositive ? 'hsl(var(--electric-blue) / 0.18)' : 'hsl(var(--apple-red) / 0.18)';

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-space-300">
          {t('widgets.totalBalance.title')}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn('pulse-dot', isPositive ? '' : 'danger')} />
          <span className="text-xs text-space-400 font-num">
            {tradingDays > 0 ? `${tradingDays}d` : '—'}
          </span>
        </div>
      </div>

      {/* Big number */}
      <div className="flex-1 flex items-center px-4 min-h-0">
        <div className="flex flex-col gap-1 min-w-0 w-full">
          <BlurredCurrency
            amount={totalBalance}
            className={cn(
              'font-display font-semibold text-3xl tabular-nums truncate font-num',
              isPositive ? 'text-space-100' : 'text-apple-red'
            )}
          />
          {(change24h !== 0 || changePercent24h !== 0) && (
            <div className="flex items-center gap-2 text-xs">
              <span className={isPositive ? 'chip-green' : 'chip-red'}>
                {isPositive ? '+' : ''}{formatPercent(changePercent24h)}
              </span>
              <BlurredCurrency
                amount={Math.abs(change24h)}
                className={cn('text-xs font-num tabular-nums', isPositive ? 'text-apple-green' : 'text-apple-red')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Oscilloscope */}
      <div className="relative mx-3 mb-3 h-14 rounded-ios border border-space-500/70 bg-space-800/40 overflow-hidden shrink-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* subtle grid */}
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--space-gray-500) / 0.35)" strokeWidth="0.2" />
          ))}
          {/* area fill */}
          <polygon points={areaPoints} fill={areaFill} />
          {/* line */}
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
});

TotalBalanceWidget.displayName = 'TotalBalanceWidget';
