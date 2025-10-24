import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ForecastScenarioCard } from '@/components/forecast/ForecastScenarioCard';
import { CalculationModal } from '@/components/forecast/CalculationModal';
import { GoalSimulator } from '@/components/forecast/GoalSimulator';
import { ForecastChart } from '@/components/forecast/ForecastChart';
import { AIForecastCommentary } from '@/components/forecast/AIForecastCommentary';
import { calculateAdvancedStats, AdvancedStats } from '@/lib/forecastCalculations';
import { calculateGrowth } from '@/utils/growthFormatting';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sparkles, Settings2, TrendingDown } from 'lucide-react';
import { PremiumFeatureLock } from '@/components/PremiumFeatureLock';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

const Forecast = () => {
  useKeyboardShortcuts();
  const { user } = useAuth();
  const { isFeatureLocked } = usePremiumFeatures();
  const isPremiumLocked = isFeatureLocked('pro');
  const [days, setDays] = useState([30]);
  const [avgDailyPnl, setAvgDailyPnl] = useState(0);
  const [projectedEquity, setProjectedEquity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [customDailyGrowth, setCustomDailyGrowth] = useState<number | null>(null);
  const [includeDrawdown, setIncludeDrawdown] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    fetchAvgPnl();
    fetchAdvancedStats();
    
    // Set up realtime subscription for trades changes
    const channel = supabase
      .channel('trades-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchAvgPnl();
          fetchAdvancedStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    setProjectedEquity(avgDailyPnl * days[0]);
  }, [days, avgDailyPnl]);

  const fetchAvgPnl = async () => {
    if (!user) return;

    const { data: trades } = await supabase
      .from('trades')
      .select('pnl, trade_date, trading_fee, funding_fee')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (trades && trades.length > 0) {
      // Calculate P&L after fees
      const totalPnl = trades.reduce((sum, t) => {
        const pnl = t.pnl || 0;
        const tradingFee = t.trading_fee || 0;
        const fundingFee = t.funding_fee || 0;
        return sum + (pnl - tradingFee - fundingFee);
      }, 0);
      const uniqueDays = new Set(trades.map(t => new Date(t.trade_date).toDateString())).size;
      setAvgDailyPnl(totalPnl / (uniqueDays || 1));
    } else {
      setAvgDailyPnl(0);
    }
    setLoading(false);
  };

  const fetchAdvancedStats = async () => {
    if (!user) return;

    // Fetch trades with ROI and margin data
    const { data: trades } = await supabase
      .from('trades')
      .select('roi, margin, pnl')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Fetch user settings for balance
    const { data: settings } = await supabase
      .from('user_settings')
      .select('initial_investment')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      setCurrentBalance(settings.initial_investment || 0);
    }

    if (trades) {
      const stats = calculateAdvancedStats(trades);
      setAdvancedStats(stats);
    }
  };

  const formatDays = (days: number) => {
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'}`;
    const months = Math.round(days / 30);
    if (days < 365) return `${months} ${months === 1 ? 'month' : 'months'}`;
    const years = Math.round(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  };

  return (
    <AppLayout>
      <PremiumFeatureLock requiredPlan="pro" isLocked={isPremiumLocked}>
        <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">Equity Forecast</h1>
          <p className="text-muted-foreground text-lg">Project your future equity based on historical performance</p>
        </header>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Calculating projections...</p>
            </div>
          </div>
        ) : (
          <>
            <Card className="p-6 glass-card border-border/50">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-foreground">Time Period</label>
                    <span className="text-2xl font-bold text-primary">{formatDays(days[0])}</span>
                  </div>
                  <Slider
                    value={days}
                    onValueChange={setDays}
                    min={1}
                    max={1825}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-3">
                    <span>1 day</span>
                    <span>5 years</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 glass-subtle rounded-xl border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Avg Daily P&L</p>
                    <p className={`text-3xl font-bold ${
                      avgDailyPnl === 0 
                        ? 'text-foreground' 
                        : avgDailyPnl > 0 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      ${avgDailyPnl.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-5 glass-subtle rounded-xl border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Projected Equity</p>
                    <p className={`text-3xl font-bold ${
                      projectedEquity === 0 
                        ? 'text-foreground' 
                        : projectedEquity > 0 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      ${projectedEquity.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 glass-card border-warning/30 bg-warning/5">
              <h3 className="text-base font-semibold mb-2 text-foreground flex items-center gap-2">
                <span className="text-warning">⚠️</span> Disclaimer
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This forecast is based on your historical trading performance and assumes consistent trading behavior. 
                Past performance does not guarantee future results. Markets are unpredictable, and actual results may vary significantly.
              </p>
            </Card>

            {/* Forecast 2.0 Section */}
            <div className="space-y-8 mt-16">
              <header className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Forecast - Long-Term Growth</h2>
                <p className="text-muted-foreground text-lg mt-1">
                  Statistical projections based on geometric expectancy and compound growth
                </p>
              </div>
              </header>

              {advancedStats ? (
                <>
                  {/* Advanced Settings Card */}
                  <Card className="p-6 glass-card border-border/50">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Settings2 className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Advanced Settings</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="text-primary hover:text-primary/80"
                      >
                        {showAdvancedSettings ? 'Hide' : 'Show'}
                      </Button>
                    </div>

                    {showAdvancedSettings && (
                      <div className="space-y-6 mt-6 pt-6 border-t border-border/50">
                        {/* Daily Growth Simulator */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="daily-growth-slider" className="text-sm font-medium text-foreground">
                              Expected Daily Growth
                            </Label>
                            <span className="text-xl font-bold text-primary">
                              {((customDailyGrowth ?? advancedStats.daily_growth_base) * 100).toFixed(2)}%
                            </span>
                          </div>
                          <Slider
                            id="daily-growth-slider"
                            value={[((customDailyGrowth ?? advancedStats.daily_growth_base) * 100)]}
                            onValueChange={(val) => setCustomDailyGrowth(val[0] / 100)}
                            min={-5}
                            max={10}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-3">
                            <span>-5%</span>
                            <span>+10%</span>
                          </div>
                          {customDailyGrowth !== null && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomDailyGrowth(null)}
                              className="w-full mt-2"
                            >
                              Reset to Calculated Value
                            </Button>
                          )}
                        </div>

                        {/* Include Drawdown Toggle */}
                        <div className="flex items-center justify-between p-5 rounded-xl bg-muted/20 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50">
                              <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <Label htmlFor="drawdown-toggle" className="text-sm font-medium cursor-pointer text-foreground">
                                Include Historical Drawdown
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Adjust projections for average historical losses
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="drawdown-toggle"
                            checked={includeDrawdown}
                            onCheckedChange={setIncludeDrawdown}
                          />
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Growth Chart */}
                  <ForecastChart
                    currentBalance={currentBalance}
                    dailyGrowthBase={customDailyGrowth ?? advancedStats.daily_growth_base}
                    dailyGrowthOptimistic={advancedStats.daily_growth_optimistic}
                    dailyGrowthConservative={advancedStats.daily_growth_conservative}
                    selectedPeriod={days[0]}
                  />

                  {/* Three Scenario Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ForecastScenarioCard
                      scenario="conservative"
                      dailyGrowth={
                        customDailyGrowth !== null 
                          ? customDailyGrowth * (includeDrawdown ? 0.7 : 1)
                          : advancedStats.daily_growth_conservative * (includeDrawdown ? 0.7 : 1)
                      }
                      monthlyGrowth={
                        (() => {
                          const dailyRate = customDailyGrowth !== null 
                            ? customDailyGrowth * (includeDrawdown ? 0.7 : 1)
                            : advancedStats.daily_growth_conservative * (includeDrawdown ? 0.7 : 1);
                          return calculateGrowth(dailyRate).monthlyGrowth;
                        })()
                      }
                      yearlyGrowth={
                        (() => {
                          const dailyRate = customDailyGrowth !== null 
                            ? customDailyGrowth * (includeDrawdown ? 0.7 : 1)
                            : advancedStats.daily_growth_conservative * (includeDrawdown ? 0.7 : 1);
                          return calculateGrowth(dailyRate).annualGrowth;
                        })()
                      }
                      fiveYearGrowth={
                        (() => {
                          const dailyRate = customDailyGrowth !== null 
                            ? customDailyGrowth * (includeDrawdown ? 0.7 : 1)
                            : advancedStats.daily_growth_conservative * (includeDrawdown ? 0.7 : 1);
                          return calculateGrowth(dailyRate).fiveYearGrowth;
                        })()
                      }
                    />
                    <ForecastScenarioCard
                      scenario="base"
                      dailyGrowth={
                        customDailyGrowth !== null 
                          ? customDailyGrowth * (includeDrawdown ? 0.85 : 1)
                          : advancedStats.daily_growth_base * (includeDrawdown ? 0.85 : 1)
                      }
                      monthlyGrowth={
                        (() => {
                          const dailyRate = customDailyGrowth !== null 
                            ? customDailyGrowth * (includeDrawdown ? 0.85 : 1)
                            : advancedStats.daily_growth_base * (includeDrawdown ? 0.85 : 1);
                          return calculateGrowth(dailyRate).monthlyGrowth;
                        })()
                      }
                      yearlyGrowth={
                        (() => {
                          const dailyRate = customDailyGrowth !== null 
                            ? customDailyGrowth * (includeDrawdown ? 0.85 : 1)
                            : advancedStats.daily_growth_base * (includeDrawdown ? 0.85 : 1);
                          return calculateGrowth(dailyRate).annualGrowth;
                        })()
                      }
                      fiveYearGrowth={
                        (() => {
                          const dailyRate = customDailyGrowth !== null 
                            ? customDailyGrowth * (includeDrawdown ? 0.85 : 1)
                            : advancedStats.daily_growth_base * (includeDrawdown ? 0.85 : 1);
                          return calculateGrowth(dailyRate).fiveYearGrowth;
                        })()
                      }
                    />
                    <ForecastScenarioCard
                      scenario="optimistic"
                      dailyGrowth={customDailyGrowth ?? advancedStats.daily_growth_optimistic}
                      monthlyGrowth={
                        customDailyGrowth !== null
                          ? calculateGrowth(customDailyGrowth).monthlyGrowth
                          : advancedStats.monthly_growth_optimistic
                      }
                      yearlyGrowth={
                        customDailyGrowth !== null
                          ? calculateGrowth(customDailyGrowth).annualGrowth
                          : advancedStats.yearly_growth_optimistic
                      }
                      fiveYearGrowth={
                        customDailyGrowth !== null
                          ? calculateGrowth(customDailyGrowth).fiveYearGrowth
                          : advancedStats.five_year_growth_optimistic
                      }
                    />
                  </div>

                  {/* AI Commentary */}
                  <AIForecastCommentary
                    dailyGrowth={customDailyGrowth ?? advancedStats.daily_growth_base}
                    fiveYearGrowth={
                      customDailyGrowth !== null
                        ? calculateGrowth(customDailyGrowth * (includeDrawdown ? 0.85 : 1)).fiveYearGrowth
                        : advancedStats.five_year_growth_base * (includeDrawdown ? 0.85 : 1)
                    }
                    winRate={advancedStats.success_rate / 100}
                    volatility={advancedStats.roi_std_dev / 100}
                  />

                  {/* Understand the Calculation Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowCalculationModal(true)}
                      className="gap-2"
                    >
                      <span>Understand the Calculation</span>
                    </Button>
                  </div>

                  {/* Goal Simulator */}
                  <GoalSimulator
                    currentBalance={currentBalance}
                    winRate={advancedStats.success_rate}
                    avgGainRoi={advancedStats.weighted_roi_gain}
                    avgLossRoi={advancedStats.weighted_roi_loss}
                  />
                </>
              ) : (
                <Card className="p-16 text-center glass-card border-border/50">
                  <div className="max-w-md mx-auto space-y-3">
                    <p className="text-lg font-medium text-foreground">
                      Add at least 5 trades to see advanced growth projections
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Forecast 2.0 requires minimum trading history for statistical validity
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Calculation Modal */}
      <CalculationModal
        open={showCalculationModal}
        onOpenChange={setShowCalculationModal}
      />
      </PremiumFeatureLock>
    </AppLayout>
  );
};

export default Forecast;
