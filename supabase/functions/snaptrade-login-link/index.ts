// ────────────────────────────────────────────────────────────────────────────
// POST /snaptrade-login-link
//   Generates a redirect URL for SnapTrade's hosted Connection Portal.
//   The frontend opens this URL in a popup; the user logs into their broker
//   (Binance/Coinbase/etc) and SnapTrade redirects back to `customRedirect`.
//
//   Body: { broker?: 'BINANCE' | 'COINBASE' | ..., redirect?: string }
//   Returns: { redirectURI, sessionId }
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { snapTradeLoginPortalURI } from '../_shared/snaptrade.ts';

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

    const { broker, redirect } = await req.json().catch(() => ({}));

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
      return errorResponse('User not registered with SnapTrade — call snaptrade-register-user first', 400);
    }

    const result = await snapTradeLoginPortalURI({
      userId: aggUser.provider_user_id,
      userSecret: aggUser.provider_user_secret,
      broker: broker || undefined,
      immediateRedirect: false,
      customRedirect: redirect || undefined,
    });

    return jsonResponse(result);
  } catch (err) {
    console.error('[snaptrade-login-link] error', err);
    return errorResponse((err as Error).message || 'Internal error', 500);
  }
});
