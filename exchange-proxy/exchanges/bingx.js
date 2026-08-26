import ccxt from 'ccxt';

export async function testConnection({ apiKey, apiSecret }) {
  const client = new ccxt.bingx({ apiKey, secret: apiSecret, enableRateLimit: true });
  await client.fetchBalance({ type: 'spot' });
  return true;
}

// A single fetchClosedOrders/fetchPositionHistory call is capped at `limit`
// results. An account with more activity than that in the requested window
// would silently lose everything after the first page - including the most
// recent trades - if we only ever fetched once. Page forward from `since`
// until a page comes back short or we pass `until`.
const MAX_PAGES = 20; // safety cap: 20 * 1000 = 20k records per call site

async function paginate(fetchPage, { since, until, limit, getTimestamp }) {
  const all = [];
  let cursor = since;

  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await fetchPage(cursor);
    if (!batch || batch.length === 0) break;

    all.push(...batch);

    const lastTs = getTimestamp(batch[batch.length - 1]);
    const reachedEnd = batch.length < limit || (until !== undefined && lastTs >= until);
    if (reachedEnd) break;

    // Advance past the last record so the next page doesn't repeat it.
    cursor = lastTs + 1;
  }

  return all;
}

const orderTimestamp = (o) => o.lastUpdateTimestamp ?? o.timestamp ?? 0;
const positionTimestamp = (p) => Number(p.info?.updateTime ?? p.lastUpdateTimestamp ?? p.timestamp ?? 0);

// Spot has no leveraged "position" to close - every filled order is its own trade.
async function fetchSpotTrades(client, { since, until, limit }) {
  const rawOrders = await paginate(
    (cursor) =>
      client.fetchClosedOrders(undefined, cursor, limit, {
        type: 'spot',
        ...(until ? { until } : {}),
      }),
    { since, until, limit, getTimestamp: orderTimestamp }
  );

  const trades = [];
  for (const o of rawOrders) {
    const filled = Number(o.filled ?? 0);
    if (filled <= 0) continue;

    const price = Number(o.average ?? o.price ?? 0);
    const ts = orderTimestamp(o) || Date.now();

    trades.push({
      id: String(o.id ?? ''),
      symbol: o.symbol,
      side: o.side === 'buy' ? 'long' : 'short',
      entryPrice: price,
      exitPrice: price,
      quantity: filled,
      fee: Math.abs(Number(o.fee?.cost ?? 0)),
      openTimestamp: ts,
      timestamp: ts,
      orderId: String(o.id ?? ''),
      exchange: 'bingx',
      marketType: 'spot',
      realizedPnl: undefined,
      leverage: undefined,
      positionSide: undefined,
    });
  }
  return trades;
}

// Swap/futures orders are legs of a leveraged position, not standalone trades.
// fetchClosedOrders returns BOTH the opening leg (no realized PnL yet) and the
// closing leg (has PnL) as separate rows with the same fill price hardcoded as
// both "entry" and "exit" - that's why half the trades showed up with blank
// P&L and no real entry/exit distinction. fetchPositionHistory asks BingX for
// the actual round-trip: real entry price (avgPrice), real exit price
// (avgClosePrice), real realized PnL (realisedProfit), per closed position.
async function fetchSwapTrades(client, { since, until, limit }) {
  const rawOrders = await paginate(
    (cursor) =>
      client.fetchClosedOrders(undefined, cursor, limit, {
        type: 'swap',
        ...(until ? { until } : {}),
      }),
    { since, until, limit, getTimestamp: orderTimestamp }
  );
  const symbols = [...new Set(rawOrders.map((o) => o.symbol).filter(Boolean))];

  const trades = [];
  for (const symbol of symbols) {
    let positions;
    try {
      positions = await paginate(
        (cursor) => client.fetchPositionHistory(symbol, cursor, limit, until ? { until } : {}),
        { since, until, limit, getTimestamp: positionTimestamp }
      );
    } catch {
      continue; // e.g. inverse contracts aren't supported by this endpoint
    }

    for (const p of positions) {
      const info = p.info ?? {};
      const entryPrice = Number(info.avgPrice ?? p.entryPrice ?? 0);
      const exitPrice = Number(info.avgClosePrice ?? 0);
      if (!exitPrice) continue; // not actually closed yet - no exit to report

      const quantity = Number(info.closePositionAmt ?? info.positionAmt ?? p.contracts ?? 0);
      const openTs = Number(info.openTime ?? p.timestamp ?? 0);
      const closeTs = Number(info.updateTime ?? p.lastUpdateTimestamp ?? openTs);
      const positionSide = info.positionSide ?? p.side;

      trades.push({
        id: String(info.positionId ?? `${symbol}_${closeTs}`),
        symbol,
        side: String(positionSide).toUpperCase() === 'SHORT' ? 'short' : 'long',
        entryPrice,
        exitPrice,
        quantity,
        fee: Math.abs(Number(info.positionCommission ?? 0)),
        openTimestamp: openTs || closeTs,
        timestamp: closeTs || openTs,
        orderId: String(info.positionId ?? ''),
        exchange: 'bingx',
        marketType: 'swap',
        realizedPnl: Number(info.realisedProfit ?? p.realizedPnl ?? 0),
        leverage: info.leverage !== undefined ? Number(info.leverage) : undefined,
        positionSide,
      });
    }
  }
  return trades;
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
      const trades = marketType === 'swap'
        ? await fetchSwapTrades(client, { since, until, limit })
        : await fetchSpotTrades(client, { since, until, limit });
      allTrades.push(...trades);
    } catch (error) {
      errors.push(`${marketType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (allTrades.length === 0 && errors.length === types.length) {
    throw new Error(`BingX fetchTrades failed for all market types: ${errors.join('; ')}`);
  }

  return allTrades;
}
