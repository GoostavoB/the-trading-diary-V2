import { Card } from '@/components/ui/card';
import { TrendingDown, Activity, TrendingUp, LucideIcon, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatGrowth, getMetricTooltip } from '@/utils/growthFormatting';

interface ForecastScenarioCardProps {
  scenario: 'conservative' | 'base' | 'optimistic';
  dailyGrowth: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  fiveYearGrowth: number;
}

const scenarioConfig: Record<
  'conservative' | 'base' | 'optimistic',
  {
    title: string;
    description: string;
    icon: LucideIcon;
    borderColor: string;
    iconColor: string;
    bgColor: string;
  }
> = {
  conservative: {
    title: 'Conservative Scenario',
    description: 'Accounts for higher volatility and potential drawdowns.',
    icon: TrendingDown,
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500/5',
  },
  base: {
    title: 'Base Scenario',
    description: 'Reflects your current average consistency.',
    icon: Activity,
    borderColor: 'border-primary/30',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/5',
  },
  optimistic: {
    title: 'Optimistic Scenario',
    description: 'Projects growth assuming improved consistency.',
    icon: TrendingUp,
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-500/5',
  },
};

export const ForecastScenarioCard = ({
  scenario,
  dailyGrowth,
  monthlyGrowth,
  yearlyGrowth,
  fiveYearGrowth,
}: ForecastScenarioCardProps) => {
  const config = scenarioConfig[scenario];
  const Icon = config.icon;

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-foreground';
  };

  const MetricRow = ({ 
    label, 
    value, 
    tooltipKey, 
    isHighlight = false 
  }: { 
    label: string; 
    value: number; 
    tooltipKey: string; 
    isHighlight?: boolean;
  }) => (
    <div className={`flex justify-between items-center gap-3 ${isHighlight ? 'pt-3 border-t border-border/50' : ''}`}>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs ${isHighlight ? 'font-medium' : 'text-muted-foreground'}`}>
          {label}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-xs text-xs glass-strong"
              style={{
                backgroundColor: 'hsl(var(--background))',
                backdropFilter: 'blur(12px)'
              }}
            >
              {getMetricTooltip(tooltipKey)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span 
        className={`
          ${isHighlight ? 'text-lg' : 'text-sm'} 
          font-bold 
          ${getGrowthColor(value)} 
          text-right
          bg-gradient-to-r 
          ${value > 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'}
          bg-clip-text
          ${value > 0 || value < 0 ? 'text-transparent' : ''}
        `}
      >
        {formatGrowth(value, isHighlight)}
      </span>
    </div>
  );

  return (
    <Card 
      className={`
        p-6 
        border-2 
        ${config.borderColor} 
        ${config.bgColor} 
        backdrop-blur-xl
        rounded-[1.25rem]
        shadow-[0_4px_30px_rgba(0,0,0,0.05)]
        hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)]
        transition-all
        duration-300
        animate-fade-in
        h-full
        flex
        flex-col
      `}
    >
      <div className="flex items-start gap-3 mb-5">
        <div className={`p-2.5 rounded-xl bg-background/50 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold mb-1 text-foreground">{config.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <MetricRow 
          label="Daily Growth" 
          value={dailyGrowth} 
          tooltipKey="daily"
        />
        <MetricRow 
          label="Monthly Growth" 
          value={monthlyGrowth} 
          tooltipKey="monthly"
        />
        <MetricRow 
          label="Annual Growth" 
          value={yearlyGrowth} 
          tooltipKey="annual"
        />
        <MetricRow 
          label="5-Year Projection" 
          value={fiveYearGrowth} 
          tooltipKey="fiveYear"
          isHighlight
        />
      </div>
    </Card>
  );
};
