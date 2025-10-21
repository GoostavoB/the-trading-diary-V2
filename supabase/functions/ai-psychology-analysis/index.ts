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

    console.log(`Analyzing trading psychology for ${trades.length} trades`);

    const metrics = analyzeTradingPsychology(trades);

    return new Response(
      JSON.stringify({ metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-psychology-analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeTradingPsychology(trades: any[]) {
  const metrics = [];

  // 1. Emotional Discipline
  const emotionalDiscipline = analyzeEmotionalDiscipline(trades);
  metrics.push(emotionalDiscipline);

  // 2. Risk Management Adherence
  const riskManagement = analyzeRiskManagement(trades);
  metrics.push(riskManagement);

  // 3. Revenge Trading Tendency
  const revengeTrading = analyzeRevengeTrading(trades);
  metrics.push(revengeTrading);

  // 4. Overconfidence Bias
  const overconfidence = analyzeOverconfidence(trades);
  metrics.push(overconfidence);

  // 5. Loss Aversion
  const lossAversion = analyzeLossAversion(trades);
  metrics.push(lossAversion);

  return metrics;
}

function analyzeEmotionalDiscipline(trades: any[]) {
  let score = 80;
  const insights = [];
  const recommendations = [];

  // Check for emotional tags
  const emotionalTrades = trades.filter(t => t.emotional_tag);
  const negativeEmotions = emotionalTrades.filter(t => 
    ['frustrated', 'anxious', 'fearful', 'angry'].includes(t.emotional_tag?.toLowerCase())
  );

  if (negativeEmotions.length > trades.length * 0.3) {
    score -= 20;
    insights.push(`${negativeEmotions.length} trades (${((negativeEmotions.length / trades.length) * 100).toFixed(1)}%) were taken under negative emotional states`);
    recommendations.push("Practice emotional awareness before trading. Take breaks when feeling stressed or frustrated");
  } else {
    insights.push("Good emotional control - most trades executed with a calm mindset");
  }

  // Check trading during loss streaks
  let consecutiveLosses = 0;
  let maxLossStreak = 0;
  let tradesAfterLossStreak = 0;

  for (let i = 0; i < trades.length; i++) {
    if (trades[i].pnl < 0) {
      consecutiveLosses++;
      maxLossStreak = Math.max(maxLossStreak, consecutiveLosses);
    } else {
      if (consecutiveLosses >= 3) {
        tradesAfterLossStreak++;
      }
      consecutiveLosses = 0;
    }
  }

  if (maxLossStreak >= 5) {
    score -= 15;
    insights.push(`Longest losing streak: ${maxLossStreak} trades - indicates potential emotional trading during drawdowns`);
    recommendations.push("Implement a rule to stop trading after 3 consecutive losses and review your strategy");
  }

  const status = score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 50 ? "warning" : "critical";

  return {
    category: "Emotional Discipline",
    score,
    status,
    insights,
    recommendations: recommendations.length > 0 ? recommendations : ["Continue maintaining emotional awareness in your trading"]
  };
}

function analyzeRiskManagement(trades: any[]) {
  let score = 75;
  const insights = [];
  const recommendations = [];

  // Check position sizing consistency
  const avgPnL = trades.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / trades.length;
  const pnlStdDev = Math.sqrt(
    trades.reduce((sum, t) => sum + Math.pow(Math.abs(t.pnl) - avgPnL, 2), 0) / trades.length
  );

  if (pnlStdDev > avgPnL * 1.5) {
    score -= 20;
    insights.push("Inconsistent position sizing detected - high variance in P&L amounts");
    recommendations.push("Use consistent position sizing (1-2% risk per trade) to maintain risk control");
  } else {
    insights.push("Position sizing appears consistent across trades");
  }

  // Check for oversized losses
  const maxLoss = Math.min(...trades.map(t => t.pnl));
  if (Math.abs(maxLoss) > avgPnL * 3) {
    score -= 15;
    insights.push(`Largest loss (${maxLoss.toFixed(2)}) is significantly larger than average - indicates risk management failure`);
    recommendations.push("Set strict stop-losses and never risk more than 2% of capital per trade");
  }

  const status = score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 50 ? "warning" : "critical";

  return {
    category: "Risk Management",
    score,
    status,
    insights,
    recommendations: recommendations.length > 0 ? recommendations : ["Maintain your current risk management discipline"]
  };
}

function analyzeRevengeTrading(trades: any[]) {
  let score = 85;
  const insights = [];
  const recommendations = [];

  let revengeTradeCount = 0;
  
  for (let i = 1; i < trades.length; i++) {
    const prevTrade = trades[i - 1];
    const currTrade = trades[i];
    
    // Check if trades are on same day and increased position after loss
    if (prevTrade.pnl < 0) {
      const prevDate = new Date(prevTrade.trade_date).toDateString();
      const currDate = new Date(currTrade.trade_date).toDateString();
      
      if (prevDate === currDate && Math.abs(currTrade.pnl) > Math.abs(prevTrade.pnl) * 1.3) {
        revengeTradeCount++;
      }
    }
  }

  if (revengeTradeCount > 0) {
    const revengePercent = (revengeTradeCount / trades.length) * 100;
    score -= revengeTradeCount * 5;
    insights.push(`${revengeTradeCount} potential revenge trades detected (${revengePercent.toFixed(1)}% of all trades)`);
    insights.push("Revenge trading after losses increases risk and emotional decision-making");
    recommendations.push("Implement a mandatory 30-minute break after any losing trade");
    recommendations.push("Never increase position size after a loss - stick to your plan");
  } else {
    insights.push("No revenge trading patterns detected - excellent self-control");
    insights.push("You maintain consistent trading behavior after losses");
  }

  const status = score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 50 ? "warning" : "critical";

  return {
    category: "Revenge Trading Control",
    score: Math.max(score, 0),
    status,
    insights,
    recommendations: recommendations.length > 0 ? recommendations : ["Keep maintaining this discipline"]
  };
}

function analyzeOverconfidence(trades: any[]) {
  let score = 75;
  const insights = [];
  const recommendations = [];

  // Check win streak behavior
  let maxWinStreak = 0;
  let currentWinStreak = 0;
  let increasedSizeAfterWins = 0;

  for (let i = 0; i < trades.length; i++) {
    if (trades[i].pnl > 0) {
      currentWinStreak++;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      
      if (i < trades.length - 1 && currentWinStreak >= 3) {
        if (Math.abs(trades[i + 1].pnl) > Math.abs(trades[i].pnl) * 1.5) {
          increasedSizeAfterWins++;
        }
      }
    } else {
      currentWinStreak = 0;
    }
  }

  if (increasedSizeAfterWins > 2) {
    score -= 20;
    insights.push(`Detected ${increasedSizeAfterWins} instances of increased position size after winning streaks`);
    insights.push("Overconfidence after wins can lead to larger losses");
    recommendations.push("Maintain consistent position sizing regardless of recent performance");
  } else {
    insights.push("Position sizing remains disciplined during winning streaks");
  }

  // Check frequency during win streaks
  const avgTradesPerDay = trades.length / 30; // Assuming 30 days of data
  if (avgTradesPerDay > 10) {
    score -= 10;
    insights.push("High trading frequency may indicate overconfidence and overtrading");
    recommendations.push("Quality over quantity - focus on high-probability setups only");
  }

  const status = score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 50 ? "warning" : "critical";

  return {
    category: "Overconfidence Management",
    score,
    status,
    insights,
    recommendations: recommendations.length > 0 ? recommendations : ["Continue your balanced approach"]
  };
}

function analyzeLossAversion(trades: any[]) {
  let score = 80;
  const insights = [];
  const recommendations = [];

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);

  if (winningTrades.length === 0 || losingTrades.length === 0) {
    return {
      category: "Loss Aversion",
      score: 70,
      status: "warning",
      insights: ["Insufficient data to analyze loss aversion patterns"],
      recommendations: ["Continue trading to gather more performance data"]
    };
  }

  const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
  const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length);
  const avgWinLossRatio = avgWin / avgLoss;

  if (avgWinLossRatio < 1) {
    score -= 25;
    insights.push(`Average win (${avgWin.toFixed(2)}) is smaller than average loss (${avgLoss.toFixed(2)})`);
    insights.push("This suggests premature profit-taking and delayed loss-cutting");
    recommendations.push("Let your winners run longer - aim for 2:1 reward-to-risk ratio minimum");
    recommendations.push("Cut losses quickly when trade thesis is invalidated");
  } else if (avgWinLossRatio >= 2) {
    insights.push(`Excellent risk-reward ratio: ${avgWinLossRatio.toFixed(2)}:1`);
    insights.push("You cut losses quickly and let winners run");
  } else {
    insights.push(`Decent risk-reward ratio: ${avgWinLossRatio.toFixed(2)}:1`);
    recommendations.push("Aim to improve your risk-reward ratio above 2:1 for more sustainable profits");
  }

  // Check holding time
  if (trades[0].duration_minutes !== undefined) {
    const avgWinDuration = winningTrades.filter(t => t.duration_minutes).reduce((sum, t) => sum + t.duration_minutes, 0) / winningTrades.length;
    const avgLossDuration = losingTrades.filter(t => t.duration_minutes).reduce((sum, t) => sum + t.duration_minutes, 0) / losingTrades.length;

    if (avgLossDuration > avgWinDuration * 1.5) {
      score -= 10;
      insights.push("Losing trades held significantly longer than winners - classic loss aversion");
      recommendations.push("Set time-based stops: if trade doesn't work in expected timeframe, exit");
    }
  }

  const status = score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 50 ? "warning" : "critical";

  return {
    category: "Loss Aversion",
    score,
    status,
    insights,
    recommendations: recommendations.length > 0 ? recommendations : ["Maintain your current profit-taking and loss-cutting discipline"]
  };
}
