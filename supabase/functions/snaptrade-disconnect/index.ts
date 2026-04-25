// ────────────────────────────────────────────────────────────────────────────
// POST /snaptrade-disconnect
//   Removes a SnapTrade authorization (broker connection) and marks our DB row
//   as 'disconnected'. Trades that came from this connection are NOT deleted
//   so the user keeps their history.
//
//   Body: { connectionId: string }
//   Returns: { ok: true }
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { snapTradeRemoveConnection } from '../_shared/snaptrade.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

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

    const { connectionId } = await req.json().catch(() => ({}));
    if (!connectionId) return errorResponse('connectionId required', 400);

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
    if (!aggUser) return errorResponse('Not registered', 400);

    // Verify ownership
    const { data: conn } = await supabaseAdmin
      .from('aggregator_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('connection_id', connectionId)
      .maybeSingle();
    if (!conn) return errorResponse('Connection not found', 404);

    await snapTradeRemoveConnection({
      userId: aggUser.provider_user_id,
      userSecret: aggUser.provider_user_secret,
      authorizationId: connectionId,
    });

    await supabaseAdmin
      .from('aggregator_connections')
      .update({ status: 'disconnected' })
      .eq('user_id', user.id)
      .eq('connection_id', connectionId);

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[snaptrade-disconnect] error', err);
    return errorResponse((err as Error).message || 'Internal error', 500);
  }
});
