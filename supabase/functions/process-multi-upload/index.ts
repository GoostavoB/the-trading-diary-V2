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

    const { trades, creditsToDeduct } = await req.json();

    if (!Array.isArray(trades) || trades.length === 0) {
      throw new Error('No trades provided');
    }

    // Validate trade count (max 10 trades per image)
    const maxAllowedTrades = creditsToDeduct * 10;
    if (trades.length > maxAllowedTrades) {
      return new Response(
        JSON.stringify({ 
          error: `Cannot save ${trades.length} trades with ${creditsToDeduct} images. Maximum allowed: ${maxAllowedTrades} trades.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${trades.length} trades for user ${user.id}`);

    // TODO: Implement credit system when database schema is ready
    // Credit deduction will be added after database migration

    // Insert all trades with proper field mapping
    const { data: insertedTrades, error } = await supabaseClient
      .from('trades')
      .insert(
        trades.map(t => ({
          ...t,
          user_id: user.id,
          symbol_temp: t.symbol || t.symbol_temp, // Map symbol to symbol_temp for database
        }))
      )
      .select();

    if (error) throw error;

    console.log(`Successfully inserted ${insertedTrades?.length || 0} trades`);

    return new Response(
      JSON.stringify({ 
        success: true,
        trades: insertedTrades,
        tradesInserted: insertedTrades?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Multi-upload processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
