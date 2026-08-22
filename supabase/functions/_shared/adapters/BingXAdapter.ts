import { BaseExchangeAdapter } from './BaseExchangeAdapter.ts';
import type {
  ExchangeCredentials,
  Trade,
  Balance,
  Order,
  Deposit,
  Withdrawal,
  FetchOptions,
} from './types.ts';

// ── Why CCXT instead of hand-rolled request signing ────────────────────────
// The previous version of this adapter hand-signed raw BingX REST calls
// (HMAC-SHA256 over a query string) against endpoint paths that were never
// verified against BingX's actual API and only ever covered the SPOT
// market. BingX perpetual futures ("swap") trades live under a completely
// different endpoint family this adapter never called — for an account that
// trades perps only (the common case), that meant sync always returned zero
// trades with no explanation.
//
// CCXT (https://github.com/ccxt/ccxt) ships a maintained, tested BingX
// driver that unifies spot + swap (USDT-M perpetual futures) behind one
// `fetchMyTrades` call, and the same driver interface already covers most
// of the other exchanges this app supports (Binance, Bybit, Coinbase,
// Kraken, Bitfinex, MEXC, KuCoin, OKX, Gate.io, Bitstamp), so this stops
// being a "reverse-engineer one more exchange's API" problem.
//
// npm:ccxt is imported via Deno's native npm specifier support (no
// package.json needed in the edge function). See docs/EXCHANGE_API_SYNC_FIXES.md
// section 2 for the full rationale and rollback plan if this proves
// impractical in the edge runtime (bundle size / cold start).
//
// ⚠️ VERIFY BEFORE SHIPPING: this has not been exercised against a live
// BingX account yet. Test with a real read-only API key
// (bingx.com/en/accounts/api) before trusting it in production — see the
// "Test the adapter" step in docs/EXCHANGE_API_SYNC_FIXES.md.
import ccxt from 'npm:ccxt@^4';

type BingxMarketType = 'spot' | 'swap';

export class BingXAdapter extends BaseExchangeAdapter {
  protected baseUrl = 'https://open-api.bingx.com'; // unused directly; ccxt manages URLs
  protected name = 'BingX';
  protected rateLimitDelay = 150;

  private client: any;

  constructor(credentials: ExchangeCredentials) {
    super(credentials);
    this.client = new ccxt.bingx({
      apiKey: credentials.apiKey,
      secret: credentials.apiSecret,
      enableRateLimit: true,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // fetchBalance is cheap and works regardless of which markets the
      // account actually trades — a much better connectivity check than
      // hitting a spot-only endpoint (the old version's mistake, which
      // made "connected" misleading for perp-only accounts).
      // Retried: a single transient TLS/DNS blip reaching BingX from the
      // edge runtime should not fail the whole connection check.
      await this.retryRequest(() => this.client.fetchBalance({ type: 'spot' }), 2, 500);
      this.lastConnectionError = undefined;
      return true;
    } catch (error) {
      this.lastConnectionError = classifyConnectionError(error);
      console.error(
        `BingX testConnection failed (${this.lastConnectionError.type}):`,
        this.lastConnectionError.message
      );
      return false;
    }
  }

  /**
   * Fetches trades across the requested market types (default: spot + swap).
   * Each returned trade is tagged with `marketType` so the caller can map it
   * to the correct `trade_type` column ('spot' | 'futures') on import —
   * never hardcode this.
   */
  async fetchTrades(options?: FetchOptions & { marketTypes?: BingxMarketType[] }): Promise<Trade[]> {
    const marketTypes = options?.marketTypes ?? ['spot', 'swap'];
    const since = options?.startTime ? options.startTime.getTime() : undefined;
    const limit = Math.min(options?.limit ?? 500, 1000);
    const until = options?.endTime ? options.endTime.getTime() : undefined;

    const allTrades: Trade[] = [];

    for (const marketType of marketTypes) {
      try {
        await this.client.loadMarkets();
        const rawTrades = await this.retryRequest(() =>
          this.client.fetchMyTrades(undefined, since, limit, {
            type: marketType,
            ...(until ? { until } : {}),
          })
        );

        for (const t of rawTrades) {
          allTrades.push({
            id: String(t.id ?? t.order ?? ''),
            symbol: t.symbol,
            side: t.side, // 'buy' | 'sell'
            price: Number(t.price ?? 0),
            quantity: Number(t.amount ?? 0),
            fee: Number(t.fee?.cost ?? 0),
            feeCurrency: t.fee?.currency,
            timestamp: t.timestamp ?? Date.now(),
            orderId: t.order ? String(t.order) : undefined,
            exchange: 'bingx',
            marketType,
          });
        }
      } catch (error) {
        // Don't let one market type's failure (e.g. account has no swap
        // permission) silently return zero trades for the whole sync —
        // log it distinctly so it's diagnosable from function logs.
        console.error(
          `BingX fetchTrades failed for marketType=${marketType}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return allTrades;
  }

  async fetchBalances(): Promise<Balance[]> {
    try {
      const balance = await this.client.fetchBalance({ type: 'spot' });
      const totals = balance.total ?? {};
      const free = balance.free ?? {};
      const used = balance.used ?? {};

      return Object.keys(totals)
        .filter((asset) => Number(totals[asset]) > 0)
        .map((asset) => ({
          exchange: 'bingx',
          currency: asset,
          free: Number(free[asset] ?? 0),
          locked: Number(used[asset] ?? 0),
          total: Number(totals[asset] ?? 0),
        }));
    } catch (error) {
      console.error('Error fetching BingX balances:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async fetchOrders(_options?: FetchOptions): Promise<Order[]> {
    // Not wired yet — out of scope for the sync-trades fix. fetchTrades()
    // (fills) is what drives trade import, not order history.
    return [];
  }

  async fetchDeposits(_options?: FetchOptions): Promise<Deposit[]> {
    return [];
  }

  async fetchWithdrawals(_options?: FetchOptions): Promise<Withdrawal[]> {
    return [];
  }
}
