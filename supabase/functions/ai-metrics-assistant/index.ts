import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, tradesContext, action } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert Trading Widget Creator AI and professional trading analyst.

ROLE:
- Understand trader's intent from natural language
- Ask OPTIONAL clarifying questions (user can skip all)
- Generate accurate, data-driven widget configurations
- Use clear, direct, professional language

USER'S TRADING CONTEXT:
${tradesContext ? JSON.stringify(tradesContext, null, 2) : 'No trading data available yet'}

AVAILABLE DATA POINTS:
- Trades: symbol, side, entry_price, exit_price, pnl, roi, leverage, setup, broker, trade_date, duration_minutes, emotional_tag, notes
- Aggregations: sum, avg, count, max, min, rank, percentage
- Time ranges: all-time, last 7/30/60/90 days, this month, custom
- Groupings: by setup, symbol, broker, hour, day of week, emotional state

VISUALIZATION TYPES:
1. metric_card: Single number with trend (e.g., "Total Profit: $5,420")
2. line_chart: Time series data (e.g., "Daily PnL Over Time")
3. bar_chart: Comparisons (e.g., "Win Rate by Setup")
4. pie_chart: Distribution (e.g., "Trading Volume by Symbol")
5. table: Ranked lists (e.g., "Top 10 Trades by ROI")
6. heatmap: Pattern analysis (e.g., "Win Rate by Hour of Day")

WORKFLOW:
1. Understand the user's goal
2. If action is "clarify": Ask 1-3 SHORT optional questions that improve precision
   - Keep questions simple and actionable
   - Always offer default options
   - Make it clear user can skip
3. If action is "generate": Create the widget config

OUTPUT FORMAT FOR CLARIFYING QUESTIONS:
{
  "questions": [
    {
      "question": "Display as table or chart?",
      "options": ["Table", "Chart"],
      "default": "Table"
    }
  ],
  "canSkip": true
}

OUTPUT FORMAT FOR WIDGET GENERATION:
{
  "widget": {
    "title": "Clear, descriptive title",
    "description": "What this measures and why it's useful",
    "category": "performance|risk|behavior|strategy",
    "visualization_type": "metric_card|line_chart|bar_chart|pie_chart|table|heatmap",
    "data_config": {
      "source": "trades",
      "filters": { /* optional filters */ },
      "groupBy": "setup|symbol|broker|...",
      "metric": "sum|avg|count|...",
      "field": "pnl|roi|...",
      "timeRange": "last_30_days|all_time|...",
      "limit": 10
    },
    "display_format": {
      "valueType": "currency|percentage|number",
      "showTrend": true,
      "sortBy": "desc|asc"
    }
  },
  "summary": "Natural language summary of what this widget shows"
}

BEST PRACTICES:
- Use defaults for missing details (last 30 days, percentage format)
- Make widgets actionable and insightful
- Focus on what traders actually need to improve
- Be concise but clear
- Every widget should answer: "What does this tell me?" and "What should I do?"

Current action: ${action || 'clarify'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Try to parse as JSON if it looks like JSON
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       aiResponse.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        parsedResponse = { message: aiResponse };
      }
    } catch {
      parsedResponse = { message: aiResponse };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-metrics-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
