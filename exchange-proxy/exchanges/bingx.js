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
async function fetchSpotTrades(client, { since, until, limit }, debug) {
  const rawOrders = await paginate(
    (cursor) =>
      client.fetchClosedOrders(undefined, cursor, limit, {
        type: 'spot',
        ...(until ? { until } : {}),
      }),
    { since, until, limit, getTimestamp: orderTimestamp }
  );

  if (debug) {
    debug.spot = {
      rawOrderCount: rawOrders.length,
      rawLatestTimestamp: rawOrders.length ? new Date(Math.max(...rawOrders.map(orderTimestamp))).toISOString() : null,
    };
  }

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
async function fetchSwapTrades(client, { since, until, limit }, debug) {
  const rawOrders = await paginate(
    (cursor) =>
      client.fetchClosedOrders(undefined, cursor, limit, {
        type: 'swap',
        ...(until ? { until } : {}),
      }),
    { since, until, limit, getTimestamp: orderTimestamp }
  );
  const symbols = [...new Set(rawOrders.map((o) => o.symbol).filter(Boolean))];

  if (debug) {
    debug.swap = {
      rawClosedOrderCount: rawOrders.length,
      rawClosedOrderLatestTimestamp: rawOrders.length ? new Date(Math.max(...rawOrders.map(orderTimestamp))).toISOString() : null,
      symbols,
      perSymbol: {},
    };
  }

  const trades = [];
  for (const symbol of symbols) {
    let positions;
    try {
      positions = await paginate(
        (cursor) => client.fetchPositionHistory(symbol, cursor, limit, until ? { until } : {}),
        { since, until, limit, getTimestamp: positionTimestamp }
      );
    } catch (error) {
      if (debug) {
        debug.swap.perSymbol[symbol] = { error: error instanceof Error ? error.message : String(error) };
      }
      continue; // e.g. inverse contracts aren't supported by this endpoint
    }

    if (debug) {
      const withExit = positions.filter((p) => Number(p.info?.avgClosePrice ?? 0) > 0);
      debug.swap.perSymbol[symbol] = {
        rawPositionCount: positions.length,
        closedPositionCount: withExit.length,
        rawLatestTimestamp: positions.length ? new Date(Math.max(...positions.map(positionTimestamp))).toISOString() : null,
        last5Raw: positions.slice(-5).map((p) => ({
          timestamp: new Date(positionTimestamp(p)).toISOString(),
          avgClosePrice: p.info?.avgClosePrice,
          avgPrice: p.info?.avgPrice,
          positionAmt: p.info?.positionAmt,
          closePositionAmt: p.info?.closePositionAmt,
          positionId: p.info?.positionId,
        })),
      };
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

  // fetchPositionHistory confirmed (via BingX's own API docs plus a live
  // side-by-side check against the account's real trade log) to silently
  // drop or merge closes when the same symbol is opened and closed again in
  // quick succession - it looks like one "position" slot per symbol/side
  // gets overwritten rather than each close being kept as its own record.
  // BingX's per-fill trade history (ccxt: fetchMyTrades) doesn't have that
  // grouping - every fill, including its own realizedPnl, is its own record.
  // Cross-check against it and add back anything genuinely missing instead
  // of trusting positionHistory to be complete.
  const coveredKeys = new Set(trades.map((tr) => fillRecoveryKey(tr.symbol, tr.timestamp)));
  const recoveredTrades = [];
  const fillErrors = [];
  // BingX's fetchMyTrades requires a symbol argument - it throws outright
  // with undefined. Reuse the symbol list from fetchClosedOrders above.
  for (const symbol of symbols) {
    try {
      const rawFills = await paginate(
        (cursor) =>
          client.fetchMyTrades(symbol, cursor, limit, {
            type: 'swap',
            ...(until ? { until } : {}),
          }),
        { since, until, limit, getTimestamp: (t) => t.timestamp ?? 0 }
      );

      for (const t of rawFills) {
        const info = t.info ?? {};
        const pnl = Number(info.realizedPnl ?? info.realisedProfit ?? info.profit ?? 0);
        if (!pnl) continue; // opening fill, or no PnL to report - not a closed trade by itself

        const ts = t.timestamp ?? Date.now();
        const key = fillRecoveryKey(t.symbol, ts);
        if (coveredKeys.has(key)) continue; // already have this close from positionHistory

        coveredKeys.add(key);
        recoveredTrades.push({
          id: String(t.id ?? info.tradeId ?? info.orderId ?? `${t.symbol}_${ts}`),
          symbol: t.symbol,
          // Fill side is the execution direction, not the position side - a
          // BUY fill with realized PnL closed a SHORT; a SELL fill with
          // realized PnL closed a LONG.
          side: t.side === 'buy' ? 'short' : 'long',
          entryPrice: Number(t.price ?? 0),
          exitPrice: Number(t.price ?? 0),
          quantity: Number(t.amount ?? 0),
          fee: Math.abs(Number(t.fee?.cost ?? 0)),
          openTimestamp: ts,
          timestamp: ts,
          orderId: t.order ? String(t.order) : String(info.orderId ?? ''),
          exchange: 'bingx',
          marketType: 'swap',
          realizedPnl: pnl,
          leverage: undefined,
          positionSide: undefined,
        });
      }
    } catch (error) {
      fillErrors.push(`${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (debug) {
    debug.swap.recoveredFromFills = recoveredTrades.length;
    if (fillErrors.length) debug.swap.fillRecoveryErrors = fillErrors;
  }

  return [...trades, ...recoveredTrades];
}

// Dedup key for cross-checking a positionHistory-derived close against a
// fill-derived close of the same real event. Bucketed to 5s: the two
// endpoints report the same close a couple seconds apart, never identically.
function fillRecoveryKey(symbol, timestamp) {
  return `${symbol}|${Math.round(timestamp / 5000)}`;
}

export async function fetchTrades({ apiKey, apiSecret, startTime, endTime, marketTypes }) {
  const client = new ccxt.bingx({ apiKey, secret: apiSecret, enableRateLimit: true });
  const types = marketTypes && marketTypes.length > 0 ? marketTypes : ['spot', 'swap'];
  const since = startTime ? new Date(startTime).getTime() : undefined;
  const until = endTime ? new Date(endTime).getTime() : undefined;
  const limit = 1000;

  const allTrades = [];
  const errors = [];
  const debug = {
    since: since ? new Date(since).toISOString() : null,
    until: until ? new Date(until).toISOString() : null,
    types,
  };

  for (const marketType of types) {
    try {
      const trades = marketType === 'swap'
        ? await fetchSwapTrades(client, { since, until, limit }, debug)
        : await fetchSpotTrades(client, { since, until, limit }, debug);
      allTrades.push(...trades);
    } catch (error) {
      errors.push(`${marketType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (allTrades.length === 0 && errors.length === types.length) {
    throw new Error(`BingX fetchTrades failed for all market types: ${errors.join('; ')}`);
  }

  allTrades._debug = debug;
  return allTrades;
}
