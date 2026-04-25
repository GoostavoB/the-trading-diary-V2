import { BaseExchangeAdapter } from '../BaseExchangeAdapter';
import type { 
  ExchangeCredentials, 
  Trade, 
  Balance, 
  Order, 
  Deposit, 
  Withdrawal,
  FetchOptions 
} from '../types';
import CryptoJS from 'crypto-js';

// Bitstamp API Response Types
interface BitstampBalance {
  [key: string]: string; // Dynamic keys like 'btc_available', 'btc_balance', etc.
}

interface BitstampTransaction {
  id: number;
  type: string; // '0' = deposit, '1' = withdrawal, '2' = market trade
  datetime: string;
  btc?: string;
  usd?: string;
  btc_usd?: string;
  fee?: string;
  order_id?: number;
  [key: string]: any; // Dynamic currency fields
}

interface BitstampOrder {
  id: string;
  datetime: string;
  type: string; // '0' = buy, '1' = sell
  price: string;
  amount: string;
  currency_pair: string;
  status?: string;
}

interface BitstampOpenOrder {
  id: string;
  datetime: string;
  type: string; // '0' = buy, '1' = sell
  price: string;
  amount: string;
  currency_pair: string;
}

type BitstampUserTransaction = BitstampTransaction

/**
 * Bitstamp Exchange Adapter
 * API Documentation: https://www.bitstamp.net/api/
 * 
 * Features:
 * - Spot trading only
 * - HMAC SHA256 authentication with unique format
 * - Rate limit: 8000 requests per 10 minutes (conservative: 100ms delay)
 * 
 * Note: Bitstamp uses a unique auth format where customer ID is required
 */
export class BitstampAdapter extends BaseExchangeAdapter {
  protected baseUrl = 'https://www.bitstamp.net/api/v2';
  protected name = 'Bitstamp';
  
  // Rate limiting: 8000 requests per 10 minutes (we'll be conservative)
  protected rateLimitDelay = 100; // 100ms between requests

  private customerId: string;

  constructor(credentials: ExchangeCredentials) {
    super(credentials);
    
    // Bitstamp requires customer ID - we'll store it in apiPassphrase field
    this.customerId = credentials.apiPassphrase || '';
    
    if (!this.customerId) {
      console.warn('Bitstamp requires Customer ID. Please provide it in the apiPassphrase field.');
    }
  }

  /**
   * Generate Bitstamp signature for authentication
   * Bitstamp uses HMAC SHA256 with unique format:
   * message = nonce + customer_id + api_key
   * signature = HMAC_SHA256(secret, message).toUpperCase()
   */
  private generateSignature(nonce: string): string {
    // Create the message: nonce + customer_id + api_key
    const message = nonce + this.customerId + this.credentials.apiKey;
    
    // Generate HMAC SHA256 signature
    const signature = CryptoJS.HmacSHA256(message, this.credentials.apiSecret)
      .toString(CryptoJS.enc.Hex)
      .toUpperCase();
    
    return signature;
  }

  /**
   * Get a unique nonce (microseconds timestamp)
   */
  private getNonce(): string {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  }

