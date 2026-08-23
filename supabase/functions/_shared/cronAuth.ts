// Shared guard for scheduled (verify_jwt = false) functions.
//
// These functions run with the service-role key and act on every user's data,
// so they must not be triggerable by anonymous callers. A request is accepted
// only when it presents the pre-shared CRON_SECRET (header `x-cron-secret`)
// or the project's service-role key in the Authorization header.
export function isAuthorizedCronRequest(req: Request): boolean {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const provided = req.headers.get('x-cron-secret');
  if (cronSecret && provided && provided === cronSecret) return true;

  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (serviceKey && bearer && bearer === serviceKey) return true;

  return false;
}

export function forbiddenResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
