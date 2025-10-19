import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, tradesSummary } = await req.json();
    console.log("Generating widget with prompt:", prompt);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a trading analytics expert and dashboard designer. Your job is to interpret user requests for custom trading metrics and generate widget configurations.

Available widget types:
- "metric": Single number display (KPI card)
- "chart": Bar, line, or pie chart
- "table": Data table with sortable columns
- "heatmap": Time-based heatmap visualization

Available data points from trades:
- symbol, side (long/short), entry_price, exit_price, pnl, roi, leverage, setup, broker
- trade_date, opened_at, closed_at, duration_minutes, period_of_day
- emotional_tag, funding_fee, trading_fee, margin

User has trades with this summary: ${JSON.stringify(tradesSummary)}

When the user asks for a metric, you MUST respond with a JSON object following this exact structure:
{
  "title": "Widget Title",
  "description": "Brief explanation of what this shows",
  "widget_type": "metric|chart|table|heatmap",
  "query_config": {
    "metric": "roi|pnl|win_rate|avg_duration|setup_performance|etc",
    "filters": { "setup": "...", "side": "...", "date_range": "..." },
    "aggregation": "sum|avg|count|max|min",
    "group_by": "setup|symbol|broker|period_of_day|hour"
  },
  "display_config": {
    "format": "currency|percent|number",
    "color": "green|red|blue|purple|gradient",
    "chart_type": "bar|line|pie|area",
    "show_comparison": true|false
  }
}

Examples:
- "Show setup rank by ROI" → group_by setup, metric roi, widget_type table
- "Compare profit by broker" → group_by broker, metric pnl, widget_type chart
- "Win rate heatmap by hour" → widget_type heatmap, metric win_rate, group_by hour

Respond ONLY with valid JSON, no markdown, no explanations.`;

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
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const widgetConfig = data.choices[0].message.content;
    
    console.log("Generated widget config:", widgetConfig);

    // Parse and validate JSON
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(widgetConfig);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", widgetConfig);
      throw new Error("AI generated invalid configuration");
    }

    return new Response(JSON.stringify(parsedConfig), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-generate-widget:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate widget";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});