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

async function ccxtProbe(useNativeFetch: boolean) {
  const ccxt = (await import('npm:ccxt@^4')).default;
  const client = new (ccxt as any).bingx({
    apiKey: 'dummy-invalid-key',
    secret: 'dummy-invalid-secret',
    enableRateLimit: true,
  });
  if (useNativeFetch) {
    client.fetchImplementation = fetch;
  }
  try {
    const bal = await client.fetchBalance({ type: 'spot' });
    return { ok: true, sample: JSON.stringify(bal).slice(0, 150) };
  } catch (error) {
    return { ok: false, causeChain: describe(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const targets = [
    'https://open-api.bingx.com/openApi/swap/v2/server/time',
    'https://open-api.bingx.com/openApi/spot/v1/common/symbols',
    'https://api.binance.com/api/v3/time',
    'https://open-api.bingx.com/openApi/wallets/v1/capital/config/getall?timestamp=1&signature=x',
    'https://open-api.bingx.com/openApi/spot/v1/account/balance?timestamp=1&signature=x',
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

  results['ccxt:default-transport'] = await ccxtProbe(false);
  results['ccxt:native-fetch'] = await ccxtProbe(true);

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
