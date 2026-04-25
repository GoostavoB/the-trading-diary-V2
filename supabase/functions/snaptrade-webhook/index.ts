// ────────────────────────────────────────────────────────────────────────────
// POST /snaptrade-webhook  (PUBLIC — no auth)
//
// SnapTrade webhook events:
//   - USER_REGISTERED
//   - CONNECTION_ADDED          → mark connection active, kick off historical sync
//   - CONNECTION_DELETED        → mark connection disconnected
//   - CONNECTION_BROKEN         → mark connection requires_reauth
//   - CONNECTION_FIXED
//   - CONNECTION_UPDATED
//   - ACCOUNT_HOLDINGS_UPDATED  → trigger incremental sync
//   - ACCOUNT_TRANSACTIONS_INITIAL_UPDATE
//   - ACCOUNT_TRANSACTIONS_UPDATED
//   - NEW_ACCOUNT_AVAILABLE
//
// Configure in SnapTrade dashboard → Webhooks:
//   URL: https://<your-supabase-project>.supabase.co/functions/v1/snaptrade-webhook
//   Events: select all
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const payload = await req.json();
    console.log('[snaptrade-webhook] received', payload.eventType, payload);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // SnapTrade payload shape: { userId, eventType, eventTimestamp, details: {...} }
    const { userId: snapUserId, eventType, details } = payload;

    // Find our user from snapUserId
    const { data: aggUser } = await supabaseAdmin
      .from('aggregator_users')
      .select('user_id')
      .eq('provider', 'snaptrade')
      .eq('provider_user_id', snapUserId)
      .maybeSingle();

    const localUserId = aggUser?.user_id;

    switch (eventType) {
      case 'CONNECTION_ADDED':
      case 'CONNECTION_FIXED':
      case 'CONNECTION_UPDATED': {
        if (localUserId && details?.brokerageAuthorizationId) {
          await supabaseAdmin
            .from('aggregator_connections')
            .upsert({
              user_id: localUserId,
              provider: 'snaptrade',
              connection_id: details.brokerageAuthorizationId,
              broker_slug: details.brokerage?.slug || details.brokerageId || 'UNKNOWN',
              broker_label: details.brokerage?.name,
              status: 'active',
            }, { onConflict: 'user_id,provider,connection_id' });
        }
        break;
      }

      case 'CONNECTION_BROKEN': {
        if (localUserId && details?.brokerageAuthorizationId) {
          await supabaseAdmin
            .from('aggregator_connections')
            .update({ status: 'requires_reauth' })
            .eq('user_id', localUserId)
            .eq('connection_id', details.brokerageAuthorizationId);
        }
        break;
      }

      case 'CONNECTION_DELETED': {
        if (localUserId && details?.brokerageAuthorizationId) {
          await supabaseAdmin
            .from('aggregator_connections')
            .update({ status: 'disconnected' })
            .eq('user_id', localUserId)
            .eq('connection_id', details.brokerageAuthorizationId);
        }
        break;
      }

      case 'ACCOUNT_HOLDINGS_UPDATED':
      case 'ACCOUNT_TRANSACTIONS_INITIAL_UPDATE':
      case 'ACCOUNT_TRANSACTIONS_UPDATED': {
        // Note: we don't auto-trigger sync from here to avoid duplicate work
        // when many events fire in a row. The frontend polls list-connections
        // and can call sync-trades after CONNECTION_ADDED settles.
        if (localUserId) {
          await supabaseAdmin
            .from('aggregator_connections')
            .update({ status: 'active' })
            .eq('user_id', localUserId)
            .eq('status', 'syncing');
        }
        break;
      }

      default:
        // Unhandled event — log and ack so SnapTrade doesn't retry
        break;
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[snaptrade-webhook] error', err);
    // Still 200 so SnapTrade doesn't retry indefinitely on parse errors
    return jsonResponse({ ok: false, error: (err as Error).message }, 200);
  }
});
