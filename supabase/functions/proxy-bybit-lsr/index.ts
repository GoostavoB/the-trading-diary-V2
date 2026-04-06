import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol') || 'BTCUSDT';
    const period = url.searchParams.get('period') || '1h';
    const limit = url.searchParams.get('limit') || '100';

    // Validate inputs
    const validSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT'];
    const validPeriods = ['5min', '15min', '30min', '1h', '4h', '1d'];
    
    if (!validSymbols.includes(symbol)) {
      return new Response(JSON.stringify({ error: 'Invalid symbol' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!validPeriods.includes(period)) {
      return new Response(JSON.stringify({ error: 'Invalid period' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 500);

    const response = await fetch(
      `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${symbol}&period=${period}&limit=${limitNum}`
    );

    if (!response.ok) {
      throw new Error(`Bybit API returned ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error proxying Bybit LSR:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
