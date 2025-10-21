import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { trades } = await req.json();

    console.log(`Generating performance predictions for ${trades.length} trades`);

    const predictions = generatePredictions(trades);
    const risk_alerts = generateRiskAlerts(trades);
    const projection_data = generateProjectionData(trades);

    return new Response(
      JSON.stringify({ predictions, risk_alerts, projection_data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-performance-prediction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePredictions(trades: any[]) {
  const predictions = [];
  
  // Calculate historical metrics
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = (trades.filter(t => t.pnl > 0).length / trades.length) * 100;
  const avgPnL = totalPnL / trades.length;
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
  const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length);

  // 1 Week Prediction
  const weeklyPrediction = predictPerformance(trades, 7, winRate, avgWin, avgLoss);
  predictions.push(weeklyPrediction);

  // 1 Month Prediction
  const monthlyPrediction = predictPerformance(trades, 30, winRate, avgWin, avgLoss);
  predictions.push(monthlyPrediction);

  // 3 Month Prediction
  const quarterlyPrediction = predictPerformance(trades, 90, winRate, avgWin, avgLoss);
  predictions.push(quarterlyPrediction);

  return predictions;
}

function predictPerformance(trades: any[], days: number, winRate: number, avgWin: number, avgLoss: number) {
  const avgTradesPerDay = trades.length / 30; // Assuming last 30 days
  const expectedTrades = Math.round(avgTradesPerDay * days);
  
  const expectedWins = expectedTrades * (winRate / 100);
  const expectedLosses = expectedTrades - expectedWins;
  
  const predictedPnl = (expectedWins * avgWin) - (expectedLosses * avgLoss);
  const predictedRoi = (predictedPnl / (trades.length > 0 ? Math.abs(trades[0].pnl) * trades.length : 1000)) * 100;
  
  // Calculate confidence based on data consistency
  const pnlVariance = calculateVariance(trades.map(t => t.pnl));
  const confidence = Math.min(95, Math.max(40, 85 - (pnlVariance / 100)));
  
  // Best and worst case scenarios (±30% from prediction)
  const bestCase = predictedRoi * 1.3;
  const worstCase = predictedRoi * 0.7;
  
  const keyFactors = generateKeyFactors(trades, winRate, avgWin, avgLoss);
  
  const timeframes: Record<number, string> = {
    7: "Next Week",
    30: "Next Month",
    90: "Next 3 Months"
  };
  
  return {
    timeframe: timeframes[days],
    predicted_pnl: predictedRoi,
    confidence,
    best_case: bestCase,
    worst_case: worstCase,
    key_factors: keyFactors
  };
}

function calculateVariance(values: number[]) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

function generateKeyFactors(trades: any[], winRate: number, avgWin: number, avgLoss: number) {
  const factors = [];
  
  if (winRate > 55) {
    factors.push(`Strong win rate of ${winRate.toFixed(1)}% indicates consistent edge`);
  } else if (winRate < 45) {
    factors.push(`Win rate of ${winRate.toFixed(1)}% is below optimal - focus on trade quality`);
  }
  
  const riskReward = avgWin / avgLoss;
  if (riskReward > 2) {
    factors.push(`Excellent ${riskReward.toFixed(2)}:1 risk-reward ratio supports profitability`);
  } else if (riskReward < 1.5) {
    factors.push(`Risk-reward ratio of ${riskReward.toFixed(2)}:1 needs improvement`);
  }
  
  // Analyze recent trend
  const recentTrades = trades.slice(0, Math.min(10, trades.length));
  const recentPnL = recentTrades.reduce((sum, t) => sum + t.pnl, 0);
  if (recentPnL > 0) {
    factors.push("Recent performance trend is positive");
  } else {
    factors.push("Recent performance shows challenges - may impact short-term results");
  }
  
  // Check consistency
  const winningDays = new Set(trades.filter(t => t.pnl > 0).map(t => new Date(t.trade_date).toDateString())).size;
  const tradingDays = new Set(trades.map(t => new Date(t.trade_date).toDateString())).size;
  const profitableRatio = winningDays / tradingDays;
  
  if (profitableRatio > 0.6) {
    factors.push("High consistency - profitable on majority of trading days");
  } else if (profitableRatio < 0.4) {
    factors.push("Inconsistent daily performance - focus on reducing losing days");
  }
  
  return factors.slice(0, 4);
}

function generateRiskAlerts(trades: any[]) {
  const alerts = [];
  
  // Check for overtrading
  const avgTradesPerDay = trades.length / 30;
  if (avgTradesPerDay > 15) {
    alerts.push({
      type: "Overtrading Risk",
      severity: "high",
      message: `Averaging ${avgTradesPerDay.toFixed(1)} trades per day is excessive and may lead to poor decision-making`,
      recommendation: "Reduce trading frequency and focus only on high-probability setups"
    });
  }
  
  // Check for large losses
  const maxLoss = Math.min(...trades.map(t => t.pnl));
  const avgLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl < 0).length);
  
  if (Math.abs(maxLoss) > avgLoss * 3) {
    alerts.push({
      type: "Position Sizing Risk",
      severity: "high",
      message: `Your largest loss (${maxLoss.toFixed(2)}) is ${(Math.abs(maxLoss) / avgLoss).toFixed(1)}x your average loss`,
      recommendation: "Implement strict position sizing rules - never risk more than 1-2% per trade"
    });
  }
  
  // Check win rate trend
  const recentWinRate = (trades.slice(0, 20).filter(t => t.pnl > 0).length / 20) * 100;
  const overallWinRate = (trades.filter(t => t.pnl > 0).length / trades.length) * 100;
  
  if (recentWinRate < overallWinRate - 10) {
    alerts.push({
      type: "Performance Decline",
      severity: "medium",
      message: `Recent win rate (${recentWinRate.toFixed(1)}%) is significantly lower than your historical average (${overallWinRate.toFixed(1)}%)`,
      recommendation: "Review recent trades for changes in market conditions or personal discipline"
    });
  }
  
  // Check for consecutive losses
  let maxConsecutiveLosses = 0;
  let currentLosses = 0;
  
  for (const trade of trades) {
    if (trade.pnl < 0) {
      currentLosses++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    } else {
      currentLosses = 0;
    }
  }
  
  if (maxConsecutiveLosses >= 6) {
    alerts.push({
      type: "Drawdown Risk",
      severity: "high",
      message: `Maximum consecutive losses: ${maxConsecutiveLosses} trades - indicates potential strategy failure`,
      recommendation: "Stop trading immediately and thoroughly review your strategy and risk management"
    });
  }
  
  return alerts;
}

function generateProjectionData(trades: any[]) {
  const data = [];
  const avgDailyReturn = trades.reduce((sum, t) => sum + t.pnl, 0) / 30; // Assuming 30 days
  
  for (let i = 0; i <= 30; i++) {
    const baseReturn = avgDailyReturn * i;
    data.push({
      date: `Day ${i}`,
      predicted: baseReturn,
      best_case: baseReturn * 1.3,
      worst_case: baseReturn * 0.7
    });
  }
  
  return data;
}
