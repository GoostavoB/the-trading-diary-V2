// Native BingX handling — port of
// supabase/functions/_shared/adapters/BingXAdapter.ts to run against real
// npm ccxt on a normal Node process instead of Deno's npm: compat shim on
// Supabase Edge Functions. Same fetchClosedOrders-based approach (BingX's
// fetchMyTrades requires a symbol and can't do "sync everything"); see the
// original adapter file for the full rationale.

import ccxt from 'ccxt';

export async function testConnection({ apiKey, apiSecret }) {
  const client = new ccxt.bingx({ apiKey, secret: apiSecret, enableRateLimit: true });
  // fetchBalance is cheap and works regardless of which markets the account
  // actually trades — better than hitting a spot-only endpoint for a
  // perp-only account.
  await client.fetchBalance({ type: 'spot' });
  return true;
}

export async function fetchTrades({ apiKey, apiSecret, startTime, endTime, marketTypes }) {
  const client = new ccxt.bingx({ apiKey, secret: apiSecret, enableRateLimit: true });

  const types = marketTypes && marketTypes.length > 0 ? marketTypes : ['spot', 'swap'];
  const since = startTime ? new Date(startTime).getTime() : undefined;
  const until = endTime ? new Date(endTime).getTime() : undefined;
  const limit = 1000;

  const allTrades = [];
  const errors = [];

  for (const marketType of types) {
    try {
      const rawOrders = await client.fetchClosedOrders(undefined, since, limit, {
        type: marketType,
        ...(until ? { until } : {}),
      });

      for (const o of rawOrders) {
        const filled = Number(o.filled ?? 0);
        if (filled <= 0) continue;

        const info = o.info ?? {};
        const realizedPnl = info.profit !== undefined ? Number(info.profit) : undefined;
        const leverage = info.leverage
          ? Number(String(info.leverage).replace(/[^0-9.]/g, ''))
          : undefined;

        allTrades.push({
          id: String(o.id ?? ''),
          symbol: o.symbol,
          side: o.side,
          price: Number(o.average ?? o.price ?? 0),
          quantity: filled,
          fee: Math.abs(Number(o.fee?.cost ?? 0)),
          feeCurrency: o.fee?.currency,
          timestamp: o.lastUpdateTimestamp ?? o.timestamp ?? Date.now(),
          orderId: String(o.id ?? ''),
          exchange: 'bingx',
          marketType,
          realizedPnl,
          leverage,
          positionSide: info.positionSide,
        });
      }
    } catch (error) {
      errors.push(`${marketType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Only fail the whole fetch if every market type errored — one market
  // type lacking permission (e.g. no swap access) shouldn't zero out spot.
  if (allTrades.length === 0 && errors.length === types.length) {
    throw new Error(`BingX fetchTrades failed for all market types: ${errors.join('; ')}`);
  }

  return allTrades;
}
