// ────────────────────────────────────────────────────────────────────────────
// GET /snaptrade-list-connections
//   Lists all SnapTrade connections for the authenticated user. Hits SnapTrade
//   live (so we always have fresh status), then upserts into our DB.
//
//   Returns: Array<AggregatorConnection>
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { snapTradeListConnections } from '../_shared/snaptrade.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: aggUser } = await supabaseAdmin
      .from('aggregator_users')
      .select('provider_user_id, provider_user_secret')
      .eq('user_id', user.id)
      .eq('provider', 'snaptrade')
      .maybeSingle();

    if (!aggUser) {
      return jsonResponse([]); // user never registered → no connections
    }

    const live = await snapTradeListConnections(
      aggUser.provider_user_id,
      aggUser.provider_user_secret,
    );

    // Upsert into our DB so reads can be fast offline
    for (const c of live) {
      await supabaseAdmin.from('aggregator_connections').upsert({
        user_id: user.id,
        provider: 'snaptrade',
        connection_id: c.id,
        broker_slug: c.brokerage.slug,
        broker_label: c.brokerage.name,
        status: c.disabled ? 'requires_reauth' : 'active',
        meta: { logo: c.brokerage.logo, type: c.type, name: c.name },
      }, { onConflict: 'user_id,provider,connection_id' });
    }

    // Return the merged DB rows (with our internal ids and last_synced_at)
    const { data: rows } = await supabaseAdmin
      .from('aggregator_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'snaptrade')
      .neq('status', 'disconnected')
      .order('created_at', { ascending: false });

    return jsonResponse(rows || []);
  } catch (err) {
    console.error('[snaptrade-list-connections] error', err);
    return errorResponse((err as Error).message || 'Internal error', 500);
  }
});
