import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🎯 vision-extract-trades invoked - Function is alive!', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth from JWT verification (handled by Supabase since verify_jwt = true)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract user ID from JWT (already verified by Supabase when verify_jwt = true)
    const token = authHeader.replace('Bearer ', '');
    let userId: string;

    try {
      // Decode JWT to get user ID (JWT signature already verified by Supabase)
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      
      if (!userId) {
        console.error('❌ No user ID in JWT');
        return new Response(JSON.stringify({ error: 'Invalid token - no user ID' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('✅ User authenticated:', userId);
    } catch (decodeError) {
      console.error('❌ JWT decode failed:', decodeError);
      return new Response(JSON.stringify({ error: 'Invalid token format' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { imageBase64, broker, annotations, debug } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📸 Vision extraction request:', { 
      userId, 
      broker,
      hasAnnotations: !!annotations?.length,
      debug: !!debug
    });

    // Build prompt based on whether annotations are provided
    let userPrompt = `Look at this trading history screenshot and organize all the trading data you can see.

For each trade row, extract whatever information is visible:
- Symbol/Asset (like BTC, BTCUSDT, ETHUSDT, LINKUSDT, SOLUSDT)
- Direction (Long/Short or Buy/Sell - either format works)
- PnL (profit/loss - can be a number, percentage, or both)
- Entry and Exit prices (if shown)
- Position size
- Leverage
- Margin used
- Fees (trading fee, funding fee)
- Timestamps (open time, close time)

Don't worry about the exact broker or format - just extract what you see clearly.
If a field isn't visible or readable, skip it.

Return as a JSON array where each trade is an object with the fields you found. Example:
[
  {
    "symbol": "BTCUSDT",
    "direction": "long",
    "pnl": 150.50,
    "entry_price": 45000,
    "exit_price": 46000
  }
]`;

    if (annotations && annotations.length > 0) {
      userPrompt += `\n\nIMPORTANT ANNOTATION HINTS: The user has marked these field locations on the image to help you understand the layout:\n`;
      annotations.forEach((ann: any) => {
        userPrompt += `- "${ann.label}" is located at approximately ${ann.relativeX.toFixed(1)}% horizontal, ${ann.relativeY.toFixed(1)}% vertical\n`;
      });
      userPrompt += `\nUse these annotations as visual hints to understand which columns/fields contain which data. Look for similar patterns in other rows/trades.`;
    }

    // Call Lovable AI Gateway with Gemini Pro Vision
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🤖 Calling Gemini Pro Vision...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a precise trade data extractor. Return ONLY valid JSON arrays. Never include markdown, explanations, or any text outside the JSON structure.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1500
      })
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error('❌ AI Gateway error:', status, errorText);
      
      if (status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again in a moment.',
          retryAfter: 60 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          message: 'AI credits exhausted. Please add funds to your Lovable workspace.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'AI processing failed',
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in AI response');
      return new Response(JSON.stringify({ 
        error: 'Empty AI response',
        needsAnnotation: true,
        reason: 'complex_layout'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ AI response received');

    // Parse JSON from response (handle markdown code blocks)
    let tradesData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      tradesData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      return new Response(JSON.stringify({ 
        error: 'Invalid AI response format',
        needsAnnotation: !annotations,
        reason: 'parse_error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure it's an array
    if (!Array.isArray(tradesData)) {
      tradesData = [tradesData];
    }

    // Validate and normalize trades - accept trades with flexible criteria
    const validTrades = tradesData
      .filter((t: any) => {
        // Must have at minimum: direction + symbol
        const hasDirection = t.direction || t.side;
        const hasSymbol = t.symbol || t.asset || t.pair;
        
        // Accept if we have PnL, OR entry/exit prices, OR percentage
        const hasPnL = typeof t.pnl === 'number' || typeof t.profit_loss === 'number';
        const hasPrices = (t.entry_price && t.exit_price);
        const hasPercent = typeof t.roi === 'number' || String(t.pnl || '').includes('%');
        
        // Accept trade if we have direction + symbol + any price/pnl info
        return hasDirection && hasSymbol && (hasPnL || hasPrices || hasPercent);
      })
      .map((t: any) => {
        // Normalize field names
        const direction = (t.direction || t.side || 'long').toLowerCase();
        const symbol = t.symbol || t.asset || t.pair || 'UNKNOWN';
        const pnl = Number(t.pnl ?? t.profit_loss ?? 0);
        
        // Calculate durations if timestamps provided
        let duration_hours = 0;
        let duration_minutes = 0;
        let duration_days = 0;
        
        if (t.opened_at && t.closed_at) {
          const openMs = new Date(t.opened_at).getTime();
          const closeMs = new Date(t.closed_at).getTime();
          const diffMs = closeMs - openMs;
          
          if (diffMs > 0) {
            duration_minutes = Math.floor(diffMs / (1000 * 60));
            duration_hours = Math.floor(duration_minutes / 60);
            duration_days = Math.floor(duration_hours / 24);
          }
        }

        // Calculate ROI if possible
        const entry_price = Number(t.entry_price || 0);
        const position_size = Number(t.position_size || 0);
        const margin = Number(t.margin || (entry_price * position_size) || 0);
        const roi = margin > 0 ? ((pnl / margin) * 100) : 0;

        return {
          symbol: symbol.toUpperCase(),
          side: direction as 'long' | 'short',
          broker: broker || t.broker || null,
          entry_price: entry_price,
          exit_price: Number(t.exit_price || 0),
          position_size: position_size,
          leverage: Number(t.leverage || 1),
          margin: margin,
          trading_fee: Number(t.trading_fee || t.fee || 0),
          funding_fee: Number(t.funding_fee || 0),
          profit_loss: pnl,
          roi: roi,
          opened_at: t.opened_at || new Date().toISOString(),
          closed_at: t.closed_at || new Date().toISOString(),
          period_of_day: determinePeriod(t.opened_at),
          duration_days,
          duration_hours,
          duration_minutes,
          notes: t.notes || null,
          setup: t.setup || null,
          emotional_tag: t.emotional_tag || null
        };
      });

    console.log(`✅ Extracted ${validTrades.length} valid trades`);
    
    // Log when 0 trades found for debugging
    if (validTrades.length === 0) {
      console.log('⚠️ Zero trades extracted');
      console.log('Raw AI response length:', content.length);
      console.log('Parsed trades count:', tradesData.length);
      console.log('Failed validation:', tradesData.length - validTrades.length);
    }

    // Determine if we need annotation based on results
    const needsAnnotation = validTrades.length === 0 && !annotations;
    const confidence = validTrades.length > 0 ? 0.85 : 0.3;
    const detectedLayout = determineLayout(validTrades, content);

    if (needsAnnotation) {
      return new Response(JSON.stringify({ 
        trades: [],
        confidence,
        totalFound: 0,
        detectedLayout,
        needsAnnotation: true,
        reason: 'no_trades_detected',
        message: 'Could not detect trades. Please mark one example trade to help us understand the layout.',
        debug: debug ? {
          rawAIResponse: content.substring(0, 1000),
          parsedTradesCount: 0,
          validatedTradesCount: 0,
          validationFailures: 0,
          model: 'openai/gpt-5',
          timestamp: new Date().toISOString()
        } : undefined
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      trades: validTrades,
      confidence,
      totalFound: validTrades.length,
      detectedLayout,
      needsAnnotation: false,
      debug: debug ? {
        rawAIResponse: content.substring(0, 1000),
        parsedTradesCount: tradesData.length,
        validatedTradesCount: validTrades.length,
        validationFailures: tradesData.length - validTrades.length,
        model: 'openai/gpt-5',
        timestamp: new Date().toISOString()
      } : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Vision extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      needsAnnotation: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function determinePeriod(timestamp: string | null): 'morning' | 'afternoon' | 'night' {
  if (!timestamp) return 'morning';
  
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

function determineLayout(trades: any[], content: string): string {
  if (trades.length === 0) return 'complex';
  if (content.includes('header') || content.includes('column')) return 'table_with_headers';
  return 'table_no_headers';
}
