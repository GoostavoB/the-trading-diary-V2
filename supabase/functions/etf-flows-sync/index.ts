// Sincroniza fluxos diários dos ETFs spot de cripto (BTC/ETH/SOL) a partir
// do actor gochujang/crypto-etf-flow-tracker no Apify (dados SoSoValue).
// O usuário agenda o actor no Apify; esta função (cron diário) lê o dataset
// da última execução bem-sucedida. Secret: APIFY_TOKEN (o mesmo do calendário).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const DEFAULT_ACTOR = 'gochujang~crypto-etf-flow-tracker';

interface FlowRow {
  etf_type: string;
  date: string;                 // "YYYY-MM-DD"
  net_inflow_usd: number;
  value_traded_usd: number | null;
  total_net_assets_usd: number | null;
  cum_net_inflow_usd: number | null;
  aum_change_pct: number | null;
}

Deno.serve(async (_req) => {
  const token = Deno.env.get('APIFY_TOKEN');
  if (!token) {
    console.error('APIFY_TOKEN não configurado');
    return json({ ok: false, error: 'missing APIFY_TOKEN' });
  }
  const actorId = Deno.env.get('APIFY_ETF_ACTOR_ID') ?? DEFAULT_ACTOR;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs/last/dataset/items` +
      `?token=${encodeURIComponent(token)}&status=SUCCEEDED&clean=true`,
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!res.ok) {
      console.error('Apify fetch failed', res.status);
      return json({ ok: false, error: `apify ${res.status}` });
    }
    const rows: FlowRow[] = await res.json();

    let upserted = 0;
    for (const r of rows) {
      if (!r?.etf_type || !r?.date || typeof r.net_inflow_usd !== 'number') continue;
      const { error } = await supabase.from('etf_flows').upsert({
        etf_type: r.etf_type,
        flow_date: r.date,
        net_inflow_usd: r.net_inflow_usd,
        value_traded_usd: r.value_traded_usd ?? null,
        total_net_assets_usd: r.total_net_assets_usd ?? null,
        cum_net_inflow_usd: r.cum_net_inflow_usd ?? null,
        aum_change_pct: r.aum_change_pct ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'etf_type,flow_date' });
      if (error) console.error('upsert failed', r.etf_type, r.date, error.message);
      else upserted++;
    }

    // Mantém ~90 dias de histórico.
    await supabase.from('etf_flows')
      .delete()
      .lt('flow_date', new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10));

    console.log(`etf flows sync: ${upserted}/${rows.length}`);
    return json({ ok: true, upserted, total: rows.length });
  } catch (error) {
    console.error('etf-flows-sync error', error);
    return json({ ok: false, error: String(error) });
  }
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
