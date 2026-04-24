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
 * Simple Avg ROI Widget — Apple Premium tier rail.
 * 4-zone classifier rail with a sliding marker. Sentence-case labels.
 */
export const SimpleAvgROIWidget = memo(({
  simpleAvgROI,
  totalTrades,
}: SimpleAvgROIWidgetProps) => {
  const { t } = useTranslation();

  // Clamp to rail range
  const RAIL_MIN = -5;
  const RAIL_MAX = 10;
  const clamped = Math.max(RAIL_MIN, Math.min(RAIL_MAX, simpleAvgROI));
  const markerPct = ((clamped - RAIL_MIN) / (RAIL_MAX - RAIL_MIN)) * 100;

  const zones = [
    { label: 'Losing', color: 'bg-apple-red/60',    text: 'text-apple-red',    chip: 'chip-red',      range: '< 0%',  test: (v: number) => v < 0 },
    { label: 'Weak',   color: 'bg-apple-orange/60', text: 'text-apple-orange', chip: 'chip-orange',   range: '0-2%',  test: (v: number) => v >= 0 && v < 2 },
    { label: 'Solid',  color: 'bg-electric/60',     text: 'text-electric',     chip: 'chip-electric', range: '2-5%',  test: (v: number) => v >= 2 && v < 5 },
    { label: 'Elite',  color: 'bg-apple-green/60',  text: 'text-apple-green',  chip: 'chip-green',    range: '> 5%',  test: (v: number) => v >= 5 },
  ];
  const activeIdx = zones.findIndex((z) => z.test(simpleAvgROI));
  const active = zones[activeIdx === -1 ? 0 : activeIdx];

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-space-300">
          Simple Avg ROI
        </span>
        <span className={cn(active.chip, 'text-[10px]')}>{active.label}</span>
      </div>

      <div className="flex-1 flex flex-col gap-3 px-4 pb-4 min-h-0 justify-center">
        {/* Big number */}
        <div className={cn('font-display font-semibold text-3xl leading-none tabular-nums font-num', active.text)}>
          {simpleAvgROI >= 0 ? '+' : ''}{simpleAvgROI.toFixed(2)}
          <span className="text-space-400 text-2xl">%</span>
        </div>

        {/* Rail */}
        <div className="relative mt-3 mb-5">
          {/* Zone bar */}
          <div className="flex gap-[3px] h-2 rounded-full overflow-hidden">
            {zones.map((z, i) => (
              <div
                key={z.label}
                className={cn(
                  'flex-1 transition-opacity',
                  z.color,
                  i === activeIdx ? 'opacity-100' : 'opacity-40'
                )}
              />
            ))}
          </div>
          {/* Marker */}
          <div
            className="absolute top-[-7px] -translate-x-1/2 transition-[left] duration-700 ease-out pointer-events-none"
            style={{ left: `${markerPct}%` }}
            aria-hidden="true"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-premium border border-space-500" />
          </div>
          {/* Tick labels */}
          <div className="grid grid-cols-4 gap-1 mt-2 text-[10px]">
            {zones.map((z, i) => (
              <div key={z.label} className="flex flex-col items-center leading-tight">
                <span className={i === activeIdx ? active.text + ' font-medium' : 'text-space-400'}>
                  {z.label}
                </span>
                <span className="text-space-400 font-num tabular-nums">{z.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-space-400 mt-auto">
          Average across <span className="text-space-200 font-num tabular-nums">{totalTrades}</span> {totalTrades === 1 ? 'trade' : 'trades'}
        </div>
      </div>
    </div>
  );
});

SimpleAvgROIWidget.displayName = 'SimpleAvgROIWidget';
