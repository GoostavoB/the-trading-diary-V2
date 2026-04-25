export type AggregatorProvider = 'snaptrade' | 'vezgo' | 'mesh';

export type AggregatorConnectionStatus =
  | 'pending'
  | 'active'
  | 'syncing'
  | 'requires_reauth'
  | 'disconnected'
  | 'error';

export interface AggregatorConnection {
  id: string;
  user_id: string;
  provider: AggregatorProvider;
  connection_id: string;
  broker_slug: string;
  broker_label: string | null;
  status: AggregatorConnectionStatus;
  last_synced_at: string | null;
  last_error: string | null;
  account_count: number;
  trade_count: number;
  meta: {
    logo?: string;
    type?: string;
    name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SnapTradeLoginLinkResponse {
  redirectURI: string;
  sessionId: string;
}

export interface SyncResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** SnapTrade-supported crypto-relevant brokers (curated for our UI). */
export const SUPPORTED_BROKERS = [
  { slug: 'BINANCE',  label: 'Binance',  logo: '/exchange-logos/binance.svg' },
  { slug: 'COINBASE', label: 'Coinbase', logo: '/exchange-logos/coinbase.svg' },
  { slug: 'KRAKEN',   label: 'Kraken',   logo: '/exchange-logos/kraken.svg' },
  { slug: 'GEMINI',   label: 'Gemini',   logo: '/exchange-logos/gemini.svg' },
  { slug: 'BITFINEX', label: 'Bitfinex', logo: '/exchange-logos/bitfinex.svg' },
  { slug: 'BITSTAMP', label: 'Bitstamp', logo: '/exchange-logos/bitstamp.svg' },
  // SnapTrade adds new brokers regularly — leaving the list open via "any broker"
] as const;