  /**
   * Make authenticated request to Bitstamp API
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    await this.rateLimit();

    const nonce = this.getNonce();
    const signature = this.generateSignature(nonce);

    const url = `${this.baseUrl}${endpoint}`;

    // Bitstamp uses POST for all authenticated endpoints
    const body = new URLSearchParams({
      key: this.credentials.apiKey,
      signature: signature,
      nonce: nonce,
      ...params,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleError(response.status, errorData);
      }

      const data = await response.json();
      
      // Check for API error in response
      if (data.error) {
        throw new Error(data.error);
      }

      return data as T;
    } catch (error) {
      throw this.handleError(0, error);
    }
  }

  /**
   * Test connection to Bitstamp API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest<BitstampBalance>('/balance/');
      return true;
    } catch (error) {
      console.error('Bitstamp connection test failed:', error);
      return false;
    }
  }

  /**
   * Fetch trade history from Bitstamp
   * Bitstamp returns trades in user_transactions endpoint with type='2'
   */
  async fetchTrades(options?: FetchOptions): Promise<Trade[]> {
    try {
      const params: Record<string, any> = {
        limit: options?.limit || 100,
      };

      // Note: Bitstamp doesn't support date filtering directly
      // We'll filter client-side after fetching
      
      const transactions = await this.makeRequest<BitstampUserTransaction[]>(
        '/user_transactions/',
        params
      );

      // Filter for market trades (type = '2')
      const trades = transactions
        .filter(tx => tx.type === '2')
        .map(tx => this.mapTransaction(tx));

      // Apply date filtering if specified
      let filteredTrades = trades;
      if (options?.startTime) {
        filteredTrades = filteredTrades.filter(
          t => t.timestamp >= options.startTime!
        );
      }
      if (options?.endTime) {
        filteredTrades = filteredTrades.filter(
          t => t.timestamp <= options.endTime!
        );
      }

      return filteredTrades;
    } catch (error) {
      console.error('Error fetching Bitstamp trades:', error);
      throw error;
    }
  }

  /**
   * Fetch account balances from Bitstamp
   */
  async fetchBalances(): Promise<Balance[]> {
    try {
      const balances = await this.makeRequest<BitstampBalance>('/balance/');
      
      return this.parseBalances(balances);
    } catch (error) {
      console.error('Error fetching Bitstamp balances:', error);
      throw error;
    }
  }

  /**
   * Parse Bitstamp balance response
   * Bitstamp returns dynamic keys like 'btc_available', 'btc_balance', etc.
   */
  private parseBalances(balances: BitstampBalance): Balance[] {
    const result: Balance[] = [];
    const currencies = new Set<string>();

    // Extract currency codes from keys
    for (const key in balances) {
      const match = key.match(/^([a-z]+)_(available|balance|reserved)$/);
      if (match) {
        currencies.add(match[1].toUpperCase());
      }
    }

    // Build balance objects
    for (const currency of currencies) {
      const currencyLower = currency.toLowerCase();
      const available = parseFloat(balances[`${currencyLower}_available`] || '0');
      const reserved = parseFloat(balances[`${currencyLower}_reserved`] || '0');
      const balance = parseFloat(balances[`${currencyLower}_balance`] || '0');

      // Only include if there's a non-zero balance
      if (balance > 0 || available > 0 || reserved > 0) {
        result.push({
          exchange: 'bitstamp',
          currency,
          free: available,
          locked: reserved,
          total: balance,
        });
      }
    }

    return result;
  }

  /**
   * Fetch order history from Bitstamp
   */
  async fetchOrders(options?: FetchOptions): Promise<Order[]> {
    try {
      // Get all trading pairs to fetch orders
      const pairs = await this.getTradingPairs();
      const allOrders: Order[] = [];

      for (const pair of pairs) {
        try {
          const params: Record<string, any> = {
            limit: options?.limit || 100,
          };

          // Fetch open orders for this pair
          const openOrders = await this.makeRequest<BitstampOpenOrder[]>(
            `/open_orders/${pair}/`,
            params
          );

          const mappedOrders = openOrders.map(order => this.mapOrder(order, 'open'));
          allOrders.push(...mappedOrders);
        } catch (error) {
          // Continue with other pairs if one fails
          console.warn(`Failed to fetch orders for ${pair}:`, error);
        }
      }

      // Note: Bitstamp doesn't have a direct endpoint for historical orders
      // We can only get open orders. For closed orders, we'd need to parse user_transactions

      return allOrders;
    } catch (error) {
      console.error('Error fetching Bitstamp orders:', error);
      throw error;
    }
  }

  /**
   * Get supported trading pairs
   */
  private async getTradingPairs(): Promise<string[]> {
    // Common Bitstamp trading pairs
    // In production, this could be fetched from /trading-pairs-info/ endpoint
    return [
      'btcusd', 'btceur', 'ethusd', 'etheur', 'xrpusd', 'xrpeur',
      'ltcusd', 'ltceur', 'bchusd', 'bcheur', 'usdcusd', 'usdceur'
    ];
  }

