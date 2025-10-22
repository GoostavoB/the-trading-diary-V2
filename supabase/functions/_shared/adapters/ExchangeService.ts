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

  async syncExchange(
    exchange: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
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
      const trades = await adapter.fetchTrades({
        startTime: options?.startDate,
        endTime: options?.endDate,
      });

      return { success: true, trades };
    } catch (error) {
      console.error(`Error syncing ${exchange}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
