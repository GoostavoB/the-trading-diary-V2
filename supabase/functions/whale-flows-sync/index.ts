// Fluxo de baleias BTC ↔ corretoras (actor muhammetakkurtt/crypto-wallet-
// transfers-swaps-scraper no Apify, dados estilo Arkham). Diferente dos outros
// syncs, este DISPARA o actor na hora (run-sync, ~20s) — não precisa de
// schedule no console do Apify. Guarda só transações ≥$1M das últimas 24h.
// Secret: APIFY_TOKEN (o mesmo). Actor configurável via APIFY_WHALE_ACTOR_ID.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const DEFAULT_ACTOR = 'muhammetakkurtt~crypto-wallet-transfers-swaps-scraper';
const EXCHANGES: Record<string, string> = {
  binance: 'Binance',
  coinbase: 'Coinbase',
  kraken: 'Kraken',
};
const MIN_USD = 1_000_000;

interface ArkhamSide {
  entity?: { id?: string; name?: string };
}
interface TransferItem {
  txid?: string;
  transactionHash?: string;
  unitValue?: number;
  historicalUSD?: number;
  blockTimestamp?: string;
  toAddress?: ArkhamSide;
  fromAddresses?: Array<{ address?: ArkhamSide }>;
}

function exchangeOf(side?: ArkhamSide): string | null {
  const key = (side?.entity?.id ?? side?.entity?.name ?? '').toLowerCase();
  for (const [id, label] of Object.entries(EXCHANGES)) {
    if (key.includes(id)) return label;
  }
  return null;
}

Deno.serve(async (_req) => {
  const token = Deno.env.get('APIFY_TOKEN');
  if (!token) {
    console.error('APIFY_TOKEN não configurado');
    return json({ ok: false, error: 'missing APIFY_TOKEN' });
  }
  const actorId = Deno.env.get('APIFY_WHALE_ACTOR_ID') ?? DEFAULT_ACTOR;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items` +
      `?token=${encodeURIComponent(token)}&timeout=120&maxTotalChargeUsd=0.10&clean=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base: Object.keys(EXCHANGES).join(','),
          dataType: 'transfers',
          flow: 'all',
          chains: ['bitcoin'],
          timeGte: '1 day',
          usdGte: MIN_USD,
          maxItems: 80,
          sortKey: 'usd',
          sortDir: 'desc',
          proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: [] },
        }),
        signal: AbortSignal.timeout(140_000),
      },
    );
    if (!res.ok) {
      console.error('Apify run-sync failed', res.status, await res.text().catch(() => ''));
      return json({ ok: false, error: `apify ${res.status}` });
    }
    const items: TransferItem[] = await res.json();

    let inserted = 0, skipped = 0;
    for (const item of items ?? []) {
      const txId = item.txid ?? item.transactionHash;
      const usd = Number(item.historicalUSD);
      const amount = Number(item.unitValue);
      if (!txId || !Number.isFinite(usd) || usd < MIN_USD || !item.blockTimestamp) {
        skipped++;
        continue;
      }

      const toEx = exchangeOf(item.toAddress);
      const fromEx = (item.fromAddresses ?? [])
        .map((f) => exchangeOf(f.address))
        .find((e) => e !== null) ?? null;

      // Corretora nos dois lados = transferência interna/entre corretoras: ruído.
      if ((toEx && fromEx) || (!toEx && !fromEx)) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from('whale_flows').upsert({
        tx_id: txId,
        symbol: 'BTC',
        direction: toEx ? 'in' : 'out',
        exchange: (toEx ?? fromEx)!,
        amount: Number.isFinite(amount) ? amount : 0,
        usd,
        happened_at: item.blockTimestamp,
      }, { onConflict: 'tx_id', ignoreDuplicates: true });
      if (error) console.error('upsert failed', error.message);
      else inserted++;
    }

    await supabase.from('whale_flows')
      .delete()
      .lt('happened_at', new Date(Date.now() - 7 * 86_400_000).toISOString());

    console.log(`whale sync: ${inserted} gravadas, ${skipped} ignoradas de ${items?.length ?? 0}`);
    return json({ ok: true, inserted, skipped, total: items?.length ?? 0 });
  } catch (error) {
    console.error('whale-flows-sync error', error);
    return json({ ok: false, error: String(error) });
  }
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
