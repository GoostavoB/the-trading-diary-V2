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
 * Total Balance Widget — rendered as an oscilloscope / P_L live scope.
 * Metaphor: a CRT scope showing a live waveform of account value.
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
        bias * (i / n) * 8 * amp +  // slow drift
        Math.sin(t) * 16 * amp +
        Math.sin(t * 2.4 + seed) * 7 * amp +
        Math.sin(t * 0.6) * 3;
      pts.push(`${x.toFixed(2)},${Math.max(5, Math.min(95, y)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [totalBalance, change24h, isPositive]);

  const stroke = isPositive ? 'hsl(var(--phosphor))' : 'hsl(var(--danger))';

  return (
    <div className="relative flex flex-col h-full scanlines overflow-hidden">
      {/* Header bar */}
      <div className="term-header shrink-0">
        <span className="tracking-widest">BAL.LIVE // USD</span>
        <span className={cn('pulse-dot ml-auto', isPositive ? '' : 'danger')} />
        <span className="text-[10px] text-phosphor-dim tracking-widest">
          {tradingDays > 0 ? `${tradingDays}D` : 'IDLE'}
        </span>
      </div>

      {/* Big number */}
      <div className="flex-1 flex items-center justify-between px-3 min-h-0 gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] text-phosphor-dim tracking-widest uppercase">
            {t('widgets.totalBalance.title')}
          </span>
          <BlurredCurrency
            amount={totalBalance}
            className={cn(
              'font-display text-2xl chromatic tabular-nums truncate',
              isPositive ? 'glow-text' : 'glow-text-danger'
            )}
          />
          {(change24h !== 0 || changePercent24h !== 0) && (
            <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums">
              <span className={cn('status-pill', isPositive ? '' : 'danger')} style={{ fontSize: '0.58rem', padding: '0 0.35rem' }}>
                {isPositive ? '+' : ''}{formatPercent(changePercent24h)}
              </span>
              <BlurredCurrency
                amount={Math.abs(change24h)}
                className={cn('text-xs', isPositive ? 'text-phosphor' : 'text-danger')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Oscilloscope readout */}
      <div className="relative mx-2 mb-2 h-14 border border-phosphor-dim bg-void overflow-hidden shrink-0">
        {/* grid */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--phosphor) / 0.1)" strokeWidth="0.25" strokeDasharray="1 1.5" />
          ))}
          {[25, 50, 75].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="hsl(var(--phosphor) / 0.1)" strokeWidth="0.25" strokeDasharray="1 1.5" />
          ))}
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--phosphor) / 0.25)" strokeWidth="0.35" strokeDasharray="2 2" />
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
            style={{ filter: `drop-shadow(0 0 3px ${stroke})` }}
          />
        </svg>
        {/* sweeping scan line */}
        <div className="scan-bar" />
      </div>
    </div>
  );
});

TotalBalanceWidget.displayName = 'TotalBalanceWidget';
