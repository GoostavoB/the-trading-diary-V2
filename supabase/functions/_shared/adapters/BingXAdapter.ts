import { BaseExchangeAdapter } from './BaseExchangeAdapter.ts';
import type { 
  ExchangeCredentials, 
  Trade, 
  Balance, 
  Order, 
  Deposit, 
  Withdrawal,
  FetchOptions 
} from './types.ts';

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export class BingXAdapter extends BaseExchangeAdapter {
  protected baseUrl = 'https://open-api.bingx.com';
  protected name = 'BingX';
  protected rateLimitDelay = 100;

  constructor(credentials: ExchangeCredentials) {
    super(credentials);
  }

  private async generateSignature(params: string): Promise<string> {
    return await hmacSha256(this.credentials.apiSecret, params);
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.rateLimit();

    const timestamp = Date.now().toString();
    const allParams = { ...params, timestamp };
    const queryString = new URLSearchParams(allParams).toString();
    const signature = await this.generateSignature(queryString);

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      headers: {
        'X-BX-APIKEY': this.credentials.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`BingX API Error: ${response.statusText}`);
    }

    const data = await response.json();
    // BingX returns HTTP 200 even for auth/permission errors; the real status is in the body
    if (data && typeof data === 'object' && 'code' in data && data.code !== 0) {
      throw new Error(`BingX API Error ${data.code}: ${data.msg || 'Unknown error'}`);
    }
    return data.data || data;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/openApi/spot/v1/account/balance');
      return true;
    } catch {
      return false;
    }
  }

  async fetchTrades(options?: FetchOptions): Promise<Trade[]> {
    try {
      const params: Record<string, any> = { 
        limit: Math.min(options?.limit || 500, 1000)
      };

      // Add time filters if provided
      if (options?.startTime) {
        params.startTime = options.startTime.getTime();
      }
      if (options?.endTime) {
        params.endTime = options.endTime.getTime();
      }
      if (options?.symbol) {
        params.symbol = options.symbol.replace('/', '-');
      }

      // BingX uses /openApi/spot/v2/trade/query for historical trades
      const response = await this.makeRequest<{ orders: any[] }>(
        '/openApi/spot/v2/trade/query', 
        params
      );
      
      if (!response.orders || !Array.isArray(response.orders)) {
        console.warn('BingX returned no trades or invalid format');
        return [];
      }

      return response.orders
        .filter(trade => trade && trade.orderId)
        .map(trade => ({
          id: trade.orderId?.toString() || trade.tradeId?.toString() || '',
          exchange: 'bingx',
          symbol: trade.symbol?.replace('-', '/') || '',
          side: trade.side?.toLowerCase() as 'buy' | 'sell',
          price: parseFloat(trade.price || '0'),
          quantity: parseFloat(trade.executedQty || trade.quantity || trade.origQty || '0'),
          fee: parseFloat(trade.commission || trade.fee || '0'),
          feeCurrency: trade.commissionAsset || trade.feeAsset || 'USDT',
          timestamp: new Date(parseInt(trade.time || trade.transactTime) || Date.now()),
          orderId: trade.orderId?.toString(),
        }));
    } catch (error) {
      console.error('Error fetching BingX trades:', error);
      throw error;
    }
  }

  async fetchBalances(): Promise<Balance[]> {
    try {
      const response = await this.makeRequest<{ balances: any[] }>('/openApi/spot/v1/account/balance');
      return response.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(balance => {
          const free = parseFloat(balance.free);
          const locked = parseFloat(balance.locked);
          return {
            exchange: 'bingx',
            currency: balance.asset,
            free,
            locked,
            total: free + locked,
          };
        });
    } catch (error) {
      console.error('Error fetching BingX balances:', error);
      return [];
    }
  }

  async fetchOrders(options?: FetchOptions): Promise<Order[]> {
    return [];
  }

  async fetchDeposits(options?: FetchOptions): Promise<Deposit[]> {
    return [];
  }

  async fetchWithdrawals(options?: FetchOptions): Promise<Withdrawal[]> {
    return [];
  }
}
