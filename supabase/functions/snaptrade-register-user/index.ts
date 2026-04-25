// ────────────────────────────────────────────────────────────────────────────
// POST /snaptrade-register-user
//   Idempotently registers the authenticated Supabase user with SnapTrade and
//   stores the returned userSecret in `aggregator_users`.
//
//   Returns: { userId: <supabase auth.uid>, registered: boolean }
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { snapTradeRegisterUser } from '../_shared/snaptrade.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    // Identify the calling user via their JWT
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) return errorResponse('Unauthorized', 401);

    // Service-role client to write across RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Already registered?
    const { data: existing } = await supabaseAdmin
      .from('aggregator_users')
      .select('id, provider_user_id')
      .eq('user_id', user.id)
      .eq('provider', 'snaptrade')
      .maybeSingle();

    if (existing) {
      return jsonResponse({ userId: existing.provider_user_id, registered: false });
    }

    // Register with SnapTrade — use the Supabase user.id as their userId
    const result = await snapTradeRegisterUser(user.id);

    const { error: insertErr } = await supabaseAdmin
      .from('aggregator_users')
      .insert({
        user_id: user.id,
        provider: 'snaptrade',
        provider_user_id: result.userId,
        provider_user_secret: result.userSecret,
      });

    if (insertErr) {
      console.error('[snaptrade-register-user] insert failed', insertErr);
      return errorResponse('Failed to persist SnapTrade user', 500);
    }

    return jsonResponse({ userId: result.userId, registered: true });
  } catch (err) {
    console.error('[snaptrade-register-user] error', err);
    return errorResponse((err as Error).message || 'Internal error', 500);
  }
});
