import { BaseExchangeAdapter } from './BaseExchangeAdapter.ts';
import type { ExchangeCredentials, Trade, Balance, Order, Deposit, Withdrawal } from './types.ts';
import { BinanceAdapter } from './BinanceAdapter.ts';
import { BybitAdapter } from './BybitAdapter.ts';
import { CoinbaseAdapter } from './CoinbaseAdapter.ts';
import { KrakenAdapter } from './KrakenAdapter.ts';
import { BitfinexAdapter } from './BitfinexAdapter.ts';
import { BingXAdapter } from './BingXAdapter.ts';
import { MEXCAdapter } from './MEXCAdapter.ts';
import { KuCoinAdapter } from './KuCoinAdapter.ts';
import { OKXAdapter } from './OKXAdapter.ts';
import { GateioAdapter } from './GateioAdapter.ts';
import { BitstampAdapter } from './BitstampAdapter.ts';

export const SUPPORTED_EXCHANGES = [
  'binance',
  'bybit',
  'coinbase',
  'kraken',
  'bitfinex',
  'bingx',
  'mexc',
  'kucoin',
  'okx',
  'gateio',
  'bitstamp',
] as const;

export type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

export class ExchangeService {
  private adapters: Map<string, BaseExchangeAdapter> = new Map();

  private createAdapter(exchange: string, credentials: ExchangeCredentials): BaseExchangeAdapter {
    const exchangeLower = exchange.toLowerCase();

    switch (exchangeLower) {
      case 'binance':
        return new BinanceAdapter(credentials);
      case 'bybit':
        return new BybitAdapter(credentials);
      case 'coinbase':
        return new CoinbaseAdapter(credentials);
      case 'kraken':
        return new KrakenAdapter(credentials);
      case 'bitfinex':
        return new BitfinexAdapter(credentials);
      case 'bingx':
        return new BingXAdapter(credentials);
      case 'mexc':
        return new MEXCAdapter(credentials);
      case 'kucoin':
        return new KuCoinAdapter(credentials);
      case 'okx':
        return new OKXAdapter(credentials);
      case 'gateio':
      case 'gate.io':
        return new GateioAdapter(credentials);
      case 'bitstamp':
        return new BitstampAdapter(credentials);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  async initializeExchange(exchange: string, credentials: ExchangeCredentials): Promise<boolean> {
    try {
      const adapter = this.createAdapter(exchange, credentials);
      const isConnected = await adapter.testConnection();

      if (isConnected) {
        this.adapters.set(exchange.toLowerCase(), adapter);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to initialize ${exchange}:`, error);
      return false;
    }
  }

  getAdapter(exchange: string): BaseExchangeAdapter | undefined {
    return this.adapters.get(exchange.toLowerCase());
  }

  getExchangeName(exchange: string): string | undefined {
    const adapter = this.getAdapter(exchange);
    return adapter?.getName();
  }

  async syncExchange(
    exchange: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      tradingType?: 'spot' | 'futures' | 'both';
      symbol?: string;
    }
  ): Promise<{
    success: boolean;
    trades?: Trade[];
    error?: string;
  }> {
    const adapter = this.getAdapter(exchange);

    if (!adapter) {
      return {
        success: false,
        error: `Exchange ${exchange} not initialized`,
      };
    }

    try {
      let trades: Trade[] = [];

      if (options?.tradingType === 'futures' && typeof (adapter as any).fetchFuturesTrades === 'function') {
        trades = await (adapter as any).fetchFuturesTrades({
          startTime: options?.startDate,
          endTime: options?.endDate,
          symbol: options?.symbol,
        });
      } else {
        trades = await adapter.fetchTrades({
          startTime: options?.startDate,
          endTime: options?.endDate,
          symbol: options?.symbol,
        });
      }

      return { success: true, trades };
    } catch (error) {
      console.error(`Error syncing ${exchange}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncOrders(
    exchange: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    success: boolean;
    orders?: Order[];
    error?: string;
  }> {
    const adapter = this.getAdapter(exchange);

    if (!adapter) {
      return {
        success: false,
        error: `Exchange ${exchange} not initialized`,
      };
    }

    try {
      const orders = await adapter.fetchOrders({
        startTime: options?.startDate,
        endTime: options?.endDate,
      });

      return { success: true, orders };
    } catch (error) {
      console.error(`Error syncing orders from ${exchange}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncDeposits(
    exchange: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    success: boolean;
    deposits?: Deposit[];
    error?: string;
  }> {
    const adapter = this.getAdapter(exchange);

    if (!adapter) {
      return {
        success: false,
        error: `Exchange ${exchange} not initialized`,
      };
    }

    try {
      const deposits = await adapter.fetchDeposits({
        startTime: options?.startDate,
        endTime: options?.endDate,
      });

      return { success: true, deposits };
    } catch (error) {
      console.error(`Error syncing deposits from ${exchange}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncWithdrawals(
    exchange: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    success: boolean;
    withdrawals?: Withdrawal[];
    error?: string;
  }> {
    const adapter = this.getAdapter(exchange);

    if (!adapter) {
      return {
        success: false,
        error: `Exchange ${exchange} not initialized`,
      };
    }

    try {
      const withdrawals = await adapter.fetchWithdrawals({
        startTime: options?.startDate,
        endTime: options?.endDate,
      });

      return { success: true, withdrawals };
    } catch (error) {
      console.error(`Error syncing withdrawals from ${exchange}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async performHealthCheck(exchange: string): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    lastError?: string;
  } | null> {
    const adapter = this.getAdapter(exchange);

    if (!adapter) {
      return null;
    }

    return await adapter.healthCheck();
  }

  async performFuturesHealthCheck(exchange: string): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    lastError?: string;
  } | null> {
    const adapter = this.getAdapter(exchange);
    if (!adapter) return null;

    const start = Date.now();
    try {
      if (typeof (adapter as any).testFuturesConnection === 'function') {
        const ok = await (adapter as any).testFuturesConnection();
        const latency = Date.now() - start;
        return { status: ok ? (latency > 3000 ? 'degraded' : 'healthy') : 'down', latency };
      }
      if (typeof (adapter as any).fetchFuturesTrades === 'function') {
        // Minimal probe over last 24h
        await (adapter as any).fetchFuturesTrades({ startTime: new Date(Date.now() - 24*60*60*1000), limit: 1 });
        const latency = Date.now() - start;
        return { status: latency > 3000 ? 'degraded' : 'healthy', latency };
      }
      return { status: 'down', latency: Date.now() - start, lastError: 'Futures not supported by adapter' };
    } catch (e) {
      return {
        status: 'down',
        latency: Date.now() - start,
        lastError: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
