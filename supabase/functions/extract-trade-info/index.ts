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
  
  // Find the JSON array start
  const startIdx = cleaned.search(/\[/);
  if (startIdx === -1) {
    throw new Error('No JSON array found in response');
  }
  
  // Find matching closing bracket by counting brackets
  let bracketCount = 0;
  let endIdx = -1;
  
  for (let i = startIdx; i < cleaned.length; i++) {
    if (cleaned[i] === '[') bracketCount++;
    if (cleaned[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx === -1) {
    // JSON is truncated - try to recover what we can
    console.warn('⚠️ JSON appears truncated, attempting partial extraction');
    
    // Find the last complete trade object
    const lastCompleteObject = cleaned.lastIndexOf('},');
    if (lastCompleteObject > startIdx) {
      const partial = cleaned.substring(startIdx, lastCompleteObject + 1) + ']';
      try {
        const trades = JSON.parse(partial);
        console.log(`✅ Recovered ${trades.length} trades from truncated response`);
        return trades;
      } catch (e) {
        throw new Error('Failed to parse truncated JSON response');
      }
    }
    throw new Error('JSON is incomplete and cannot be recovered');
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
  const baseTokens = route === 'lite' ? 600 : 900; // +100 buffer
  const tokensPerTrade = route === 'lite' ? 280 : 380; // +30 buffer per trade
  
  if (estimatedTrades <= 1) return baseTokens;
  return Math.min(baseTokens + (tokensPerTrade * (estimatedTrades - 1)), 4500); // +500 max buffer
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
      console.error(`❌ Rate limit exceeded for user ${user.id}:`, rateLimit.message);
      return new Response(
        JSON.stringify({ 
          error: rateLimit.message,
          retryAfterSec: rateLimit.retryAfterSec || 60
        }),
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
              content: `Extract ALL trades from OCR text. Treat this like a table: one trade per row. BUY => long, SELL => short. Output ONLY valid JSON array. Each trade must match schema: ${JSON.stringify(TRADE_SCHEMA)}.

CRITICAL EXTRACTION RULES:
1. Position Type: if entry > exit AND profit > 0 = SHORT, if entry < exit AND profit > 0 = LONG
2. Leverage: Extract from text (e.g., "10x" = 10, "20x" = 20)
3. Position Size: Total position value in USD/USDT
4. Margin: Calculate as position_size / leverage if not explicitly shown
5. Trading Fee: Look for "Fee", "Trade Fee", "Commission" (often shown as negative)
6. Funding Fee: Look for "Funding", "Funding Rate", "Funding Fee" (can be positive or negative)
7. ROI: Calculate as (profit_loss / margin) * 100 if not shown, or extract from "ROE", "ROI", "Return"
8. Setup/Strategy: Look for strategy names like "Scalp", "Swing", "Breakout", "Reversal", "Trend Following"
9. Period of Day: Calculate from opened_at time: 05:00-11:59 = morning, 12:00-17:59 = afternoon, 18:00-04:59 = night
10. Duration: Calculate from opened_at and closed_at timestamps

NEVER return empty array. If uncertain, return best-effort rows. Max 10 trades per image. Expected ~${estimatedTradeCount} trade(s). End with "\\n\\nEND".`
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

      // Parse JSON with robust extraction and multiple retry strategies
      try {
        trades = extractJSON(aiResponse);
        
        // Validate trades array
        if (!Array.isArray(trades)) {
          console.error('❌ Response is not an array:', typeof trades);
          trades = [];
        }
        
        // Check if we got fewer trades than expected - retry with deep model
        if (trades.length < estimatedTradeCount && estimatedTradeCount > 1) {
          console.log(`⚠️ Expected ${estimatedTradeCount} trades but got ${trades.length}, retrying with vision model`);
          // Fall through to deep route
        } else if (trades.length > 0) {
          // Success - skip deep route by continuing
          console.log(`✅ Successfully extracted ${trades.length} trade(s) using lite route`);
        }
      } catch (parseError) {
        console.error('❌ JSON parse error on lite route:', parseError);
        console.error('Raw AI response:', aiResponse.substring(0, 500));
        // Fallback to deep vision model for full extraction
        trades = [];
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
              content: `Extract ALL trades from trading screenshot. Treat this like a table: one trade per row. BUY => long, SELL => short. Return ONLY valid JSON array. Schema: ${JSON.stringify(TRADE_SCHEMA)}.

CRITICAL EXTRACTION RULES:
1. Position Type: if entry > exit AND profit > 0 = SHORT, if entry < exit AND profit > 0 = LONG
2. Leverage: Extract from text (e.g., "10x" = 10, "20x" = 20)
3. Position Size: Total position value in USD/USDT
4. Margin: Calculate as position_size / leverage if not explicitly shown
5. Trading Fee: Look for "Fee", "Trade Fee", "Commission" (often shown as negative)
6. Funding Fee: Look for "Funding", "Funding Rate", "Funding Fee" (can be positive or negative)
7. ROI: Calculate as (profit_loss / margin) * 100 if not shown, or extract from "ROE", "ROI", "Return"
8. Setup/Strategy: Look for strategy names like "Scalp", "Swing", "Breakout", "Reversal", "Trend Following"
9. Period of Day: Calculate from opened_at time: 05:00-11:59 = morning, 12:00-17:59 = afternoon, 18:00-04:59 = night
10. Duration: Calculate from opened_at and closed_at timestamps

NEVER return empty array. If uncertain, return best-effort rows. Max 10 trades per image. Expected ~${estimatedTradeCount} trade(s). End with "\\n\\nEND".${brokerContext}${annotationContext}`
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
          
          if (!Array.isArray(trades)) {
            console.error('❌ Deep response is not an array:', typeof trades);
            throw new Error('AI returned invalid data format');
          }
          
          if (trades.length === 0) {
            console.warn('⚠️ Deep model returned empty array');
            throw new Error('No trades found in image. Please ensure the screenshot shows trade data clearly.');
          }
          
          console.log(`✅ Deep model extracted ${trades.length} trade(s)`);
        } catch (parseError) {
          console.error('❌ JSON parse error on deep route:', parseError);
          console.error('Raw deep response:', deepAiResponse.substring(0, 500));
          
          // Last resort: try to extract partial data
          if (deepAiResponse.includes('{') && deepAiResponse.includes('}')) {
            console.log('🔧 Attempting partial extraction...');
            try {
              const partialMatch = deepAiResponse.match(/\[[\s\S]*\]/);
              if (partialMatch) {
                trades = JSON.parse(partialMatch[0]);
                console.log(`⚠️ Partial extraction successful: ${trades.length} trade(s)`);
              } else {
                throw new Error('Could not extract valid JSON from response');
              }
            } catch {
              throw new Error('Failed to parse AI response. Please try again with a clearer screenshot.');
            }
          } else {
            throw new Error('AI response contains no valid trade data. Try a different screenshot.');
          }
        }
      }

    } else {
      // Direct to deep vision model
      console.log('👁️ Using vision + deep route', ocrText ? `(OCR quality too low: ${ocrQualityScore.toFixed(2)})` : '(no OCR data)');
      route = 'deep';
      modelUsed = 'google/gemini-2.5-flash';

      const maxTokens = calculateMaxTokens(estimatedTradeCount, 'deep');
      console.log(`🎯 Allocating ${maxTokens} tokens for ${estimatedTradeCount} estimated trade(s)`);

      // Add retry logic for vision model (2 attempts)
      let response: Response | undefined;
      let retryCount = 0;
      const MAX_RETRIES = 1;
      
      while (retryCount <= MAX_RETRIES) {
        try {
          response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: `Extract ALL trades from trading screenshot. Treat this like a table: one trade per row. BUY => long, SELL => short. Return ONLY valid JSON array. Schema: ${JSON.stringify(TRADE_SCHEMA)}.

CRITICAL EXTRACTION RULES:
1. Position Type: if entry > exit AND profit > 0 = SHORT, if entry < exit AND profit > 0 = LONG
2. Leverage: Extract from text (e.g., "10x" = 10, "20x" = 20)
3. Position Size: Total position value in USD/USDT
4. Margin: Calculate as position_size / leverage if not explicitly shown
5. Trading Fee: Look for "Fee", "Trade Fee", "Commission" (often shown as negative)
6. Funding Fee: Look for "Funding", "Funding Rate", "Funding Fee" (can be positive or negative)
7. ROI: Calculate as (profit_loss / margin) * 100 if not shown, or extract from "ROE", "ROI", "Return"
8. Setup/Strategy: Look for strategy names like "Scalp", "Swing", "Breakout", "Reversal", "Trend Following"
9. Period of Day: Calculate from opened_at time: 05:00-11:59 = morning, 12:00-17:59 = afternoon, 18:00-04:59 = night
10. Duration: Calculate from opened_at and closed_at timestamps

NEVER return empty array. If uncertain, return best-effort rows. Max 10 trades per image. Expected ~${estimatedTradeCount} trade(s). End with "\\n\\nEND".${brokerContext}${annotationContext}`
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
          
          if (response.ok) break; // Success
          
          // Handle retryable errors
          if (response.status === 429 && retryCount < MAX_RETRIES) {
            console.log(`⏳ Rate limit hit, waiting 2s before retry ${retryCount + 1}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount++;
            continue;
          }
          
          break; // Non-retryable error
        } catch (fetchError) {
          console.error(`❌ Fetch error on attempt ${retryCount + 1}:`, fetchError);
          if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          } else {
            throw fetchError;
          }
        }
      }

      if (!response) {
        throw new Error('Vision model request failed after all retries');
      }

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

    // Normalize trades to match database schema with enhanced calculations
    const normalizedTrades = trades.map((t: any) => {
      const posSize = Number(t.position_size) || 0;
      const leverage = Number(t.leverage) || 1;
      const profitLoss = Number(t.profit_loss) || 0;
      
      // Calculate margin if not provided: margin = position_size / leverage
      let margin = t.margin ? Number(t.margin) : null;
      if (!margin && posSize && leverage) {
        margin = posSize / leverage;
      }
      
      // Calculate ROI if not provided: roi = (profit_loss / margin) * 100
      let roi = Number(t.roi) || 0;
      if (!roi && profitLoss && margin && margin > 0) {
        roi = (profitLoss / margin) * 100;
      }
      
      // Calculate period_of_day from opened_at if not provided
      let periodOfDay = t.period_of_day ?? 'morning';
      if (t.opened_at && !t.period_of_day) {
        try {
          const openTime = new Date(t.opened_at);
          const hour = openTime.getHours();
          if (hour >= 5 && hour < 12) periodOfDay = 'morning';
          else if (hour >= 12 && hour < 18) periodOfDay = 'afternoon';
          else periodOfDay = 'night';
        } catch (e) {
          console.warn('Failed to parse opened_at for period_of_day:', e);
        }
      }
      
      return {
        symbol: t.symbol ?? t.asset ?? '',
        side: (t.side ?? t.position_type ?? 'long').toLowerCase(),
        broker: broker || t.broker || '',
        setup: t.setup ?? '',
        emotional_tag: t.emotional_tag ?? '',
        entry_price: Number(t.entry_price) || 0,
        exit_price: Number(t.exit_price) || 0,
        position_size: posSize,
        leverage: leverage,
        profit_loss: profitLoss,
        funding_fee: Number(t.funding_fee) || 0,
        trading_fee: Number(t.trading_fee) || 0,
        roi: roi,
        margin: margin,
        opened_at: t.opened_at ?? '',
        closed_at: t.closed_at ?? '',
        period_of_day: periodOfDay,
        duration_days: Number(t.duration_days) || 0,
        duration_hours: Number(t.duration_hours) || 0,
        duration_minutes: Number(t.duration_minutes) || 0,
        notes: t.notes ?? ''
      };
    });

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
