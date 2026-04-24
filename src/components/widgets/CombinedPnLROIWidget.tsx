import { memo, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { cn } from '@/lib/utils';

interface CombinedPnLROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgPnLPerTrade: number;
}

/**
 * Avg P&L per Trade — rendered as a deviation / bar-from-baseline chart.
 * Metaphor: a "signal strength" bar reading above/below the waterline (0),
 * styled as a synthetic horizontal EKG of trade outcomes around the mean.
 */
export const CombinedPnLROIWidget = memo(({
  avgPnLPerTrade,
}: CombinedPnLROIWidgetProps) => {
  const { t } = useTranslation();
  const isPnLPositive = avgPnLPerTrade >= 0;

  // Deterministic synthetic "trade distribution" bars around the average.
  // This is a vibes visualization — not a real data feed.
  const bars = useMemo(() => {
    const n = 28;
    const seed = Math.floor(Math.abs(avgPnLPerTrade)) % 131 || 11;
    const mean = avgPnLPerTrade;
    const range = Math.max(Math.abs(mean) * 2.5, 20);
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i + seed % 5) * 0.55;
      const noise = Math.sin(t) * 0.7 + Math.sin(t * 2.1 + seed) * 0.35 + Math.sin(t * 0.5) * 0.2;
      arr.push(mean + noise * range * 0.5);
    }
    return arr;
  }, [avgPnLPerTrade]);

  return (
    <div className="relative flex flex-col h-full scanlines overflow-hidden">
      <div className="term-header shrink-0">
        <span className="tracking-widest">AVG_PNL // PER_TRADE</span>
        <span className={cn('pulse-dot ml-auto', isPnLPositive ? '' : 'danger')} />
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3 py-2 min-h-0 justify-center">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-phosphor-dim tracking-widest uppercase">
            {t('widgets.avgPnLPerTrade.title')}
          </span>
          <div className={cn(
            'font-display text-3xl chromatic tabular-nums leading-none',
            isPnLPositive ? 'text-phosphor glow-text' : 'text-danger glow-text-danger'
          )}>
            {isPnLPositive ? '+' : '-'}
            <BlurredCurrency amount={Math.abs(avgPnLPerTrade)} className="inline" />
          </div>
        </div>

        {/* Deviation bars around waterline */}
        <div className="relative h-14 border border-phosphor-dim bg-void overflow-hidden">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {/* waterline */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--phosphor) / 0.35)" strokeWidth="0.4" strokeDasharray="2 2" />
            {/* grid */}
            {[25, 75].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--phosphor) / 0.08)" strokeWidth="0.25" />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center gap-[2px] px-1">
            {bars.map((v, i) => {
              const positive = v >= 0;
              const mag = Math.min(100, Math.abs(v) / (Math.max(...bars.map((b) => Math.abs(b))) || 1) * 100);
              const height = Math.max(4, mag) * 0.45;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 flex flex-col',
                    positive ? 'justify-end items-center' : 'justify-start items-center'
                  )}
                  style={{ height: '100%' }}
                >
                  {!positive && <div style={{ height: '50%' }} />}
                  <div
                    className={cn(positive ? 'bg-phosphor' : 'bg-danger')}
                    style={{
                      height: `${height}%`,
                      width: '100%',
                      boxShadow: `0 0 3px currentColor`,
                    }}
                  />
                  {positive && <div style={{ height: '50%' }} />}
                </div>
              );
            })}
          </div>
          <div className="scan-bar" />
        </div>

        {/* Footer note */}
        <div className="text-[10px] font-mono text-phosphor-dim tracking-widest">
          &gt; {t('widgets.avgPnLDescription')}
        </div>
      </div>
    </div>
  );
});

CombinedPnLROIWidget.displayName = 'CombinedPnLROIWidget';
