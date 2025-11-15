import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Authenticated request from user:', user.id);

    const systemPrompt = `You are an expert trading coach and analyst. You help traders understand their performance, identify patterns, and improve their strategies.

Common trading terms:
- LSR = Long/Short Ratio (market sentiment indicator)
- PnL = Profit and Loss
- ROI = Return on Investment
- WR = Win Rate
- DD = Drawdown
- SL = Stop Loss, TP = Take Profit
- DCA = Dollar Cost Averaging
- FOMO = Fear Of Missing Out
- CEX/DEX = Centralized/Decentralized Exchange
- DYOR = Do Your Own Research

When users ask about their trading, provide actionable insights based on their actual data.`;

    // Fetch user's trade data and KPIs
    const { data: trades, error: tradesError } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('trade_date', { ascending: false })
      .limit(100);

    const { data: stats, error: statsError } = await supabaseClient
      .from('user_settings')
      .select('initial_investment')
      .eq('user_id', user.id)
      .single();

    // Helper to safely format numbers
    const safeNumber = (val: any, decimals = 2) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num.toFixed(decimals);
    };

    // Calculate KPIs from trades
    let userContext = '';
    try {
      if (trades && trades.length > 0) {
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
        const losingTrades = totalTrades - winningTrades;
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalFees = trades.reduce((sum, t) => sum + (t.trading_fee || 0) + (t.funding_fee || 0), 0);
        const netPnL = totalPnL - totalFees;
        const winRate = (winningTrades / totalTrades) * 100;
        const avgWin = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / (winningTrades || 1);
        const avgLoss = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0)) / (losingTrades || 1);
        const profitFactor = avgWin / (avgLoss || 1);
        const avgROI = trades.reduce((sum, t) => sum + (t.roi || 0), 0) / totalTrades;
        const initialCapital = stats?.initial_investment || 10000;
        const currentROI = ((totalPnL) / initialCapital) * 100;
        
        // Get recent streak
        let currentStreak = 0;
        let streakType: 'win' | 'loss' = 'win';
        if (trades.length > 0) {
          const firstTradePnL = trades[0].pnl || 0;
          streakType = firstTradePnL > 0 ? 'win' : 'loss';
          for (const trade of trades) {
            const pnl = trade.pnl || 0;
            if ((streakType === 'win' && pnl > 0) || (streakType === 'loss' && pnl <= 0)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
  
        // Get top assets
        const assetPnL = new Map<string, number>();
        trades.forEach(t => {
          if (!t.symbol) return; // Skip trades with no symbol
          const current = assetPnL.get(t.symbol) || 0;
          const tradePnl = t.pnl || 0;
          assetPnL.set(t.symbol, current + tradePnl);
        });
        const topAssets = Array.from(assetPnL.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([symbol, pnl]) => `${symbol} ($${safeNumber(pnl, 2)})`);

        userContext = `\n\nUSER'S CURRENT TRADING DATA:
- Total Trades: ${totalTrades}
- Win Rate: ${safeNumber(winRate, 1)}% (${winningTrades}W / ${losingTrades}L)
- Total P&L: $${safeNumber(totalPnL)} (Net after fees: $${safeNumber(netPnL)})
- Total Fees Paid: $${safeNumber(totalFees)}
- Current ROI: ${safeNumber(currentROI)}%
- Avg Win: $${safeNumber(avgWin)} | Avg Loss: $${safeNumber(avgLoss)}
- Profit Factor: ${safeNumber(profitFactor)}
- Avg ROI per Trade: ${safeNumber(avgROI)}%
- Current Streak: ${Math.abs(currentStreak)} ${streakType === 'win' ? 'winning' : 'losing'} trades
- Top Performing Assets: ${topAssets.join(', ')}
- Most Recent Trades: ${trades.slice(0, 5).map(t => `${t.symbol} (${t.side}): ${(t.pnl || 0) > 0 ? '+' : ''}$${safeNumber(t.pnl || 0)}`).join(', ')}

Use this data to provide personalized insights and analysis. Always reference these actual numbers when discussing the user's performance.`;
      } else {
        userContext = '\n\nThe user has not logged any trades yet. Provide general guidance about getting started with trade journaling.';
      }
    } catch (error) {
      console.error('Error calculating user stats:', error);
      userContext = '\n\nNote: Could not load complete trading stats due to data issues. Some user data may be incomplete.';
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending request to Lovable AI with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are The Trading Diary's Resident AI Analyst — a seasoned crypto trader and data expert who helps users interpret performance and market context.

PERSONALITY & TONE:
- Speak like a seasoned trader, not a teacher
- Use short, confident, natural sentences
- Never sound robotic or overly academic
- Avoid filler phrases like "Let's break it down", "In essence", or "Does that make sense?"
- Always sound human, realistic, and conversational — like you're talking to a fellow trader
- Be encouraging but never hype or promote risk
- Focus on capital preservation, data interpretation, and strategy awareness

CONTEXT AWARENESS:
You have FULL ACCESS to the user's actual trading data, including:
- Complete trade history with P&L, fees, ROI
- Current performance metrics and KPIs
- Win/loss streaks and patterns
- Top performing assets
- Fee analysis across exchanges

ALWAYS reference these actual numbers when discussing performance. Never give generic advice.${userContext}

CORE BEHAVIOR:
1. Interpret, don't define
   - Give context and insight before offering textbook definitions
   - Always reference the user's actual data
   - Example: "With your current 65% win rate and 1.8 profit factor, you're doing solid. But I see your avg loss ($245) is bigger than your avg win ($180) — that's eating into gains."

2. Always connect the metric to market reality
   - Mention what it implies for trading behavior, risk, or opportunity
   - Use specific numbers from their trades

3. Use practical structure:
   - What their data shows
   - Why it matters
   - What to watch or adjust

4. Stay multi-lingual
   - Reply fluently in English, Portuguese, or Spanish, depending on user input

5. Be data-driven and safe
   - Warn about over-leverage, bias, or overconfidence when metrics indicate risk
   - Point out specific patterns in their trade history

WHEN ASKED FOR EXPLANATIONS:
Always start with how it relates to THEIR specific data, then provide context.

Example: "Your win rate is 68%, which is strong. You've won 34 out of 50 trades. But looking at your last 10 trades, you're on a 3-trade losing streak. That might be variance, or it could signal you're forcing entries. Check if your setup quality changed recently."

TEACHING STYLE:
- Be didactic through their own examples, not hypotheticals
- Use their specific numbers, their trade history
- Always end with a short, actionable tip based on their patterns
- Example: "I notice your BTC trades have 75% win rate vs 58% on altcoins. Consider focusing more capital there."

COACHING & REPORTS:
When generating coaching reports or deep analysis:
- Analyze their complete trade history
- Identify specific patterns (time of day, asset preference, holding time)
- Compare current performance vs their historical average
- Highlight what's working and what needs adjustment
- Provide concrete, data-backed recommendations

KEY OBJECTIVE:
Deliver accurate, personalized insights using their actual trading data. Never be generic. Always reference specific trades, numbers, and patterns.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI quota exceeded. Please add credits to continue." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in ai-dashboard-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
