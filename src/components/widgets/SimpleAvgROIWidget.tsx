import { memo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface SimpleAvgROIWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  simpleAvgROI: number;
  totalTrades: number;
}

/**
 * Simple Avg ROI Widget — rendered as a horizontal tier rail (gauge meter).
 * Metaphor: a 4-zone classifier rail with a sliding ▼ marker showing tier.
 * Zones: LOSING (<0) / WEAK (0-2) / SOLID (2-5) / ELITE (>5)
 */
export const SimpleAvgROIWidget = memo(({
  simpleAvgROI,
  totalTrades,
}: SimpleAvgROIWidgetProps) => {
  const { t } = useTranslation();

  // Clamp to rail range: -5 .. +10 for display purposes
  const RAIL_MIN = -5;
  const RAIL_MAX = 10;
  const clamped = Math.max(RAIL_MIN, Math.min(RAIL_MAX, simpleAvgROI));
  const markerPct = ((clamped - RAIL_MIN) / (RAIL_MAX - RAIL_MIN)) * 100;

  const zones = [
    { label: 'LOSING', color: 'bg-danger', text: 'text-danger', glow: 'glow-text-danger', range: '< 0%', test: (v: number) => v < 0 },
    { label: 'WEAK',   color: 'bg-amber-term', text: 'text-amber-term', glow: 'glow-text-amber', range: '0 — 2%', test: (v: number) => v >= 0 && v < 2 },
    { label: 'SOLID',  color: 'bg-phosphor', text: 'text-phosphor', glow: 'glow-text', range: '2 — 5%', test: (v: number) => v >= 2 && v < 5 },
    { label: 'ELITE',  color: 'bg-cyan-term', text: 'text-cyan-term', glow: 'glow-text-cyan', range: '> 5%', test: (v: number) => v >= 5 },
  ];
  const activeIdx = zones.findIndex((z) => z.test(simpleAvgROI));
  const active = zones[activeIdx === -1 ? 0 : activeIdx];

  return (
    <div className="relative flex flex-col h-full scanlines overflow-hidden">
      <div className="term-header shrink-0">
        <span className="tracking-widest">AVG_ROI.METER</span>
        <span className={cn(
          'status-pill ml-auto',
          active.label === 'LOSING' ? 'danger' : active.label === 'WEAK' ? 'amber' : active.label === 'ELITE' ? 'cyan' : ''
        )} style={{ fontSize: '0.6rem', padding: '0 0.4rem' }}>
          [ {active.label} ]
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3 py-2 min-h-0 justify-center">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-phosphor-dim tracking-widest uppercase">
            Simple Avg ROI
          </span>
          <div className={cn('font-display text-3xl chromatic tabular-nums leading-none', active.text, active.glow)}>
            {simpleAvgROI >= 0 ? '+' : ''}{simpleAvgROI.toFixed(2)}<span className="text-phosphor-dim">%</span>
          </div>
        </div>

        {/* Rail */}
        <div className="relative mt-1 mb-4">
          {/* Zone bar */}
          <div className="flex gap-[2px] h-2.5">
            {zones.map((z, i) => (
              <div
                key={z.label}
                className={cn(
                  'flex-1 transition-opacity',
                  z.color,
                  i === activeIdx ? 'opacity-100' : 'opacity-25'
                )}
                style={i === activeIdx ? { boxShadow: '0 0 8px currentColor' } : undefined}
              />
            ))}
          </div>
          {/* Marker */}
          <div
            className="absolute top-[-8px] -translate-x-1/2 transition-[left] duration-700 ease-out pointer-events-none"
            style={{ left: `${markerPct}%` }}
          >
            <div className={cn('font-display text-xs leading-none', active.text, active.glow)}>▼</div>
          </div>
          {/* Tick labels */}
          <div className="grid grid-cols-4 gap-[2px] mt-1 text-[8px] font-mono tracking-widest">
            {zones.map((z) => (
              <div key={z.label} className="flex flex-col items-center leading-tight">
                <span className="text-phosphor-dim">{z.label}</span>
                <span className="text-phosphor-dim opacity-60">{z.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] font-mono text-phosphor-dim tracking-widest mt-auto">
          &gt; avg across {totalTrades} {totalTrades === 1 ? 'trade' : 'trades'}
        </div>
      </div>
    </div>
  );
});

SimpleAvgROIWidget.displayName = 'SimpleAvgROIWidget';
