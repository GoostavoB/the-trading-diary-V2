import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface ProfitFactorWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  profitFactor: number;
  grossProfit: number;
  grossLoss: number;
  winCount: number;
  lossCount: number;
}

/**
 * Profit Factor Widget — Apple Premium
 * Metaphor: gross profit vs gross loss side-by-side, with ratio highlighted.
 * Formula: PF = gross_profit / gross_loss
 *   - Below 1.0 → losing system (red)
 *   - 1.0 – 1.5 → marginal (orange)
 *   - 1.5 – 2.5 → solid (blue)
 *   - Above 2.5 → elite (green)
 */
export const ProfitFactorWidget = memo(({
  profitFactor,
  grossProfit,
  grossLoss,
  winCount,
  lossCount,
}: ProfitFactorWidgetProps) => {
  const { t } = useTranslation();

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: n >= 1000 ? 0 : 2,
    }).format(n);

  const tier = useMemo(() => {
    if (!isFinite(profitFactor) || profitFactor > 100) {
      return { label: 'PERFECT', color: 'apple-green', bgTone: 'from-apple-green/15 to-apple-green/5' };
    }
    if (profitFactor >= 2.5) return { label: 'ELITE',    color: 'apple-green', bgTone: 'from-apple-green/15 to-apple-green/5' };
    if (profitFactor >= 1.5) return { label: 'SOLID',    color: 'electric',     bgTone: 'from-electric/15 to-electric/5' };
    if (profitFactor >= 1.0) return { label: 'MARGINAL', color: 'apple-orange', bgTone: 'from-apple-orange/15 to-apple-orange/5' };
    return                   { label: 'LOSING',   color: 'apple-red',    bgTone: 'from-apple-red/15 to-apple-red/5' };
  }, [profitFactor]);

  // Proportion for the split bar (profit share vs loss share of combined absolute)
  const total = grossProfit + grossLoss;
  const profitPct = total > 0 ? (grossProfit / total) * 100 : 50;
  const lossPct = 100 - profitPct;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-space-200 tracking-tight uppercase">
            Profit Factor
          </span>
        </div>
        <span
          className={cn(
            'chip',
            tier.color === 'apple-green' && 'chip-green',
            tier.color === 'electric' && 'chip-electric',
            tier.color === 'apple-orange' && 'chip-orange',
            tier.color === 'apple-red' && 'chip-red',
          )}
        >
          {tier.label}
        </span>
      </div>

      {/* Hero number */}
      <div className="px-4 pb-3 flex items-baseline gap-3">
        <span className={cn('font-display text-5xl font-bold tabular-nums tracking-tight leading-none',
          tier.color === 'apple-green' && 'text-gradient-profit',
          tier.color === 'electric' && 'text-gradient-electric',
          tier.color === 'apple-orange' && 'text-apple-orange',
          tier.color === 'apple-red' && 'text-gradient-loss',
        )}>
          {isFinite(profitFactor) && profitFactor < 100 ? profitFactor.toFixed(2) : '∞'}
        </span>
        <span className="text-xs text-space-300 tabular-nums">
          × return per $1 risked
        </span>
      </div>

      {/* Breakdown: wins vs losses */}
      <div className="px-4 pb-4 space-y-3">
        {/* Split bar */}
        <div className="relative h-2 rounded-full overflow-hidden bg-space-600">
          <div
            className="absolute left-0 top-0 h-full bg-apple-green transition-all duration-700 ease-out"
            style={{ width: `${profitPct}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-apple-red transition-all duration-700 ease-out"
            style={{ width: `${lossPct}%` }}
          />
        </div>

        {/* Labels under split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-apple-green" />
              <span className="text-[10px] text-space-300 uppercase tracking-wide">Gross Profit</span>
            </div>
            <span className="text-sm font-semibold text-apple-green tabular-nums">
              +{formatCurrency(grossProfit)}
            </span>
            <span className="text-[10px] text-space-400 tabular-nums">
              {winCount} winning {winCount === 1 ? 'trade' : 'trades'}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-space-300 uppercase tracking-wide">Gross Loss</span>
              <TrendingDown className="w-3 h-3 text-apple-red" />
            </div>
            <span className="text-sm font-semibold text-apple-red tabular-nums">
              −{formatCurrency(grossLoss)}
            </span>
            <span className="text-[10px] text-space-400 tabular-nums">
              {lossCount} losing {lossCount === 1 ? 'trade' : 'trades'}
            </span>
          </div>
        </div>

        {/* Plain-english summary */}
        <div className="pt-2 border-t border-space-500/40">
          <p className="text-[11px] text-space-300 leading-snug">
            For every <span className="text-apple-red font-semibold tabular-nums">$1</span> you lost,
            you earned <span className="text-apple-green font-semibold tabular-nums">
              ${isFinite(profitFactor) && profitFactor < 100 ? profitFactor.toFixed(2) : '∞'}
            </span>.
          </p>
        </div>
      </div>
    </div>
  );
});

ProfitFactorWidget.displayName = 'ProfitFactorWidget';
