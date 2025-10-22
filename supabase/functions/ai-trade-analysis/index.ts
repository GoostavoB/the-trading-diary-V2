import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkBudget, logCost } from '../_shared/budgetChecker.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    const budget = await checkBudget(supabaseClient, user.id);
    if (budget.blocked) {
      return new Response(
        JSON.stringify({ error: budget.message }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { trade_ids, trade_data, batch } = await req.json();

    // Support batch processing (up to 10 trades)
    const tradeIds = batch ? batch.slice(0, 10) : (trade_ids || [trade_data?.id] || []);
    const cacheKey = `analysis_${user.id}_${tradeIds.join('_')}`;

    // Fetch actual trade data from database
    let tradesData = [];
    if (trade_data) {
      tradesData = [trade_data];
    } else if (tradeIds.length > 0) {
      const { data: fetchedTrades } = await supabaseClient
        .from('trades')
        .select('*')
        .in('id', tradeIds)
        .eq('user_id', user.id);
      tradesData = fetchedTrades || [];
    }

    if (tradesData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No trade data found for the provided IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache
    const { data: cached } = await supabaseClient
      .from('ai_trade_cache')
      .select('parsed_json')
      .eq('cache_key', cacheKey)
      .gt('ttl_expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('✅ Cache hit for trade analysis');
      await logCost(supabaseClient, user.id, 'ai-trade-analysis', 'cached', 'cached', 
        0, 0, 0, Date.now() - startTime, { cacheHit: true });
      
      return new Response(
        JSON.stringify({ analysis: cached.parsed_json, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Always use lite model for trade analysis
    const modelUsed = 'google/gemini-2.5-flash-lite';

    // Calculate key metrics from actual trade data
    const totalPnL = tradesData.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = tradesData.filter(t => (t.pnl || 0) > 0).length;
    const losses = tradesData.filter(t => (t.pnl || 0) < 0).length;
    const winRate = tradesData.length > 0 ? (wins / tradesData.length * 100).toFixed(1) : '0';
    
    const avgWin = wins > 0 ? tradesData.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + t.pnl, 0) / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(tradesData.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + t.pnl, 0) / losses) : 0;

    const systemPrompt = `You are a professional trading coach analyzing real trade data. 
Provide actionable insights based on the metrics and patterns you observe.
Output JSON format: 
{
  "patterns": { 
    "winning_patterns": ["specific patterns from data"], 
    "losing_patterns": ["specific patterns from data"], 
    "time_based_insights": ["time-specific observations"] 
  },
  "insights": { 
    "behavioral": ["behavioral observations"], 
    "emotional": ["emotional patterns detected"], 
    "performance": ["performance metrics analysis"] 
  },
  "risks": { 
    "current_risks": ["identified risks"], 
    "risk_score": 0-100, 
    "recommendations": ["specific risk management advice"] 
  },
  "suggestions": { 
    "immediate": ["actionable steps for next trade"], 
    "long_term": ["strategic improvements"], 
    "optimization": ["efficiency improvements"] 
  },
  "encouragement": "personalized motivational message"
}
Be specific and data-driven. Keep concise but insightful. Max 400 tokens.`;

    // Format trade data for analysis with key metrics
    const tradesSummary = tradesData.map(t => ({
      symbol: t.symbol,
      direction: t.direction,
      pnl: t.pnl,
      roi: t.roi,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      quantity: t.quantity,
      trade_date: t.trade_date,
      entry_time: t.entry_time,
      exit_time: t.exit_time,
      setup: t.setup,
      notes: t.notes,
      fees: t.fees
    }));

    const userPrompt = `Analyze these ${tradesData.length} trades:

PERFORMANCE METRICS:
- Total P&L: $${totalPnL.toFixed(2)}
- Win Rate: ${winRate}% (${wins} wins, ${losses} losses)
- Avg Win: $${avgWin.toFixed(2)}
- Avg Loss: $${Math.abs(avgLoss).toFixed(2)}
- Risk/Reward Ratio: ${avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A'}

TRADE DATA:
${JSON.stringify(tradesSummary, null, 2)}

Provide specific, actionable insights based on this actual data.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelUsed,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500,
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
      const errorText = await response.text();
      console.error('Analysis failed:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content || '{}';
    const analysis = JSON.parse(analysisText);
    const tokensIn = result.usage?.prompt_tokens || 0;
    const tokensOut = result.usage?.completion_tokens || 0;

    // Cache for 7 days
    await supabaseClient.from('ai_trade_cache').insert({
      user_id: user.id,
      cache_key: cacheKey,
      model_id: modelUsed,
      prompt_version: 'v1',
      analysis_type: 'trade_analysis',
      parsed_json: analysis,
      ttl_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Log cost (1 cent for lite)
    const costCents = 1;
    const latency = Date.now() - startTime;
    await logCost(supabaseClient, user.id, 'ai-trade-analysis', 'lite', modelUsed, 
      tokensIn, tokensOut, costCents, latency, { complexity: 'simple' });

    console.log(`✅ Trade analysis completed in ${latency}ms`);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error in ai-trade-analysis:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
