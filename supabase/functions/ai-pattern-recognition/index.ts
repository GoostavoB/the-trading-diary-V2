import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Trade {
  id: string;
  symbol: string;
  side: string;
  pnl: number;
  roi: number;
  setup: string;
  trade_date: string;
  duration_minutes: number;
  emotional_tag?: string;
  period_of_day?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { user_id } = await req.json();

    console.log('Starting AI pattern recognition for user:', user_id);

    // Fetch user's trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user_id)
      .order('trade_date', { ascending: false });

    if (tradesError) throw tradesError;

    console.log(`Analyzing ${trades.length} trades`);

    // Analyze patterns
    const patterns = analyzePatterns(trades);
    const insights = generateInsights(trades, patterns);

    // Cache the results
    const requestHash = `pattern_recognition_${user_id}_${Date.now()}`;
    await supabase
      .from('ai_analysis_cache')
      .insert({
        user_id,
        analysis_type: 'pattern_recognition',
        request_hash: requestHash,
        result: { patterns, insights },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    console.log(`Found ${patterns.length} patterns and ${insights.length} insights`);

    return new Response(
      JSON.stringify({ patterns, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-pattern-recognition:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzePatterns(trades: Trade[]) {
  const patterns = [];

  // Winning setup pattern
  const setupStats = analyzeSetups(trades);
  const bestSetup = Object.entries(setupStats)
    .sort(([, a]: any, [, b]: any) => b.winRate - a.winRate)
    .filter(([, stats]: any) => stats.count >= 5)[0];

  if (bestSetup) {
    const [setupName, stats]: any = bestSetup;
    patterns.push({
      id: `winning_setup_${setupName}`,
      type: 'winning_setup',
      name: `Strong Performance on ${setupName}`,
      description: `Your ${setupName} setup has a ${stats.winRate.toFixed(1)}% win rate across ${stats.count} trades.`,
      confidence: Math.min(95, 60 + stats.count * 2),
      frequency: stats.count,
      impact: stats.avgPnL > 100 ? 'high' : stats.avgPnL > 50 ? 'medium' : 'low',
      recommendation: `Continue using this setup. Consider increasing position size slightly when you identify ${setupName} opportunities.`,
    });
  }

  // Losing setup pattern
  const worstSetup = Object.entries(setupStats)
    .sort(([, a]: any, [, b]: any) => a.winRate - b.winRate)
    .filter(([, stats]: any) => stats.count >= 5 && stats.winRate < 45)[0];

  if (worstSetup) {
    const [setupName, stats]: any = worstSetup;
    patterns.push({
      id: `losing_setup_${setupName}`,
      type: 'losing_setup',
      name: `Underperforming ${setupName} Setup`,
      description: `Your ${setupName} setup has only a ${stats.winRate.toFixed(1)}% win rate across ${stats.count} trades.`,
      confidence: Math.min(90, 50 + stats.count * 2),
      frequency: stats.count,
      impact: Math.abs(stats.avgPnL) > 100 ? 'high' : 'medium',
      recommendation: `Review your entry criteria for ${setupName} setups. Consider paper trading this setup until you improve consistency.`,
    });
  }

  // Time-based pattern
  const timeStats = analyzeTimePatterns(trades);
  const bestTime = Object.entries(timeStats)
    .sort(([, a]: any, [, b]: any) => b.winRate - a.winRate)
    .filter(([, stats]: any) => stats.count >= 5)[0];

  if (bestTime) {
    const [period, stats]: any = bestTime;
    patterns.push({
      id: `time_pattern_${period}`,
      type: 'time_pattern',
      name: `Peak Performance During ${period}`,
      description: `You achieve your best results trading during ${period} with a ${stats.winRate.toFixed(1)}% win rate.`,
      confidence: Math.min(85, 50 + stats.count),
      frequency: stats.count,
      impact: 'high',
      recommendation: `Focus your trading activity during ${period}. Avoid trading during your less profitable time periods.`,
    });
  }

  // Emotional pattern
  const emotionalStats = analyzeEmotionalPatterns(trades);
  if (emotionalStats.overtrading) {
    patterns.push({
      id: 'behavior_overtrading',
      type: 'behavior_pattern',
      name: 'Overtrading Pattern Detected',
      description: `You tend to take more trades after losses, with an average of ${emotionalStats.tradesAfterLoss.toFixed(1)} trades following a loss.`,
      confidence: 75,
      frequency: emotionalStats.overtradingCount,
      impact: 'high',
      recommendation: 'Implement a strict daily trade limit. Take a break after 2 consecutive losses to avoid revenge trading.',
    });
  }

  return patterns;
}

function analyzeSetups(trades: Trade[]) {
  const setupStats: any = {};

  trades.forEach(trade => {
    const setup = trade.setup || 'Unknown';
    if (!setupStats[setup]) {
      setupStats[setup] = { count: 0, wins: 0, totalPnL: 0 };
    }
    setupStats[setup].count++;
    if (trade.pnl > 0) setupStats[setup].wins++;
    setupStats[setup].totalPnL += trade.pnl;
  });

  Object.keys(setupStats).forEach(setup => {
    setupStats[setup].winRate = (setupStats[setup].wins / setupStats[setup].count) * 100;
    setupStats[setup].avgPnL = setupStats[setup].totalPnL / setupStats[setup].count;
  });

  return setupStats;
}

function analyzeTimePatterns(trades: Trade[]) {
  const timeStats: any = {};

  trades.forEach(trade => {
    const period = trade.period_of_day || 'Unknown';
    if (!timeStats[period]) {
      timeStats[period] = { count: 0, wins: 0, totalPnL: 0 };
    }
    timeStats[period].count++;
    if (trade.pnl > 0) timeStats[period].wins++;
    timeStats[period].totalPnL += trade.pnl;
  });

  Object.keys(timeStats).forEach(period => {
    timeStats[period].winRate = (timeStats[period].wins / timeStats[period].count) * 100;
    timeStats[period].avgPnL = timeStats[period].totalPnL / timeStats[period].count;
  });

  return timeStats;
}

function analyzeEmotionalPatterns(trades: Trade[]) {
  let tradesAfterLoss = 0;
  const lossStreakCount = 0;
  let overtradingCount = 0;

  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].pnl < 0) {
      tradesAfterLoss++;
      
      // Check if multiple trades on same day after loss
      const prevDate = new Date(trades[i - 1].trade_date).toDateString();
      const currDate = new Date(trades[i].trade_date).toDateString();
      if (prevDate === currDate) {
        overtradingCount++;
      }
    }
  }

  return {
    overtrading: overtradingCount > 5,
    tradesAfterLoss: trades.length > 1 ? tradesAfterLoss / (trades.length - 1) : 0,
    overtradingCount,
  };
}

function generateInsights(trades: Trade[], patterns: any[]) {
  const insights = [];
  
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = (trades.filter(t => t.pnl > 0).length / trades.length) * 100;

  if (winRate > 55) {
    insights.push({
      category: 'Performance',
      title: 'Strong Win Rate',
      description: `Your ${winRate.toFixed(1)}% win rate is above average. Focus on consistency and proper risk management to maximize profits.`,
      actionable: true,
      priority: 'medium',
    });
  } else if (winRate < 45) {
    insights.push({
      category: 'Performance',
      title: 'Win Rate Needs Improvement',
      description: `Your ${winRate.toFixed(1)}% win rate is below optimal. Review your entry criteria and consider reducing trade frequency to focus on high-quality setups.`,
      actionable: true,
      priority: 'high',
    });
  }

  if (totalPnL > 0) {
    const avgWin = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl > 0).length;
    const avgLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl < 0).length);
    const riskRewardRatio = avgWin / avgLoss;

    if (riskRewardRatio > 2) {
      insights.push({
        category: 'Risk Management',
        title: 'Excellent Risk-Reward Ratio',
        description: `Your ${riskRewardRatio.toFixed(2)}:1 risk-reward ratio is exceptional. This allows you to be profitable even with a lower win rate.`,
        actionable: false,
        priority: 'low',
      });
    } else if (riskRewardRatio < 1.5) {
      insights.push({
        category: 'Risk Management',
        title: 'Improve Risk-Reward Ratio',
        description: `Your ${riskRewardRatio.toFixed(2)}:1 risk-reward ratio needs improvement. Let winners run longer and cut losses faster.`,
        actionable: true,
        priority: 'high',
      });
    }
  }

  const avgDuration = trades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / trades.length;
  if (avgDuration < 30) {
    insights.push({
      category: 'Trading Style',
      title: 'Scalping Detected',
      description: `Your average trade duration of ${avgDuration.toFixed(0)} minutes indicates a scalping style. Ensure your win rate is high enough (>60%) for this to be profitable.`,
      actionable: true,
      priority: 'medium',
    });
  }

  return insights;
}
