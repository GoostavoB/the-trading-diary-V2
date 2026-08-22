// TEMPORARY diagnostic: checks whether Supabase Edge egress can reach BingX.
// Uses only public, unauthenticated endpoints. Safe to delete.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function describe(error: unknown): string[] {
  const chain: string[] = [];
  let cur: any = error;
  let depth = 0;
  while (cur && depth < 5) {
    chain.push(
      `${cur?.name ?? typeof cur}: ${cur?.message ?? String(cur)}${cur?.code ? ` [code=${cur.code}]` : ''}${cur?.errno ? ` [errno=${cur.errno}]` : ''}`
    );
    cur = cur?.cause;
    depth++;
  }
  return chain;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const targets = [
    'https://open-api.bingx.com/openApi/swap/v2/server/time',
    'https://open-api.bingx.com/openApi/spot/v1/common/symbols',
    'https://api.binance.com/api/v3/time',
  ];

  const results: Record<string, unknown> = {};

  for (const url of targets) {
    const started = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      results[url] = { ok: true, status: res.status, ms: Date.now() - started, body: text.slice(0, 200) };
    } catch (error) {
      results[url] = { ok: false, ms: Date.now() - started, causeChain: describe(error) };
      console.error(`probe ${url} failed:`, JSON.stringify(describe(error)));
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
