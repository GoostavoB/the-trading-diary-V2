import type {
  ExchangeCredentials,
  Trade,
  Balance,
  Order,
  Deposit,
  Withdrawal,
  FetchOptions,
} from './types.ts';

/**
 * Base Exchange Adapter
 * Abstract class providing common functionality for all exchange adapters
 */
export type ConnectionErrorType = 'auth' | 'network' | 'unknown';

export interface ConnectionError {
  type: ConnectionErrorType;
  message: string;
}

/**
 * Classify a raw adapter error so callers can tell an actual credential
 * rejection from a transient network failure (fetch failed / timeout / DNS).
 * Blaming credentials for a network blip sends users on a wild goose chase.
 */
export function classifyConnectionError(error: unknown): ConnectionError {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  const networkSignals = [
    'fetch failed',
    'timeout',
    'timed out',
    'etimedout',
    'econnreset',
    'econnrefused',
    'enotfound',
    'dns',
    'network',
    'socket',
    'tls',
    'certificate',
    'connection closed',
  ];
  const authSignals = [
    'invalid api',
    'invalid signature',
    'signature',
    'apikey',
    'api key',
    'api-key',
    'permission',
    'unauthorized',
    'authentication',
    'forbidden',
    'invalid credential',
  ];

  if (networkSignals.some((s) => lower.includes(s))) {
    return {
      type: 'network',
      message: `Could not reach the exchange (network error): ${raw}`,
    };
  }

  if (authSignals.some((s) => lower.includes(s))) {
    return {
      type: 'auth',
      message: `Exchange rejected the API credentials: ${raw}`,
    };
  }

  return { type: 'unknown', message: raw };
}

export abstract class BaseExchangeAdapter {
  protected credentials: ExchangeCredentials;
  /** Set by testConnection() implementations when the check fails. */
  public lastConnectionError?: ConnectionError;
  protected abstract baseUrl: string;
  protected abstract name: string;
  protected abstract rateLimitDelay: number;
  protected lastRequestTime: number = 0;
  protected requestQueue: Array<() => Promise<void>> = [];
  protected isProcessingQueue = false;

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials;
  }

  /**
   * Get the display name of the exchange
   */
  getName(): string {
    return this.name;
  }

  /**
   * Rate limiting: ensure minimum delay between requests
   */
  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.rateLimitDelay - timeSinceLastRequest);

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retryRequest<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const cause = (error as any)?.cause;
        if (cause) {
          console.error(
            `Request error cause: ${cause?.name ?? typeof cause}: ${cause?.message ?? String(cause)}${cause?.code ? ` [code=${cause.code}]` : ''}`
          );
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Add request to queue for rate limiting
   */
  protected async queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await this.rateLimit();
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Health check for exchange connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    lastError?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isConnected = await this.testConnection();
      const latency = Date.now() - startTime;
      
      return {
        status: isConnected ? (latency > 3000 ? 'degraded' : 'healthy') : 'down',
        latency,
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - startTime,
        lastError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test connection to exchange
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Fetch trade history
   */
  abstract fetchTrades(options?: FetchOptions): Promise<Trade[]>;

  /**
   * Fetch account balances
   */
  abstract fetchBalances(): Promise<Balance[]>;

  /**
   * Fetch order history
   */
  abstract fetchOrders(options?: FetchOptions): Promise<Order[]>;

  /**
   * Fetch deposit history
   */
  abstract fetchDeposits(options?: FetchOptions): Promise<Deposit[]>;

  /**
   * Fetch withdrawal history
   */
  abstract fetchWithdrawals(options?: FetchOptions): Promise<Withdrawal[]>;
}
