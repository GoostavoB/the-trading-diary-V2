import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap,
  ArrowUp,
  ArrowDown 
} from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface KPIChipProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  prefix?: string;
  isPercentage?: boolean;
  isCurrency?: boolean;
}

const KPIChip = memo(({ 
  label, 
  value, 
  icon, 
  trend = 'neutral',
  suffix = '',
  prefix = '',
  isPercentage = false,
  isCurrency = false,
}: KPIChipProps) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  
  const trendColor = trend === 'up' 
    ? 'text-neon-green' 
    : trend === 'down' 
      ? 'text-neon-red' 
      : 'text-foreground';

  const bgColor = trend === 'up'
    ? 'bg-neon-green/10 border-neon-green/20'
    : trend === 'down'
      ? 'bg-neon-red/10 border-neon-red/20'
      : 'bg-card/50 border-border/50';

  return (
    <div className={cn(
      "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]",
      bgColor
    )}>
      <div className={cn("p-1.5 rounded-md bg-background/50", trendColor)}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={cn("text-sm font-semibold tabular-nums", trendColor)}>
          {prefix}
          {typeof value === 'number' ? (
            <AnimatedCounter 
              value={numericValue} 
              decimals={isPercentage ? 1 : isCurrency ? 2 : 0}
              suffix={suffix}
            />
          ) : (
            <>{value}{suffix}</>
          )}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
    </div>
  );
});

KPIChip.displayName = 'KPIChip';

interface CompactKPIRowProps {
  totalPnL: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  currentStreak: { type: 'win' | 'loss'; count: number };
  className?: string;
}

export const CompactKPIRow = memo(({
  totalPnL,
  roi,
  winRate,
  totalTrades,
  currentStreak,
  className,
}: CompactKPIRowProps) => {
  const pnlTrend = totalPnL > 0 ? 'up' : totalPnL < 0 ? 'down' : 'neutral';
  const roiTrend = roi > 0 ? 'up' : roi < 0 ? 'down' : 'neutral';
  const winRateTrend = winRate >= 50 ? 'up' : 'down';
  const streakTrend = currentStreak.type === 'win' ? 'up' : 'down';

  const streakDisplay = useMemo(() => {
    const prefix = currentStreak.type === 'win' ? '' : '-';
    return `${prefix}${currentStreak.count}`;
  }, [currentStreak]);

  return (
    <div className={cn(
      "flex flex-wrap gap-2 p-3 bg-gradient-to-r from-background/80 to-background/60 rounded-xl border border-border/30",
      className
    )}>
      <KPIChip
        label="Net P&L"
        value={totalPnL}
        icon={<DollarSign className="h-3.5 w-3.5" />}
        trend={pnlTrend}
        prefix={totalPnL >= 0 ? '+$' : '-$'}
        isCurrency
      />
      <KPIChip
        label="ROI"
        value={Math.abs(roi)}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        trend={roiTrend}
        prefix={roi >= 0 ? '+' : '-'}
        suffix="%"
        isPercentage
      />
      <KPIChip
        label="Win Rate"
        value={winRate}
        icon={<Target className="h-3.5 w-3.5" />}
        trend={winRateTrend}
        suffix="%"
        isPercentage
      />
      <KPIChip
        label="Trades"
        value={totalTrades}
        icon={<BarChart3 className="h-3.5 w-3.5" />}
        trend="neutral"
      />
      <KPIChip
        label="Streak"
        value={streakDisplay}
        icon={currentStreak.type === 'win' 
          ? <ArrowUp className="h-3.5 w-3.5" /> 
          : <ArrowDown className="h-3.5 w-3.5" />
        }
        trend={streakTrend}
        suffix={currentStreak.type === 'win' ? 'W' : 'L'}
      />
    </div>
  );
});

CompactKPIRow.displayName = 'CompactKPIRow';