  /**
   * Fetch deposit history from Bitstamp
   * Deposits are in user_transactions with type='0'
   */
  async fetchDeposits(options?: FetchOptions): Promise<Deposit[]> {
    try {
      const params: Record<string, any> = {
        limit: options?.limit || 100,
      };

      const transactions = await this.makeRequest<BitstampUserTransaction[]>(
        '/user_transactions/',
        params
      );

      // Filter for deposits (type = '0')
      const deposits = transactions
        .filter(tx => tx.type === '0')
        .map(tx => this.mapDeposit(tx));

      // Apply date filtering if specified
      let filteredDeposits = deposits;
      if (options?.startTime) {
        filteredDeposits = filteredDeposits.filter(
          d => d.timestamp >= options.startTime!
        );
      }
      if (options?.endTime) {
        filteredDeposits = filteredDeposits.filter(
          d => d.timestamp <= options.endTime!
        );
      }

      return filteredDeposits;
    } catch (error) {
      console.error('Error fetching Bitstamp deposits:', error);
      throw error;
    }
  }

  /**
   * Fetch withdrawal history from Bitstamp
   * Withdrawals are in user_transactions with type='1'
   */
  async fetchWithdrawals(options?: FetchOptions): Promise<Withdrawal[]> {
    try {
      const params: Record<string, any> = {
        limit: options?.limit || 100,
      };

      const transactions = await this.makeRequest<BitstampUserTransaction[]>(
        '/user_transactions/',
        params
      );

      // Filter for withdrawals (type = '1')
      const withdrawals = transactions
        .filter(tx => tx.type === '1')
        .map(tx => this.mapWithdrawal(tx));

      // Apply date filtering if specified
      let filteredWithdrawals = withdrawals;
      if (options?.startTime) {
        filteredWithdrawals = filteredWithdrawals.filter(
          w => w.timestamp >= options.startTime!
        );
      }
      if (options?.endTime) {
        filteredWithdrawals = filteredWithdrawals.filter(
          w => w.timestamp <= options.endTime!
        );
      }

      return filteredWithdrawals;
    } catch (error) {
      console.error('Error fetching Bitstamp withdrawals:', error);
      throw error;
    }
  }

  /**
   * Map Bitstamp transaction to unified Trade format
   */
  private mapTransaction(tx: BitstampUserTransaction): Trade {
    // Determine currency pair and amounts from transaction
    let symbol = 'UNKNOWN';
    let price = 0;
    let quantity = 0;
    let side: 'buy' | 'sell' = 'buy';

    // Parse currency pair from transaction fields
    // Bitstamp uses dynamic fields like 'btc', 'usd', 'btc_usd', etc.
    const currencies = Object.keys(tx).filter(
      key => !['id', 'type', 'datetime', 'fee', 'order_id'].includes(key)
    );

    // Try to determine the trading pair
    if (tx.btc_usd) {
      symbol = 'BTC/USD';
      price = parseFloat(tx.btc_usd);
      quantity = Math.abs(parseFloat(tx.btc || '0'));
      side = parseFloat(tx.btc || '0') > 0 ? 'buy' : 'sell';
    } else if (tx.eth_usd) {
      symbol = 'ETH/USD';
      price = parseFloat(tx.eth_usd);
      quantity = Math.abs(parseFloat(tx.eth || '0'));
      side = parseFloat(tx.eth || '0') > 0 ? 'buy' : 'sell';
    } else {
      // Generic parsing for other pairs
      const baseCurrency = currencies.find(c => !['usd', 'eur', 'gbp'].includes(c));
      const quoteCurrency = currencies.find(c => ['usd', 'eur', 'gbp'].includes(c));
      
      if (baseCurrency && quoteCurrency) {
        symbol = `${baseCurrency.toUpperCase()}/${quoteCurrency.toUpperCase()}`;
        const priceKey = `${baseCurrency}_${quoteCurrency}`;
        if (tx[priceKey]) {
          price = parseFloat(tx[priceKey]);
        }
        if (tx[baseCurrency]) {
          quantity = Math.abs(parseFloat(tx[baseCurrency]));
          side = parseFloat(tx[baseCurrency]) > 0 ? 'buy' : 'sell';
        }
      }
    }

    return {
      id: tx.id.toString(),
      exchange: 'bitstamp',
      symbol,
      side,
      price,
      quantity,
      fee: parseFloat(tx.fee || '0'),
      feeCurrency: 'USD', // Bitstamp typically charges fees in quote currency
      timestamp: new Date(tx.datetime),
      orderId: tx.order_id?.toString(),
    };
  }

