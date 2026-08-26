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

  // BingX's own docs (GET /openApi/swap/v1/trade/positionHistory) cap
  // pageSize at 100 - we were sending 1000 (the order-history endpoints'
  // limit), an out-of-spec value the API may have been silently clamping
  // or mishandling.
  const positionHistoryPageSize = 100;

  const trades = [];
  for (const symbol of symbols) {
    let positions;
    try {
      positions = await paginate(
        (cursor) => client.fetchPositionHistory(symbol, cursor, positionHistoryPageSize, until ? { until } : {}),
        { since, until, limit: positionHistoryPageSize, getTimestamp: positionTimestamp }
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

  // fetchPositionHistory keeps only one record per symbol/side "slot" and
  // silently overwrites it when the same symbol is closed and reopened
  // again in the requested window - confirmed live (a real BTC close with
  // -105.02 PnL never appeared, even after fixing pagination and page
  // size). GET /openApi/swap/v2/user/income with incomeType=REALIZED_PNL
  // is BingX's ledger of realized-PnL events and does NOT have this
  // problem - every close, including ones positionHistory drops, shows up
  // there with its exact PnL (confirmed live: the missing -105.02 BTC
  // close is present in this ledger). Use it as the authoritative list of
  // "a position closed here" and only fall back to nearby order data for
  // entry/exit price when positionHistory didn't already cover it.
  const coveredKeys = new Set(trades.map((tr) => fillRecoveryKey(tr.symbol, tr.timestamp)));
  const recoveredTrades = [];
  try {
    const incomeRecords = await paginate(
      async (cursor) => {
        const resp = await client.swapV2PrivateGetUserIncome({
          incomeType: 'REALIZED_PNL',
          startTime: cursor,
          endTime: until,
          limit: 1000,
        });
        return resp?.data ?? [];
      },
      { since, until, limit: 1000, getTimestamp: (r) => Number(r.time ?? 0) }
    );

    if (debug) debug.swap.incomeLedgerCount = incomeRecords.length;

    for (const rec of incomeRecords) {
      const pnl = Number(rec.income ?? 0);
      if (!pnl) continue;

      const ts = Number(rec.time ?? 0);
      const unifiedSymbol = client.safeSymbol(rec.symbol, undefined, undefined, 'swap');
      const key = fillRecoveryKey(unifiedSymbol, ts);
      if (coveredKeys.has(key)) continue; // positionHistory already has this close
      coveredKeys.add(key);

      // positionHistory is the only source of a real entry price for this
      // close (that's why we're here - it doesn't have this record). Best
      // effort: use the nearest closed order for this symbol as a stand-in
      // for exit price/quantity; entry price is left equal to exit price,
      // same degraded-precision fallback already used for spot/import
      // edge cases elsewhere in this adapter.
      const nearOrder = rawOrders
        .filter((o) => o.symbol === unifiedSymbol && Math.abs(orderTimestamp(o) - ts) <= 60000)
        .sort((a, b) => Math.abs(orderTimestamp(a) - ts) - Math.abs(orderTimestamp(b) - ts))[0];

      const exitPrice = nearOrder ? Number(nearOrder.average ?? nearOrder.price ?? 0) : 0;
      const quantity = nearOrder ? Number(nearOrder.filled ?? nearOrder.amount ?? 0) : 0;
      // The CLOSING order's side is the opposite of the position side - a
      // BUY order closes a SHORT, a SELL order closes a LONG.
      const side = nearOrder ? (nearOrder.side === 'buy' ? 'short' : 'long') : (pnl < 0 ? 'long' : 'short');

      recoveredTrades.push({
        id: String(rec.tradeId ?? rec.tranId ?? `${rec.symbol}_${ts}`),
        symbol: unifiedSymbol,
        side,
        entryPrice: exitPrice,
        exitPrice,
        quantity,
        fee: 0,
        openTimestamp: ts,
        timestamp: ts,
        orderId: nearOrder ? String(nearOrder.id ?? '') : '',
        exchange: 'bingx',
        marketType: 'swap',
        realizedPnl: pnl,
        leverage: undefined,
        positionSide: undefined,
      });
    }
  } catch (error) {
    if (debug) debug.swap.incomeLedgerError = error instanceof Error ? error.message : String(error);
  }

  if (debug) debug.swap.recoveredFromIncomeLedger = recoveredTrades.length;

  return [...trades, ...recoveredTrades];
}

// Dedup key for cross-checking a positionHistory-derived close against an
// income-ledger-derived close of the same real event. Bucketed to 5s: the
// two endpoints report the same close a couple seconds apart, never
// identically.
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
