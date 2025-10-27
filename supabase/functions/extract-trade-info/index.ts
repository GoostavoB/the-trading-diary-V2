import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkBudget, logCost, checkRateLimit } from '../_shared/budgetChecker.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRADE_SCHEMA = {
  type: "object",
  properties: {
    symbol: { type: "string" },
    side: { type: "string", enum: ["long", "short"] },
    entry_price: { type: "number" },
    exit_price: { type: "number" },
    position_size: { type: "number" },
    leverage: { type: "number" },
    profit_loss: { type: "number" },
    funding_fee: { type: "number" },
    trading_fee: { type: "number" },
    roi: { type: "number" },
    margin: { type: "number" },
    opened_at: { type: "string" },
    closed_at: { type: "string" },
    period_of_day: { type: "string" },
    duration_days: { type: "number" },
    duration_hours: { type: "number" },
    duration_minutes: { type: "number" },
    broker: { type: "string" },
    setup: { type: "string" },
    emotional_tag: { type: "string" },
    notes: { type: "string" }
  },
  required: ["symbol", "side", "entry_price", "opened_at"]
};

function extractJSON(text: string): any {
  let cleaned = text.trim();
  
  // Remove markdown code blocks (both start and end markers)
  cleaned = cleaned.replace(/^```(?:json)?\s*/gim, '');
  cleaned = cleaned.replace(/\s*```\s*$/gim, '');
  cleaned = cleaned.trim();
  
  // Find the JSON array/object boundaries
  const startIdx = cleaned.search(/[\[{]/);
  if (startIdx === -1) {
    throw new Error('No JSON found in response');
  }
  
  // Find the last closing bracket/brace
  let endIdx = cleaned.length - 1;
  while (endIdx >= startIdx) {
    const char = cleaned[endIdx];
    if (char === ']' || char === '}') {
      break;
    }
    endIdx--;
  }
  
  if (endIdx < startIdx) {
    throw new Error('Invalid JSON structure in response');
  }
  
  const jsonStr = cleaned.substring(startIdx, endIdx + 1);
  return JSON.parse(jsonStr);
}

function estimateTradeCount(ocrText: string): number {
  if (!ocrText) return 10; // Default to expecting 10 trades when no OCR
  
  // Enhanced symbol detection: BTCUSDT, BTCUSD, BTC-PERP, XAUUSD, EURUSD, etc.
  const symbolMatches = ocrText.match(/\b[A-Z]{2,6}(?:USDT|USD|USDC|EUR|GBP|JPY|PERP)?\b/gi) || [];
  const uniqueSymbols = new Set(symbolMatches.map(s => s.toUpperCase()));
  
  // Count Long/Short AND BUY/SELL mentions
  const sideMatches = ocrText.match(/\b(long|short|buy|sell)\b/gi) || [];
  
  // Count timestamp patterns: YYYY/MM/DD, DD/MM/YYYY, MM/DD/YYYY
  const dateMatches = ocrText.match(/\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4}/g) || [];
  
  // Enhanced PnL detection: currency symbols, +/-, percentages
  const pnlMatches = ocrText.match(/[$€£¥]\s*-?\d+(\.\d+)?|-?\d+(\.\d+)?%|\b(pnl|profit|loss|p&l|roe|roi)\b/gi) || [];
  
  // Use the maximum of these indicators
  const estimate = Math.max(
    uniqueSymbols.size,
    Math.floor(sideMatches.length / 2), // Entry + Exit = 2 mentions per trade
    Math.floor(dateMatches.length / 2), // Opened + Closed = 2 dates per trade
    pnlMatches.length
  );
  
  return Math.max(1, Math.min(estimate, 10)); // Cap at 10 trades
}

function calculateMaxTokens(estimatedTrades: number, route: 'lite' | 'deep'): number {
  const baseTokens = route === 'lite' ? 500 : 800;
  const tokensPerTrade = route === 'lite' ? 250 : 350;
  
  if (estimatedTrades <= 1) return baseTokens;
  return Math.min(baseTokens + (tokensPerTrade * (estimatedTrades - 1)), 4000);
}

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

    // Check rate limit first
    const rateLimit = await checkRateLimit(supabaseClient, user.id, 'extract-trade-info');
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimit.message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check budget but do not hard-block this endpoint; enforce lite when needed
    const budget = await checkBudget(supabaseClient, user.id);
    const ADMIN_ID = 'e019b392-2eb3-4b82-8e92-bbb8f502560b';
    const isAdminUser = user.id === ADMIN_ID;
    const forceLite = (budget.forceLite || budget.blocked) && !isAdminUser; // if blocked, we still proceed but force lite (except admin)
    if (budget.blocked && !isAdminUser) {
      console.warn(`⚠️ User ${user.id} over monthly AI budget. Proceeding with forced lite route.`);
    }

    // Deduct 1 upload credit before processing
    const { data: creditDeducted, error: creditError } = await supabaseClient.rpc('deduct_upload_credit', {
      p_user_id: user.id,
    });

    if (creditError || !creditDeducted) {
      console.error(`❌ Credit deduction failed for user ${user.id}:`, creditError);
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient upload credits',
          details: 'You need 1 credit to analyze this image. Purchase additional credits to continue.'
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Deducted 1 upload credit for user: ${user.id}`);

    const { 
      imageBase64, 
      ocrText, 
      ocrConfidence, 
      imageHash, 
      perceptualHash,
      broker, 
      annotations,
      bypassCache 
    } = await req.json();

    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    // Validate image size (max 10MB base64)
    const base64Size = imageBase64.length * 0.75;
    const maxSize = 10 * 1024 * 1024;
    if (base64Size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Image size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-estimate trade count from OCR for cache validation
    const estimatedTradeCount = estimateTradeCount(ocrText || '');

    // Check cache first using image hash (unless manual bypass requested)
    if (imageHash && !bypassCache) {
      const { data: cached } = await supabaseClient
        .from('ai_image_cache')
        .select('parsed_json, route_used')
        .eq('image_hash', imageHash)
        .single();

      if (cached) {
        const cachedCount = Array.isArray(cached.parsed_json) ? cached.parsed_json.length : 0;
        
        // Improved bypass logic: bypass if cached 0 trades, or cached < max(estimate, 2)
        const shouldBypassCache = cachedCount === 0 || cachedCount < Math.max(estimatedTradeCount, 2);

        if (!shouldBypassCache) {
          console.log('✅ Cache hit for image:', imageHash, `(trades: ${cachedCount})`);
          const latency = Date.now() - startTime;
          await logCost(supabaseClient, user.id, 'extract-trade-info', 'cached', 
            'cached', 0, 0, 0, latency, { cacheHit: true });
          return new Response(
            JSON.stringify({ trades: cached.parsed_json, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.log(`♻️ Bypassing cache: estimated ${estimatedTradeCount} trades, cached had ${cachedCount}`);
        }
      }
    } else if (bypassCache) {
      console.log('🔄 Manual cache bypass requested');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error(`❌ LOVABLE_API_KEY not configured`);
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          details: 'AI service is not properly configured. Please contact support.'
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let trades: any[];
    let route: 'lite' | 'deep';
    let modelUsed: string;
    let tokensIn = 0;
    let tokensOut = 0;

    // Calculate OCR quality score
    const ocrQualityScore = ocrText && ocrConfidence ? ocrConfidence : 0;

    // Log estimate from OCR analysis
    console.log(`📊 Estimated ${estimatedTradeCount} trade(s) from OCR analysis`);

    // Build context
    let annotationContext = '';
    if (annotations && annotations.length > 0) {
      annotationContext = '\n\nUser marked areas: ' + 
        annotations.map((a: any) => `${a.label} at (${a.x}, ${a.y})`).join(', ');
    }

    let brokerContext = '';
    if (broker && broker !== 'No Broker' && broker !== 'Other') {
      brokerContext = `\n\nBroker: ${broker}. Use "${broker}" for all trades.`;
    }

    // Route decision: OCR-first if quality >= 0.80 and not forced to lite
    if (ocrText && ocrQualityScore >= 0.80 && !forceLite) {
      console.log('🔤 Using OCR + lite route (quality:', ocrQualityScore.toFixed(2), ')');
      route = 'lite';
      modelUsed = 'google/gemini-2.5-flash-lite';

      // Dynamic token allocation
      const maxTokens = calculateMaxTokens(estimatedTradeCount, 'lite');
      console.log(`🎯 Allocating ${maxTokens} tokens for ${estimatedTradeCount} estimated trade(s)`);

      // Call lite model with OCR text
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            {
              role: "system",
              content: `Extract ALL trades from OCR text. Treat this like a table: one trade per row. BUY => long, SELL => short. Output ONLY valid JSON array. Each trade must match schema: ${JSON.stringify(TRADE_SCHEMA)}. Calculate position_type: if entry > exit AND profit > 0 = SHORT, if entry < exit AND profit > 0 = LONG. Extract leverage (e.g., "10x" = 10) and position_size. Calculate duration and period_of_day. CRITICAL: Never return an empty array. If uncertain, return best-effort trade rows. Return up to 10 trades max per image, but include ALL rows present in the screenshot. Expected approximately ${estimatedTradeCount} trade(s). End with "\\n\\nEND".`
            },
            {
              role: "user",
              content: `OCR Text:\n${ocrText}${brokerContext}${annotationContext}\n\nExtract ALL trades as JSON array.`
            }
          ],
          max_tokens: maxTokens,
          stop: ["\\n\\nEND"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lite model failed:', response.status, errorText);
        throw new Error(`Lite model failed: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || '';
      tokensIn = result.usage?.prompt_tokens || 0;
      tokensOut = result.usage?.completion_tokens || 0;

      // Parse JSON with robust extraction
      try {
        trades = extractJSON(aiResponse);
        
        // Check if we got fewer trades than expected - retry with deep model
        if (Array.isArray(trades) && trades.length < estimatedTradeCount && estimatedTradeCount > 1) {
          console.log(`⚠️ Expected ${estimatedTradeCount} trades but got ${trades.length}, retrying with vision model`);
          // Fall through to deep route by not returning here
        } else {
          // Success - skip deep route
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw response:', aiResponse);
        // Do not fail here; fallback to deep vision model for full extraction
        trades = [] as any[];
      }

      // If lite extraction was incomplete or parsing failed, fall through to deep route
      if (!Array.isArray(trades) || trades.length < estimatedTradeCount) {
        console.log('🔄 Falling back to deep vision model for complete extraction');
        route = 'deep';
        modelUsed = 'google/gemini-2.5-flash';
        
        const maxTokens = calculateMaxTokens(estimatedTradeCount, 'deep');
        console.log(`🎯 Allocating ${maxTokens} tokens for ${estimatedTradeCount} estimated trade(s)`);

        const deepResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelUsed,
            messages: [
              {
                role: "system",
                content: `Extract ALL trades from trading screenshot. Treat this like a table: one trade per row. BUY => long, SELL => short. Return ONLY valid JSON array. Schema: ${JSON.stringify(TRADE_SCHEMA)}. For position_type: if entry > exit AND profit > 0 = SHORT, if entry < exit AND profit > 0 = LONG. Extract leverage and position_size. Calculate duration and period_of_day. CRITICAL: Never return an empty array. If uncertain, return best-effort trade rows. Return up to 10 trades max per image, but include ALL rows present in the screenshot. Expected approximately ${estimatedTradeCount} trade(s). End with "\\n\\nEND".${brokerContext}${annotationContext}`
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Extract ALL trades from this screenshot." },
                  { type: "image_url", image_url: { url: imageBase64 } }
                ]
              }
            ],
            max_tokens: maxTokens,
            stop: ["\\n\\nEND"]
          }),
        });

        if (!deepResponse.ok) {
          if (deepResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (deepResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const errorText = await deepResponse.text();
          console.error('Deep model failed:', deepResponse.status, errorText);
          throw new Error(`Vision model failed: ${deepResponse.status}`);
        }

        const deepResult = await deepResponse.json();
        const deepAiResponse = deepResult.choices?.[0]?.message?.content || '';
        tokensIn = deepResult.usage?.prompt_tokens || 0;
        tokensOut = deepResult.usage?.completion_tokens || 0;

        try {
          trades = extractJSON(deepAiResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Raw response:', deepAiResponse);
          throw new Error('Failed to parse AI response. The model returned invalid JSON.');
        }
      }

    } else {
      // Direct to deep vision model
      console.log('👁️ Using vision + deep route', ocrText ? `(OCR quality too low: ${ocrQualityScore.toFixed(2)})` : '(no OCR data)');
      route = 'deep';
      modelUsed = 'google/gemini-2.5-flash';

      const maxTokens = calculateMaxTokens(estimatedTradeCount, 'deep');
      console.log(`🎯 Allocating ${maxTokens} tokens for ${estimatedTradeCount} estimated trade(s)`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            {
              role: "system",
              content: `Extract ALL trades from trading screenshot. Treat this like a table: one trade per row. BUY => long, SELL => short. Return ONLY valid JSON array. Schema: ${JSON.stringify(TRADE_SCHEMA)}. For position_type: if entry > exit AND profit > 0 = SHORT, if entry < exit AND profit > 0 = LONG. Extract leverage and position_size. Calculate duration and period_of_day. CRITICAL: Never return an empty array. If uncertain, return best-effort trade rows. Return up to 10 trades max per image, but include ALL rows present in the screenshot. Expected approximately ${estimatedTradeCount} trade(s). End with "\\n\\nEND".${brokerContext}${annotationContext}`
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract ALL trades from this screenshot." },
                { type: "image_url", image_url: { url: imageBase64 } }
              ]
            }
          ],
          max_tokens: maxTokens,
          stop: ["\\n\\nEND"]
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
        console.error('Deep model failed:', response.status, errorText);
        throw new Error(`Vision model failed: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || '';
      tokensIn = result.usage?.prompt_tokens || 0;
      tokensOut = result.usage?.completion_tokens || 0;

      // Parse JSON with robust extraction
      try {
        trades = extractJSON(aiResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw response:', aiResponse);
        throw new Error('Failed to parse AI response. The model returned invalid JSON.');
      }
    }

    // Ensure trades is an array
    if (!Array.isArray(trades)) {
      trades = [trades];
    }

    // If no trades extracted, return specific error
    if (trades.length === 0) {
      console.error('❌ No trades extracted after all processing routes');
      return new Response(
        JSON.stringify({ 
          error: 'No trades detected',
          details: 'Could not extract any trade data from this image. Please ensure the screenshot is clear and contains visible trade information, or try re-analyzing without cache.',
          routeUsed: route,
          cacheStatus: bypassCache ? 'bypassed' : 'not-bypassed'
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize trades to match database schema
    const normalizedTrades = trades.map((t: any) => ({
      symbol: t.symbol ?? t.asset ?? '',
      side: (t.side ?? t.position_type ?? 'long').toLowerCase(),
      broker: broker || t.broker || '',
      setup: t.setup ?? '',
      emotional_tag: t.emotional_tag ?? '',
      entry_price: Number(t.entry_price) || 0,
      exit_price: Number(t.exit_price) || 0,
      position_size: Number(t.position_size) || 0,
      leverage: Number(t.leverage) || 1,
      profit_loss: Number(t.profit_loss) || 0,
      funding_fee: Number(t.funding_fee) || 0,
      trading_fee: Number(t.trading_fee) || 0,
      roi: Number(t.roi) || 0,
      margin: t.margin ? Number(t.margin) : null,
      opened_at: t.opened_at ?? '',
      closed_at: t.closed_at ?? '',
      period_of_day: t.period_of_day ?? 'morning',
      duration_days: Number(t.duration_days) || 0,
      duration_hours: Number(t.duration_hours) || 0,
      duration_minutes: Number(t.duration_minutes) || 0,
      notes: t.notes ?? ''
    }));

    // Enforce max 10 trades per image
    if (normalizedTrades.length > 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many trades detected in one image',
          details: `Found ${normalizedTrades.length} trades. Maximum allowed is 10.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user trade patterns for AI learning
    if (normalizedTrades.length > 0) {
      try {
        const closeTimes = normalizedTrades
          .filter(t => t.closed_at)
          .map(t => new Date(t.closed_at).getHours());
        
        const leverages = normalizedTrades
          .filter(t => t.leverage)
          .map(t => t.leverage);
        
        const longTrades = normalizedTrades.filter(t => t.side === 'long').length;
        const totalTrades = normalizedTrades.length;
        
        const symbols = normalizedTrades
          .filter(t => t.symbol)
          .map(t => t.symbol);

        const patternData = {
          close_times: closeTimes,
          leverages: leverages,
          long_ratio: longTrades / totalTrades,
          favorite_symbols: symbols,
          last_updated: new Date().toISOString()
        };

        await supabaseClient
          .from('user_trade_patterns')
          .upsert({
            user_id: user.id,
            pattern_type: 'trading_preferences',
            pattern_data: patternData,
            confidence_score: Math.min(0.9, 0.5 + (normalizedTrades.length * 0.05)),
            last_updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,pattern_type' });
        
        console.log('✅ Updated user trade patterns');
      } catch (patternError) {
        console.error('Failed to update patterns:', patternError);
        // Don't fail the request if pattern update fails
      }
    }

    // Cache result
    if (imageHash) {
      await supabaseClient.from('ai_image_cache').insert({
        image_hash: imageHash,
        perceptual_hash: perceptualHash,
        model_id: modelUsed,
        model_version: 'v1',
        preprocessing_version: 'v1',
        prompt_version: 'v1',
        ocr_text: ocrText,
        ocr_confidence: ocrConfidence,
        ocr_quality_score: ocrQualityScore,
        parsed_json: normalizedTrades,
        route_used: route === 'lite' ? 'ocr_lite' : 'vision_deep',
        tokens_saved: route === 'lite' ? 200 : 0
      });
    }

    // Log cost (estimate: lite = 1 cent, deep = 8 cents)
    const costCents = route === 'lite' ? 1 : 8;
    const latency = Date.now() - startTime;
    await logCost(supabaseClient, user.id, 'extract-trade-info', route, modelUsed, 
      tokensIn, tokensOut, costCents, latency, { 
        ocrQualityScore, 
        complexity: 'complex' 
      });

    console.log(`✅ Extracted ${normalizedTrades.length} trades via ${route} route in ${latency}ms`);

    return new Response(
      JSON.stringify({ trades: normalizedTrades }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error in extract-trade-info:", error);
    const latency = Date.now() - startTime;
    
    // Determine error type and provide specific message
    let errorMessage = "Trade extraction failed";
    let errorDetails = "Please try again or enter trades manually";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('parse')) {
        errorMessage = "AI response parsing failed";
        errorDetails = "The AI returned invalid data. Please try again with a clearer screenshot.";
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = "Authentication failed";
        errorDetails = "Please sign in again.";
        statusCode = 401;
      } else if (error.message.includes('model failed')) {
        errorMessage = "AI service temporarily unavailable";
        errorDetails = "Please try again in a moment.";
      } else if (error.message.includes('LOVABLE_API_KEY')) {
        errorMessage = "Service configuration error";
        errorDetails = "AI service is not properly configured. Please contact support.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