  /**
   * Map Bitstamp order to unified Order format
   */
  private mapOrder(order: BitstampOpenOrder, status: 'open' | 'closed'): Order {
    return {
      id: order.id,
      exchange: 'bitstamp',
      symbol: this.formatSymbol(order.currency_pair),
      type: 'limit', // Bitstamp primarily uses limit orders
      side: order.type === '0' ? 'buy' : 'sell',
      price: parseFloat(order.price),
      quantity: parseFloat(order.amount),
      filled: 0, // Not provided in open orders response
      remaining: parseFloat(order.amount),
      status,
      timestamp: new Date(order.datetime),
    };
  }

  /**
   * Format Bitstamp currency pair to standard format
   */
  private formatSymbol(pair: string): string {
    // Convert 'btcusd' to 'BTC/USD'
    const match = pair.match(/^([a-z]+)([a-z]+)$/);
    if (match) {
      const [, base, quote] = match;
      return `${base.toUpperCase()}/${quote.toUpperCase()}`;
    }
    return pair.toUpperCase();
  }

  /**
   * Map Bitstamp deposit transaction to unified Deposit format
   */
  private mapDeposit(tx: BitstampUserTransaction): Deposit {
    // Determine currency from transaction fields
    let currency = 'USD';
    let amount = 0;

    for (const key in tx) {
      if (key !== 'id' && key !== 'type' && key !== 'datetime' && key !== 'fee') {
        const value = parseFloat(tx[key] || '0');
        if (value > 0) {
          currency = key.toUpperCase();
          amount = value;
          break;
        }
      }
    }

    return {
      id: tx.id.toString(),
      exchange: 'bitstamp',
      currency,
      amount,
      address: '', // Not provided in user_transactions
      txId: '', // Not provided in user_transactions
      status: 'completed', // If it's in user_transactions, it's completed
      timestamp: new Date(tx.datetime),
    };
  }

  /**
   * Map Bitstamp withdrawal transaction to unified Withdrawal format
   */
  private mapWithdrawal(tx: BitstampUserTransaction): Withdrawal {
    // Determine currency from transaction fields
    let currency = 'USD';
    let amount = 0;

    for (const key in tx) {
      if (key !== 'id' && key !== 'type' && key !== 'datetime' && key !== 'fee') {
        const value = parseFloat(tx[key] || '0');
        if (value < 0) {
          currency = key.toUpperCase();
          amount = Math.abs(value);
          break;
        }
      }
    }

    return {
      id: tx.id.toString(),
      exchange: 'bitstamp',
      currency,
      amount,
      address: '', // Not provided in user_transactions
      txId: '', // Not provided in user_transactions
      fee: parseFloat(tx.fee || '0'),
      status: 'completed', // If it's in user_transactions, it's completed
      timestamp: new Date(tx.datetime),
    };
  }

  /**
   * Handle API errors
   */
  private handleError(status: number, error: any): Error {
    const message = error?.error || error?.message || 'Unknown Bitstamp API error';
    
    if (status === 401 || status === 403) {
      return new Error(`Bitstamp Authentication Error: ${message}. Please check your API Key, Secret, and Customer ID.`);
    }
    
    if (status === 429) {
      return new Error('Bitstamp Rate Limit Exceeded. Please try again later.');
    }
    
    if (status >= 500) {
      return new Error(`Bitstamp Server Error: ${message}`);
    }
    
    return new Error(`Bitstamp API Error: ${message}`);
  }
}
