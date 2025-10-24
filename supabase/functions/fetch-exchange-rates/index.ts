import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExchangeRates {
  timestamp: string;
  crypto: {
    bitcoin: { usd: number };
    ethereum: { usd: number };
  };
  fiat: Record<string, number>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching exchange rates...');

    // Fetch crypto prices from CoinGecko
    const cryptoResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!cryptoResponse.ok) {
      console.error('CoinGecko API error:', await cryptoResponse.text());
      throw new Error(`CoinGecko API failed: ${cryptoResponse.status}`);
    }

    const cryptoData = await cryptoResponse.json();
    console.log('Crypto prices fetched:', cryptoData);

    // Fetch fiat exchange rates (using exchangerate-api.com - free tier)
    const fiatResponse = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!fiatResponse.ok) {
      console.error('Exchange Rate API error:', await fiatResponse.text());
      throw new Error(`Exchange Rate API failed: ${fiatResponse.status}`);
    }

    const fiatData = await fiatResponse.json();
    console.log('Fiat rates fetched successfully');

    // Prepare the response data
    const exchangeRates: ExchangeRates = {
      timestamp: new Date().toISOString(),
      crypto: cryptoData,
      fiat: fiatData.rates,
    };

    // Store in Supabase for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store or update exchange rates in a table
    const { error: upsertError } = await supabase
      .from('exchange_rates_cache')
      .upsert({
        id: 'latest',
        rates: exchangeRates,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Error caching rates:', upsertError);
    } else {
      console.log('Exchange rates cached successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: exchangeRates,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
