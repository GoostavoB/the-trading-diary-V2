import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { trade_ids, period, report_type } = await req.json();

    // Fetch actual trade data
    const { data: trades, error: tradesError } = await supabaseClient
      .from('trades')
      .select('*')
      .in('id', trade_ids || [])
      .eq('user_id', user.id);

    if (tradesError || !trades || trades.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No trade data found",
          details: "Please ensure trades exist for the selected period and try again"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate comprehensive metrics
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = trades.filter(t => (t.pnl || 0) > 0);
    const losses = trades.filter(t => (t.pnl || 0) < 0);
    const winRate = (wins.length / trades.length * 100).toFixed(1);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const totalFees = trades.reduce((sum, t) => sum + (t.fees || 0), 0);
    const bestTrade = Math.max(...trades.map(t => t.pnl || 0));
    const worstTrade = Math.min(...trades.map(t => t.pnl || 0));

    // Analyze by asset
    const assetPerformance = trades.reduce((acc: any, t) => {
      const symbol = t.symbol || 'Unknown';
      if (!acc[symbol]) {
        acc[symbol] = { trades: 0, pnl: 0, wins: 0 };
      }
      acc[symbol].trades++;
      acc[symbol].pnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) acc[symbol].wins++;
      return acc;
    }, {});

    // Analyze by setup
    const setupPerformance = trades.reduce((acc: any, t) => {
      const setup = t.setup || 'No Setup';
      if (!acc[setup]) {
        acc[setup] = { trades: 0, pnl: 0, wins: 0 };
      }
      acc[setup].trades++;
      acc[setup].pnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) acc[setup].wins++;
      return acc;
    }, {});

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    
    if (report_type === "performance") {
      systemPrompt = `You are an expert trading performance analyst reviewing real trading data.
Generate a comprehensive performance report in JSON format:
{
  "summary": "2-3 sentence executive summary highlighting key performance metrics",
  "findings": ["specific data-driven finding 1", "specific data-driven finding 2", "specific data-driven finding 3"],
  "recommendations": ["actionable recommendation based on data", "specific improvement strategy"],
  "detailed_analysis": "Detailed paragraph analysis referencing actual metrics, trends, and patterns from the data"
}`;
      
      userPrompt = `Analyze this ${period} trading performance:

OVERALL METRICS:
- Total Trades: ${trades.length}
- Total P&L: $${totalPnL.toFixed(2)}
- Win Rate: ${winRate}% (${wins.length} wins, ${losses.length} losses)
- Average Win: $${avgWin.toFixed(2)}
- Average Loss: $${Math.abs(avgLoss).toFixed(2)}
- Profit Factor: ${profitFactor.toFixed(2)}
- Total Fees: $${totalFees.toFixed(2)}
- Best Trade: $${bestTrade.toFixed(2)}
- Worst Trade: $${worstTrade.toFixed(2)}

TOP PERFORMING ASSETS:
${Object.entries(assetPerformance)
  .sort((a: any, b: any) => b[1].pnl - a[1].pnl)
  .slice(0, 5)
  .map(([symbol, data]: [string, any]) => 
    `- ${symbol}: $${data.pnl.toFixed(2)} (${data.wins}/${data.trades} wins, ${(data.wins/data.trades*100).toFixed(1)}% WR)`
  ).join('\n')}

SETUP PERFORMANCE:
${Object.entries(setupPerformance)
  .sort((a: any, b: any) => b[1].pnl - a[1].pnl)
  .map(([setup, data]: [string, any]) => 
    `- ${setup}: $${data.pnl.toFixed(2)} (${data.wins}/${data.trades} wins)`
  ).join('\n')}

Generate a performance report with specific insights from this data.`;

    } else if (report_type === "analysis") {
      systemPrompt = `You are an expert trading analyst conducting deep-dive analysis of real trading data.
Generate a detailed analysis report in JSON format:
{
  "summary": "Executive summary highlighting key patterns and insights",
  "findings": ["specific pattern observed in data", "behavioral insight from trades", "statistical observation"],
  "recommendations": ["optimization strategy with specific steps", "risk management adjustment"],
  "detailed_analysis": "Comprehensive analysis with statistical insights, pattern recognition, and strategic guidance"
}`;
      
      userPrompt = `Deep analysis for ${period} period with ${trades.length} trades:

PERFORMANCE DATA:
- P&L: $${totalPnL.toFixed(2)}
- Win Rate: ${winRate}%
- Avg Win/Loss: $${avgWin.toFixed(2)} / $${Math.abs(avgLoss).toFixed(2)}
- Risk/Reward: ${avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A'}:1
- Profit Factor: ${profitFactor.toFixed(2)}

TRADE DETAILS (Sample):
${trades.slice(0, 10).map(t => 
  `${t.symbol} ${t.direction}: $${(t.pnl || 0).toFixed(2)} (${t.setup || 'No setup'})`
).join('\n')}

Analyze patterns, behavioral insights, and provide strategic recommendations.`;

    } else {
      systemPrompt = `You are an expert trading coach providing personalized guidance based on real performance data.
Generate a coaching report in JSON format:
{
  "summary": "Encouraging summary acknowledging strengths and growth areas",
  "findings": ["specific strength demonstrated", "specific strength demonstrated", "specific area for improvement with context"],
  "recommendations": ["actionable coaching advice", "specific practice drill or focus area"],
  "detailed_analysis": "Personalized coaching guidance with encouragement, acknowledging progress and outlining clear next steps"
}`;
      
      userPrompt = `Coaching analysis for ${period} with ${trades.length} trades:

RESULTS:
- P&L: $${totalPnL.toFixed(2)}
- Win Rate: ${winRate}%
- Profit Factor: ${profitFactor.toFixed(2)}

STRENGTHS & CHALLENGES:
${totalPnL > 0 ? '✓ Profitable period' : '✗ Loss period - growth opportunity'}
${parseFloat(winRate) > 50 ? '✓ Above 50% win rate' : '✗ Win rate needs improvement'}
${profitFactor > 1.5 ? '✓ Strong profit factor' : '✗ Profit factor needs work'}

TOP SETUPS:
${Object.entries(setupPerformance).slice(0, 3).map(([setup, data]: [string, any]) => 
  `- ${setup}: ${(data.wins/data.trades*100).toFixed(1)}% WR`
).join('\n')}

Provide encouraging, personalized coaching with specific action steps.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const reportText = result.choices?.[0]?.message?.content;
    const report = JSON.parse(reportText);

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-generate-report function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Report generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
