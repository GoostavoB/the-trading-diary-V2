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

    const data = await response.json();
    const status = response.status;
    const code = typeof data?.code === 'number' ? data.code : undefined;
    const msg = data?.msg || data?.message || data?.error;

    console.log('BingX Request', { endpoint, status, code, msg });

    if (!response.ok) {
      throw new Error(`BingX HTTP Error [${status}]: ${response.statusText}`);
    }

    if (code !== undefined && code !== 0) {
      throw new Error(`BingX API Error [${code}]: ${msg || 'Unknown error'}`);
    }

    return (data && data.data !== undefined ? data.data : data) as T;
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

      // BingX spot historical trades (v1)
      const response = await this.makeRequest<any>(
        '/openApi/spot/v1/trade/query',
        params
      );

      const items = (response?.orders || response?.fills || response?.list || (Array.isArray(response) ? response : [])) as any[];
      if (!Array.isArray(items) || items.length === 0) {
        console.warn('BingX returned no spot trades or invalid format');
        return [];
      }

      return items
        .filter(trade => trade && (trade.orderId || trade.tradeId || trade.id))
        .map(trade => ({
          id: (trade.orderId || trade.tradeId || trade.id || '').toString(),
          exchange: 'bingx',
          symbol: (trade.symbol || '').replace('-', '/'),
          side: (trade.side || '').toLowerCase() as 'buy' | 'sell',
          price: parseFloat(trade.price || trade.avgPrice || '0'),
          quantity: parseFloat(trade.executedQty || trade.qty || trade.quantity || trade.origQty || '0'),
          fee: parseFloat(trade.commission || trade.fee || '0'),
          feeCurrency: trade.commissionAsset || trade.feeAsset || 'USDT',
          timestamp: new Date(parseInt(trade.time || trade.transactTime) || Date.now()),
          orderId: trade.orderId ? String(trade.orderId) : undefined,
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

  async fetchFuturesTrades(options?: FetchOptions): Promise<Trade[]> {
    try {
      const baseParams: Record<string, any> = {
        limit: Math.min(options?.limit || 500, 500),
        recvWindow: 60000,
      };

      if (options?.startTime) baseParams.startTime = options.startTime.getTime();
      if (options?.endTime) baseParams.endTime = options.endTime.getTime();
      if (options?.symbol) baseParams.symbol = options.symbol.replace('/', '-');

      // Prefer fills endpoint for executed trades
      let items: any[] = [];
      try {
        const resp1 = await this.makeRequest<any>(
          '/openApi/swap/v2/trade/allFillOrders',
          baseParams
        );
        const list1 = resp1?.orders || resp1?.fills || resp1?.list || resp1;
        if (Array.isArray(list1)) items = list1;
      } catch (e) {
        console.warn('BingX allFillOrders failed, will try fillHistory:', e instanceof Error ? e.message : e);
      }

      if (!Array.isArray(items) || items.length === 0) {
        console.log('BingX futures returned 0 fills from allFillOrders, trying fillHistory...');
        try {
          const resp2 = await this.makeRequest<any>(
            '/openApi/swap/v2/trade/fillHistory',
            baseParams
          );
          const list2 = resp2?.orders || resp2?.fills || resp2?.list || resp2;
          if (Array.isArray(list2)) items = list2;
        } catch (e2) {
          console.warn('BingX fillHistory failed:', e2 instanceof Error ? e2.message : e2);
        }
      }

      // COIN-M fallback (cswap) if USDT-M endpoints returned nothing
      if (!Array.isArray(items) || items.length === 0) {
        console.log('BingX futures USDT-M empty; trying COIN-M endpoints (cswap)...');
        try {
          const resp3 = await this.makeRequest<any>(
            '/openApi/cswap/v2/trade/allFillOrders',
            baseParams
          );
          const list3 = resp3?.orders || resp3?.fills || resp3?.list || resp3;
          if (Array.isArray(list3)) items = list3;
        } catch (e3) {
          console.warn('BingX cswap allFillOrders failed:', e3 instanceof Error ? e3.message : e3);
        }

        if (!Array.isArray(items) || items.length === 0) {
          try {
            const resp4 = await this.makeRequest<any>(
              '/openApi/cswap/v2/trade/fillHistory',
              baseParams
            );
            const list4 = resp4?.orders || resp4?.fills || resp4?.list || resp4;
            if (Array.isArray(list4)) items = list4;
          } catch (e4) {
            console.warn('BingX cswap fillHistory failed:', e4 instanceof Error ? e4.message : e4);
          }
        }
      }

      // Standard contract (non-perp) fallback as last attempt
      if (!Array.isArray(items) || items.length === 0) {
        console.log('BingX futures empty on swap/cswap; trying standard contract endpoints...');
        const contractParams: Record<string, any> = { ...baseParams };
        // symbol may be required by contract API; include if available
        if (options?.symbol) contractParams.symbol = options.symbol.replace('/', '-');
        try {
          const resp5 = await this.makeRequest<any>(
            '/openApi/contract/v1/allOrders',
            contractParams
          );
          const list5 = resp5?.orders || resp5?.list || (Array.isArray(resp5) ? resp5 : []);
          if (Array.isArray(list5)) items = list5;
        } catch (e5) {
          console.warn('BingX contract allOrders failed:', e5 instanceof Error ? e5.message : e5);
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        console.warn('BingX futures returned no trades or invalid format');
        return [];
      }

      return items
        .filter((t: any) => t && (t.orderId || t.tradeId || t.id))
        .map((t: any) => {
          const price = parseFloat(
            t.avgPrice || t.price || t.dealAvgPrice || t.dealPrice || '0'
          );
          const qty = parseFloat(
            t.executedQty || t.qty || t.volume || t.dealVol || t.origQty || '0'
          );
          const fee = parseFloat(t.commission || t.fee || '0');
          const tsRaw =
            t.time || t.updateTime || t.updatedTime || t.fillTime || t.createTime;
          const ts = new Date(parseInt(tsRaw) || Date.now());

          return {
            id: (t.tradeId || t.id || t.orderId || '').toString(),
            exchange: 'bingx',
            symbol: (t.symbol || '').replace('-', '/'),
            side: (t.side || '').toLowerCase() as 'buy' | 'sell',
            price,
            quantity: qty,
            fee,
            feeCurrency: t.commissionAsset || t.feeAsset || 'USDT',
            timestamp: ts,
            orderId: t.orderId ? String(t.orderId) : undefined,
            role: t.positionSide || t.role,
          } as Trade;
        });
    } catch (error) {
      console.error('Error fetching BingX futures trades:', error);
      throw error;
    }
  }

  // Optional futures-specific health check
  async testFuturesConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/openApi/swap/v3/user/balance');
      return true;
    } catch {
      try {
        await this.makeRequest('/openApi/contract/v1/balance');
        return true;
      } catch {
        return false;
      }
    }
  }

  async fetchWithdrawals(options?: FetchOptions): Promise<Withdrawal[]> {
    return [];
  }
}
