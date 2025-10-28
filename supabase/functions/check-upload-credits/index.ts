import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Checking upload credits for user: ${user.id}`);

    // Get user's tier data
    const { data: tierData, error: tierError } = await supabase
      .from('user_xp_tiers')
      .select('daily_upload_count, daily_upload_limit')
      .eq('user_id', user.id)
      .single();

    if (tierError) {
      console.error('Error fetching tier data:', tierError);
    }

    const dailyCount = tierData?.daily_upload_count || 0;
    const dailyLimit = tierData?.daily_upload_limit || 1;

    console.log(`Upload stats - Used: ${dailyCount}, Limit: ${dailyLimit}`);

    if (dailyCount >= dailyLimit) {
      return new Response(
        JSON.stringify({
          canUpload: false,
          remaining: 0,
          limit: dailyLimit,
          used: dailyCount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        canUpload: true,
        remaining: dailyLimit - dailyCount,
        limit: dailyLimit,
        used: dailyCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-upload-credits:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
