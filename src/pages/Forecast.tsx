import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ForecastScenarioCard } from '@/components/forecast/ForecastScenarioCard';
import { CalculationModal } from '@/components/forecast/CalculationModal';
import { GoalSimulator } from '@/components/forecast/GoalSimulator';
import { ForecastChart } from '@/components/forecast/ForecastChart';
import { calculateAdvancedStats, AdvancedStats } from '@/lib/forecastCalculations';
import { Sparkles } from 'lucide-react';

const Forecast = () => {
  const { user } = useAuth();
  const [days, setDays] = useState([30]);
  const [avgDailyPnl, setAvgDailyPnl] = useState(0);
  const [projectedEquity, setProjectedEquity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showCalculationModal, setShowCalculationModal] = useState(false);

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
      .select('pnl, trade_date')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (trades && trades.length > 0) {
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
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
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Equity Forecast</h1>
          <p className="text-muted-foreground">Project your future equity based on historical performance</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Calculating projections...</p>
          </div>
        ) : (
          <>
            <Card className="p-6 bg-card border-border">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium">Time Period</label>
                    <span className="text-2xl font-bold">{formatDays(days[0])}</span>
                  </div>
                  <Slider
                    value={days}
                    onValueChange={setDays}
                    min={1}
                    max={1825}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1 day</span>
                    <span>5 years</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Avg Daily P&L</p>
                    <p className={`text-2xl font-bold ${
                      avgDailyPnl === 0 
                        ? 'text-foreground' 
                        : avgDailyPnl > 0 
                        ? 'text-neon-green' 
                        : 'text-neon-red'
                    }`}>
                      ${avgDailyPnl.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Projected Equity</p>
                    <p className={`text-2xl font-bold ${
                      projectedEquity === 0 
                        ? 'text-foreground' 
                        : projectedEquity > 0 
                        ? 'text-neon-green' 
                        : 'text-neon-red'
                    }`}>
                      ${projectedEquity.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-3">Disclaimer</h3>
              <p className="text-sm text-muted-foreground">
                This forecast is based on your historical trading performance and assumes consistent trading behavior. 
                Past performance does not guarantee future results. Markets are unpredictable, and actual results may vary significantly.
              </p>
            </Card>

            {/* Forecast 2.0 Section */}
            <div className="space-y-6 mt-12">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-3xl font-bold">Forecast 2.0 - Long-Term Growth</h2>
                  <p className="text-muted-foreground">
                    Statistical projections based on geometric expectancy and compound growth
                  </p>
                </div>
              </div>

              {advancedStats ? (
                <>
                  {/* Growth Chart */}
                  <ForecastChart
                    currentBalance={currentBalance}
                    dailyGrowthBase={advancedStats.daily_growth_base}
                    dailyGrowthOptimistic={advancedStats.daily_growth_optimistic}
                    dailyGrowthConservative={advancedStats.daily_growth_conservative}
                    selectedPeriod={days[0]}
                  />

                  {/* Three Scenario Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ForecastScenarioCard
                      scenario="conservative"
                      dailyGrowth={advancedStats.daily_growth_conservative}
                      monthlyGrowth={advancedStats.monthly_growth_conservative}
                      yearlyGrowth={advancedStats.yearly_growth_conservative}
                      fiveYearGrowth={advancedStats.five_year_growth_conservative}
                    />
                    <ForecastScenarioCard
                      scenario="base"
                      dailyGrowth={advancedStats.daily_growth_base}
                      monthlyGrowth={advancedStats.monthly_growth_base}
                      yearlyGrowth={advancedStats.yearly_growth_base}
                      fiveYearGrowth={advancedStats.five_year_growth_base}
                    />
                    <ForecastScenarioCard
                      scenario="optimistic"
                      dailyGrowth={advancedStats.daily_growth_optimistic}
                      monthlyGrowth={advancedStats.monthly_growth_optimistic}
                      yearlyGrowth={advancedStats.yearly_growth_optimistic}
                      fiveYearGrowth={advancedStats.five_year_growth_optimistic}
                    />
                  </div>

                  {/* Understand the Calculation Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowCalculationModal(true)}
                    >
                      Understand the Calculation
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
                <Card className="p-12 text-center bg-card border-border">
                  <p className="text-muted-foreground mb-2">
                    Add at least 5 trades to see advanced growth projections
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Forecast 2.0 requires minimum trading history for statistical validity
                  </p>
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
    </AppLayout>
  );
};

export default Forecast;
