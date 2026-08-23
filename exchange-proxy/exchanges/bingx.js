import ccxt from 'ccxt';

export async function testConnection({ apiKey, apiSecret }) {
  const client = new ccxt.bingx({ apiKey, secret: apiSecret, enableRateLimit: true });
  await client.fetchBalance({ type: 'spot' });
  return true;
}

// Spot has no leveraged "position" to close - every filled order is its own trade.
async function fetchSpotTrades(client, { since, until, limit }) {
  const rawOrders = await client.fetchClosedOrders(undefined, since, limit, {
    type: 'spot',
    ...(until ? { until } : {}),
  });

  const trades = [];
  for (const o of rawOrders) {
    const filled = Number(o.filled ?? 0);
    if (filled <= 0) continue;

    const price = Number(o.average ?? o.price ?? 0);
    const ts = o.lastUpdateTimestamp ?? o.timestamp ?? Date.now();

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
  const rawOrders = await client.fetchClosedOrders(undefined, since, limit, {
    type: 'swap',
    ...(until ? { until } : {}),
  });
  const symbols = [...new Set(rawOrders.map((o) => o.symbol).filter(Boolean))];

  const trades = [];
  for (const symbol of symbols) {
    let positions;
    try {
      positions = await client.fetchPositionHistory(symbol, since, limit, until ? { until } : {});
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
