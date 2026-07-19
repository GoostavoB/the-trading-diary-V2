// Destila o heatmap de liquidações do CoinGlass (actor
// api_merge/coinglass-liquidation-heatmap no Apify) nas zonas densas que
// importam: top bolsões acima e abaixo do preço atual. O dataset bruto tem
// milhares de pontos [tempo, nivel, valor]; guardamos só o resumo.
// Secret: APIFY_TOKEN (o mesmo). Actor configurável via APIFY_HEATMAP_ACTOR_ID.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const DEFAULT_ACTOR = 'api_merge~coinglass-liquidation-heatmap';
const TOP_ZONES_PER_SIDE = 4;

interface HeatmapItem {
  y_axis: number[];
  liquidation_leverage_data: Array<[number, number, number]>;
  price_candlesticks: Array<[number, string, string, string, string, string]>;
}

Deno.serve(async (_req) => {
  const token = Deno.env.get('APIFY_TOKEN');
  if (!token) {
    console.error('APIFY_TOKEN não configurado');
    return json({ ok: false, error: 'missing APIFY_TOKEN' });
  }
  const actorId = Deno.env.get('APIFY_HEATMAP_ACTOR_ID') ?? DEFAULT_ACTOR;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs/last/dataset/items` +
      `?token=${encodeURIComponent(token)}&status=SUCCEEDED&clean=true`,
      { signal: AbortSignal.timeout(60_000) },
    );
    if (!res.ok) {
      console.error('Apify fetch failed', res.status);
      return json({ ok: false, error: `apify ${res.status}` });
    }
    const items: HeatmapItem[] = await res.json();
    const data = items?.[0];
    if (!data?.y_axis?.length || !data?.liquidation_leverage_data?.length) {
      return json({ ok: false, error: 'dataset vazio ou formato inesperado' });
    }

    // Preço atual = fechamento do último candle.
    const lastCandle = data.price_candlesticks?.[data.price_candlesticks.length - 1];
    const currentPrice = lastCandle ? Number(lastCandle[4]) : NaN;
    if (!Number.isFinite(currentPrice)) {
      return json({ ok: false, error: 'preço atual indisponível' });
    }

    // Última coluna de tempo = estado mais recente do heatmap.
    const latestX = Math.max(...data.liquidation_leverage_data.map((t) => t[0]));
    const byLevel = new Map<number, number>();
    for (const [x, y, value] of data.liquidation_leverage_data) {
      if (x !== latestX || !Number.isFinite(value)) continue;
      byLevel.set(y, (byLevel.get(y) ?? 0) + value);
    }

    const zones = [...byLevel.entries()]
      .map(([y, liq]) => ({ price: data.y_axis[y], liq }))
      .filter((z) => Number.isFinite(z.price) && z.liq > 0);

    const above = zones.filter((z) => z.price > currentPrice)
      .sort((a, b) => b.liq - a.liq).slice(0, TOP_ZONES_PER_SIDE);
    const below = zones.filter((z) => z.price <= currentPrice)
      .sort((a, b) => b.liq - a.liq).slice(0, TOP_ZONES_PER_SIDE);

    await supabase.from('liq_zones').delete().eq('symbol', 'BTC');
    let inserted = 0;
    for (const [side, list] of [['above', above], ['below', below]] as const) {
      for (const z of list) {
        const { error } = await supabase.from('liq_zones').insert({
          symbol: 'BTC',
          side,
          price: z.price,
          liq_usd: z.liq,
          pct_away: ((z.price - currentPrice) / currentPrice) * 100,
          ref_price: currentPrice,
          updated_at: new Date().toISOString(),
        });
        if (error) console.error('insert failed', error.message);
        else inserted++;
      }
    }

    console.log(`heatmap sync: ${inserted} zonas (preço ref ${currentPrice})`);
    return json({ ok: true, inserted, currentPrice });
  } catch (error) {
    console.error('liquidation-heatmap-sync error', error);
    return json({ ok: false, error: String(error) });
  }
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
