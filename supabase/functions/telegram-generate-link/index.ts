// Authenticated: creates a one-time deep-link token and returns the
// t.me URL the Settings page opens. Spec §9.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const botUsername = Deno.env.get('TELEGRAM_BOT_USERNAME');
  if (!botUsername) return errorResponse('Bot not configured', 503);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse('Missing authorization header', 401);
  const { data: { user }, error: authError } =
    await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => ({}));
  const timezone = typeof body.timezone === 'string' ? body.timezone : 'UTC';
  const locale = typeof body.locale === 'string' ? body.locale.slice(0, 2) : 'en';

  // One active token per user: replace any previous one.
  await supabase.from('telegram_link_tokens').delete().eq('user_id', user.id);

  const token = crypto.randomUUID().replaceAll('-', '');
  const { error } = await supabase.from('telegram_link_tokens').insert({
    token,
    user_id: user.id,
    timezone,
    locale,
  });
  if (error) {
    console.error('token insert failed', error.message);
    return errorResponse('Could not create link token', 500);
  }

  return jsonResponse({ deepLink: `https://t.me/${botUsername}?start=${token}` });
});
