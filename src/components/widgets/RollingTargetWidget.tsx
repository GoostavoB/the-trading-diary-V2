import { memo, useState, useMemo } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { Trade } from '@/types/trade';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { useRollingTargetSettings, type SuggestionMethod } from '@/hooks/useRollingTargetSettings';
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Info,
  Target,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface RollingTargetWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  trades: Trade[];
  initialInvestment: number;
}

interface DailyData {
  date: string;
  startCapital: number;
  pnl: number;
  endCapital: number;
  plannedCapital: number;
  deviation: number;
  requiredToday: number;
  headroom: number;
  returnPercent: number;
}

export const RollingTargetWidget = memo(({
  id,
  isEditMode,
  onRemove,
  trades = [],  // Add default empty array to prevent crashes
  initialInvestment = 0,  // Add default value to prevent crashes
}: RollingTargetWidgetProps) => {
  const { 
    settings, 
    loading: settingsLoading,
    updateSetting, 
    applySuggestion: applySettingsSuggestion,
    dismissSuggestion: dismissSettingsSuggestion 
  } = useRollingTargetSettings();

  const [showSettings, setShowSettings] = useState(false);

  // Calculate daily data
  const dailyData = useMemo<DailyData[]>(() => {
    if (!trades.length || !initialInvestment) return [];

    // Sort trades by date
    const sortedTrades = [...trades]
      .filter(t => t.closed_at)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    if (sortedTrades.length === 0) return [];

    const dailyMap = new Map<string, DailyData>();
    let currentCapital = initialInvestment;
    const startDate = parseISO(sortedTrades[0].closed_at!);
    const endDate = parseISO(sortedTrades[sortedTrades.length - 1].closed_at!);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    
    const p = (settings?.targetPercent || 1) / 100;

    // Group trades by day
    sortedTrades.forEach(trade => {
      const dateStr = format(parseISO(trade.closed_at!), 'yyyy-MM-dd');
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          startCapital: currentCapital,
          pnl: 0,
          endCapital: currentCapital,
          plannedCapital: 0,
          deviation: 0,
          requiredToday: 0,
          headroom: 0,
          returnPercent: 0,
        });
      }
      const day = dailyMap.get(dateStr)!;
      day.pnl += trade.profit_loss || 0;
    });

    // Calculate cumulative values and planned path
    const daysArray: DailyData[] = [];
    let dayIndex = 0;

    dailyMap.forEach((day, dateStr) => {
      day.endCapital = day.startCapital + day.pnl;
      day.returnPercent = day.startCapital > 0 ? (day.pnl / day.startCapital) * 100 : 0;
      
      // Planned path: C0 * (1 + p)^n
      day.plannedCapital = initialInvestment * Math.pow(1 + p, dayIndex + 1);
      
      // Calculate required today for rolling mode
      if (settings?.mode === 'rolling') {
        const plannedForToday = initialInvestment * Math.pow(1 + p, dayIndex + 1);
        day.requiredToday = Math.max(0, plannedForToday - day.endCapital);
        day.headroom = Math.max(0, day.endCapital - plannedForToday);
        
        // Apply carry-over cap
        const capAmount = ((settings?.carryOverCap || 2) / 100) * day.startCapital;
        day.requiredToday = Math.min(day.requiredToday, capAmount);
      } else {
        // Per-day mode: fixed percent of current capital
        day.requiredToday = p * day.startCapital;
        day.headroom = Math.max(0, day.pnl - day.requiredToday);
      }
      
      day.deviation = day.endCapital - day.plannedCapital;
      
      daysArray.push(day);
      currentCapital = day.endCapital;
      dayIndex++;
    });

    return daysArray;
  }, [trades, initialInvestment, settings?.targetPercent, settings?.mode, settings?.carryOverCap]);

  // Calculate today's required PnL
  const todayData = useMemo(() => {
    if (dailyData.length === 0) return null;
    
    const lastDay = dailyData[dailyData.length - 1];
    const p = (settings?.targetPercent || 1) / 100;
    const daysSinceStart = dailyData.length;
    
    const plannedCapital = initialInvestment * Math.pow(1 + p, daysSinceStart);
    const actualCapital = lastDay.endCapital;
    
    let requiredToday = 0;
    let headroom = 0;
    let isAhead = false;
    
    if (settings?.mode === 'rolling') {
      const nextPlanned = initialInvestment * Math.pow(1 + p, daysSinceStart + 1);
      const needed = nextPlanned - actualCapital;
      
      if (needed <= 0) {
        isAhead = true;
        headroom = actualCapital - nextPlanned;
        requiredToday = 0;
      } else {
        requiredToday = needed;
        const capAmount = ((settings?.carryOverCap || 2) / 100) * actualCapital;
        requiredToday = Math.min(requiredToday, capAmount);
      }
    } else {
      requiredToday = p * actualCapital;
      isAhead = false;
    }
    
    // Calculate forecasts based on current progress
    const forecast30Days = actualCapital * Math.pow(1 + p, 30);
    const forecast6Months = actualCapital * Math.pow(1 + p, 180);
    const forecast1Year = actualCapital * Math.pow(1 + p, 365);
    
    return {
      requiredToday,
      headroom,
      isAhead,
      actualCapital,
      plannedCapital: plannedCapital,
      deviation: actualCapital - plannedCapital,
      forecast30Days,
      forecast6Months,
      forecast1Year,
    };
  }, [dailyData, settings?.mode, settings?.targetPercent, settings?.carryOverCap, initialInvestment]);

  // Adaptive suggestion logic
  const suggestedPercent = useMemo(() => {
    if (!settings?.suggestionsEnabled || dailyData.length < 20) return null;
    
    const last20Days = dailyData.slice(-20);
    const returns = last20Days.map(d => d.returnPercent / 100);
    
    let suggestion = 0;
    
    if (settings?.suggestionMethod === 'median') {
      const sorted = [...returns].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length * 0.6); // 60th percentile
      suggestion = sorted[mid] * 100;
    } else {
      // Risk-aware: mean - 0.5 * stdev
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const stdev = Math.sqrt(variance);
      suggestion = (mean - 0.5 * stdev) * 100;
    }
    
    // Clamp between 0.1% and 20%
    suggestion = Math.max(0.1, Math.min(20, suggestion));
    
    // Check trigger conditions
    const wins = last20Days.filter(d => d.pnl > 0).length;
    const hitRate = wins / last20Days.length;
    
    const last5 = dailyData.slice(-5);
    const consistentlyBehind = last5.every(d => d.deviation < -0.05 * d.plannedCapital);
    
    const shouldSuggest = hitRate < 0.5 || consistentlyBehind;
    
    // Check cooldown (7 days)
    if (settings?.lastSuggestionDate) {
      const daysSince = differenceInDays(new Date(), parseISO(settings.lastSuggestionDate));
      if (daysSince < 7) return null;
    }
    
    return shouldSuggest && !settings?.dismissedSuggestion ? suggestion : null;
  }, [dailyData, settings?.suggestionMethod, settings?.suggestionsEnabled, settings?.dismissedSuggestion, settings?.lastSuggestionDate]);

  const applySuggestion = () => {
    if (suggestedPercent) {
      applySettingsSuggestion(Number(suggestedPercent.toFixed(2)));
    }
  };

  const dismissSuggestion = () => {
    dismissSettingsSuggestion();
  };

  // Chart data
  const chartData = useMemo(() => {
    return dailyData.map(d => ({
      date: format(parseISO(d.date), 'MMM dd'),
      actual: d.endCapital,
      planned: d.plannedCapital,
      required: d.requiredToday,
    }));
  }, [dailyData]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    if (dailyData.length === 0) return null;
    
    const daysAhead = dailyData.filter(d => d.deviation >= 0).length;
    const daysBehind = dailyData.filter(d => d.deviation < 0).length;
    const successRate = (daysAhead / dailyData.length) * 100;
    
    const avgRequiredWhenBehind = dailyData
      .filter(d => d.requiredToday > 0 && d.deviation < 0)
      .reduce((sum, d) => sum + d.requiredToday, 0) / Math.max(1, daysBehind);
    
    const lastDay = dailyData[dailyData.length - 1];
    // Check if today's PnL meets or exceeds the required amount
    const metTodaysTarget = settings?.mode === 'rolling' 
      ? lastDay.pnl >= (lastDay.plannedCapital - lastDay.startCapital)
      : lastDay.pnl >= lastDay.requiredToday;
    const currentStatus = metTodaysTarget ? 'ahead' : 'behind';
    const driftPercent = lastDay.plannedCapital > 0 
      ? (lastDay.deviation / lastDay.plannedCapital) * 100 
      : 0;
    const driftAmount = Math.abs(lastDay.deviation);
    
    return {
      currentStatus,
      driftPercent,
      driftAmount,
      successRate,
      avgRequiredWhenBehind,
      totalDays: dailyData.length,
    };
  }, [dailyData]);

  if (!trades.length || !initialInvestment) {
    return (
      <WidgetWrapper
        id={id}
        title="Rolling Target Tracker"
        isEditMode={isEditMode}
        onRemove={onRemove}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Add trades and set initial investment to start tracking
          </p>
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper
      id={id}
      title="Rolling Target Tracker"
      isEditMode={isEditMode}
      onRemove={onRemove}
      headerActions={
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rolling Target Settings</DialogTitle>
              <DialogDescription>
                Configure your daily target tracking preferences
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Tracking Mode</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Rolling with Carry-Over:</p>
                        <p className="mb-2">Missed targets carry forward to the next day. If you fall short, tomorrow's target includes making up today's shortfall (with a cap to prevent wild swings).</p>
                        <p className="font-semibold mb-1">Per-Day Fixed Percent:</p>
                        <p>Fresh start every day. Each day has a simple target of X% of your current capital, regardless of yesterday's performance.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={settings?.mode || 'per-day'}
                  onValueChange={(value) => updateSetting('mode', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rolling">Rolling with Carry-Over</SelectItem>
                    <SelectItem value="per-day">Per-Day Fixed Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Growth Daily Target Percent (%)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The daily percentage growth you aim to achieve. For example, 5% means you want your capital to grow by 5% each day through compounding.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={settings?.targetPercent || 1}
                  onChange={(e) => updateSetting('targetPercent', Number(e.target.value))}
                />
              </div>

              {settings?.mode === 'rolling' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Carry-Over Cap (%)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Maximum catch-up requirement as % of current capital. Prevents unrealistic targets if you fall far behind. Default is 2× your daily target percent.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.5"
                    min={settings?.targetPercent || 1}
                    max={(settings?.targetPercent || 1) * 5}
                    value={settings?.carryOverCap || 2}
                    onChange={(e) => updateSetting('carryOverCap', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum daily requirement as % of current capital
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Enable Suggestions</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Let the system analyze your last 20 trading days and suggest a more realistic target percent based on your actual performance.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  checked={settings?.suggestionsEnabled ?? true}
                  onCheckedChange={(checked) => updateSetting('suggestionsEnabled', checked)}
                />
              </div>

              {settings?.suggestionsEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Suggestion Method</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Median (60th percentile):</p>
                          <p className="mb-2">Conservative approach. Suggests a target you can hit 60% of the time. Best for steady traders who want consistent, achievable goals.</p>
                          <p className="font-semibold mb-1">Risk Aware (Mean - 0.5σ):</p>
                          <p>Safety-first approach. Accounts for volatility and suggests a lower target with a buffer. Best for traders who want high confidence in hitting targets even on bad days.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={settings?.suggestionMethod || 'median'}
                    onValueChange={(value) => updateSetting('suggestionMethod', value as SuggestionMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="median">
                        <div className="space-y-1">
                          <div className="font-medium">Median (60th percentile)</div>
                          <div className="text-xs text-muted-foreground">
                            For steady traders wanting consistent goals
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="risk-aware">
                        <div className="space-y-1">
                          <div className="font-medium">Risk Aware (Mean - 0.5σ)</div>
                          <div className="text-xs text-muted-foreground">
                            For traders wanting high confidence targets
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Rollover Weekends</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>If enabled, unmet weekend targets roll forward to Monday. If disabled, the plan skips weekends entirely.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  checked={settings?.rolloverWeekends ?? true}
                  onCheckedChange={(checked) => updateSetting('rolloverWeekends', checked)}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Top Bar - Mode and Today's Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {settings.mode === 'rolling' ? 'Rolling' : 'Per-Day'}
            </Badge>
            <Badge variant="secondary">
              Target: {settings.targetPercent}%
            </Badge>
          </div>

          {todayData && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              {todayData.isAhead ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-profit" />
                    <p className="text-sm font-medium text-profit">You are ahead!</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Headroom</span>
                    <span className="text-lg font-bold text-profit">
                      {formatCurrency(todayData.headroom)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Today's minimum to stay on track: $0
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">Forecasts:</span>
                    <Badge variant="secondary" className="text-xs">
                      30d: {formatCurrency(todayData.forecast30Days)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      6m: {formatCurrency(todayData.forecast6Months)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      1y: {formatCurrency(todayData.forecast1Year)}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">Today to stay on track</p>
                  </div>
                   <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Required PnL</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(todayData.requiredToday)}
                    </span>
                  </div>
                  {settings.mode === 'rolling' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Info className="h-3 w-3" />
                            <span>Capped at {settings.carryOverCap}% of capital</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Prevents wild swings from accumulated carry-over</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">Forecasts:</span>
                    <Badge variant="secondary" className="text-xs">
                      30d: {formatCurrency(todayData.forecast30Days)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      6m: {formatCurrency(todayData.forecast6Months)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      1y: {formatCurrency(todayData.forecast1Year)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Adaptive Suggestion Card */}
        {suggestedPercent && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Suggested Target Adjustment</p>
                <p className="text-xs text-muted-foreground">
                  Based on your last 20 days, try {suggestedPercent.toFixed(2)}% for a more realistic target
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={applySuggestion}>
                    Apply {suggestedPercent.toFixed(2)}%
                  </Button>
                  <Button size="sm" variant="ghost" onClick={dismissSuggestion}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'actual' ? 'Actual' : name === 'planned' ? 'Planned' : 'Required'
                ]}
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#actualGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Status</p>
              <div className="flex items-center gap-2">
                {summaryMetrics.currentStatus === 'ahead' ? (
                  <>
                    <ArrowUpCircle className="h-4 w-4 text-profit" />
                    <p className="text-lg font-bold text-profit">Ahead</p>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-4 w-4 text-loss" />
                    <p className="text-lg font-bold text-loss">Behind</p>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Drift from Plan</p>
              <p className={`text-lg font-bold ${summaryMetrics.driftPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                {summaryMetrics.driftPercent >= 0 ? '+' : ''}{summaryMetrics.driftPercent.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className={`text-lg font-bold ${summaryMetrics.successRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                {summaryMetrics.successRate.toFixed(0)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avg Catch-Up</p>
              <p className="text-lg font-bold">{formatCurrency(summaryMetrics.avgRequiredWhenBehind)}</p>
            </div>
          </div>
        )}

        {/* Daily Log Table */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent (10 days)</TabsTrigger>
            <TabsTrigger value="all">All Days</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-2">
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-right p-2">PnL</th>
                    <th className="text-right p-2">Actual</th>
                    <th className="text-right p-2">Planned</th>
                    <th className="text-right p-2">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.slice(-10).reverse().map((day) => (
                    <tr key={day.date} className="border-b hover:bg-muted/50">
                      <td className="p-2">{format(parseISO(day.date), 'MMM dd')}</td>
                      <td className={`text-right p-2 font-medium ${day.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(day.pnl)}
                      </td>
                      <td className="text-right p-2">{formatCurrency(day.endCapital)}</td>
                      <td className="text-right p-2 text-muted-foreground">{formatCurrency(day.plannedCapital)}</td>
                      <td className="text-right p-2 font-medium">
                        {day.requiredToday > 0 ? formatCurrency(day.requiredToday) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-2">
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-right p-2">PnL</th>
                    <th className="text-right p-2">Actual</th>
                    <th className="text-right p-2">Planned</th>
                    <th className="text-right p-2">Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.slice().reverse().map((day) => (
                    <tr key={day.date} className="border-b hover:bg-muted/50">
                      <td className="p-2">{format(parseISO(day.date), 'MMM dd, yyyy')}</td>
                      <td className={`text-right p-2 font-medium ${day.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(day.pnl)}
                      </td>
                      <td className="text-right p-2">{formatCurrency(day.endCapital)}</td>
                      <td className="text-right p-2 text-muted-foreground">{formatCurrency(day.plannedCapital)}</td>
                      <td className={`text-right p-2 font-medium ${day.deviation >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {day.deviation >= 0 ? '+' : ''}{formatCurrency(day.deviation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WidgetWrapper>
  );
});

RollingTargetWidget.displayName = 'RollingTargetWidget';
