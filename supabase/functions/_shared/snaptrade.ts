// ────────────────────────────────────────────────────────────────────────────
// Shared SnapTrade client for edge functions.
// Pure fetch + Web Crypto HMAC-SHA256 — no npm deps.
//
// Auth model (per SnapTrade docs):
//   Headers on every request:
//     - clientId: <SNAPTRADE_CLIENT_ID>
//     - timestamp: <unix_seconds>
//     - signature: base64( HMAC_SHA256(consumerKey, JSON.stringify({content, path, query})) )
//
// API base: https://api.snaptrade.com/api/v1
// ────────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://api.snaptrade.com/api/v1';

function envOrThrow(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

async function hmacSha256Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  // base64
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

interface SnapTradeRequest {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;             // e.g. '/snapTrade/registerUser'
  query?: Record<string, string | undefined>;
  body?: unknown;
}

export async function snapTradeRequest<T = unknown>(
  req: SnapTradeRequest,
): Promise<T> {
  const clientId = envOrThrow('SNAPTRADE_CLIENT_ID');
  const consumerKey = envOrThrow('SNAPTRADE_CONSUMER_KEY');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const queryParams = new URLSearchParams();

  // SnapTrade requires clientId+timestamp inside the signed query
  queryParams.append('clientId', clientId);
  queryParams.append('timestamp', timestamp);
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && v !== null) queryParams.append(k, v);
    }
  }
  // Sort keys alphabetically (SnapTrade convention)
  const sortedQuery = Array.from(queryParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // Build the canonical sig payload exactly as SnapTrade expects
  const sigPayload = JSON.stringify({
    content: req.body ?? null,
    path: req.path,
    query: sortedQuery,
  });
  const signature = await hmacSha256Base64(consumerKey, sigPayload);

  const url = `${API_BASE}${req.path}?${sortedQuery}`;

  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Signature': signature,
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SnapTrade ${req.method} ${req.path} failed: ${res.status} ${text}`);
  }

  // Some endpoints return 204
  if (res.status === 204) return undefined as T;
  return await res.json() as T;
}

// ── Convenience wrappers ────────────────────────────────────────────────────

/** Register a new SnapTrade user. Returns { userId, userSecret }. */
export async function snapTradeRegisterUser(userId: string) {
  return snapTradeRequest<{ userId: string; userSecret: string }>({
    method: 'POST',
    path: '/snapTrade/registerUser',
    body: { userId },
  });
}

/** Generate a Connection Portal redirect URI for the given user. */
export async function snapTradeLoginPortalURI(args: {
  userId: string;
  userSecret: string;
  broker?: string;          // optional: pre-select broker (e.g., "BINANCE")
  immediateRedirect?: boolean;
  customRedirect?: string;  // where to send user after they finish/cancel
}) {
  return snapTradeRequest<{ redirectURI: string; sessionId: string }>({
    method: 'POST',
    path: '/snapTrade/login',
    query: { userId: args.userId, userSecret: args.userSecret },
    body: {
      broker: args.broker,
      immediateRedirect: args.immediateRedirect ?? false,
      customRedirect: args.customRedirect,
      connectionType: 'read',
    },
  });
}

/** List all connections (brokerage authorizations) for a user. */
export async function snapTradeListConnections(userId: string, userSecret: string) {
  return snapTradeRequest<Array<{
    id: string;
    name: string;
    type: string;
    disabled: boolean;
    brokerage: { id: string; name: string; slug: string; logo?: string };
    created_date: string;
    updated_date: string;
  }>>({
    method: 'GET',
    path: '/authorizations',
    query: { userId, userSecret },
  });
}

/** Disconnect (remove) a brokerage authorization. */
export async function snapTradeRemoveConnection(args: {
  userId: string;
  userSecret: string;
  authorizationId: string;
}) {
  return snapTradeRequest<void>({
    method: 'DELETE',
    path: `/authorizations/${args.authorizationId}`,
    query: { userId: args.userId, userSecret: args.userSecret },
  });
}

/** List all activities (trades, deposits, withdrawals) for a user. */
export async function snapTradeListActivities(args: {
  userId: string;
  userSecret: string;
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;
  accounts?: string;        // comma-separated account IDs
  type?: 'BUY' | 'SELL' | 'DIVIDEND' | 'CONTRIBUTION' | 'WITHDRAWAL' | 'EXTERNAL_ASSET_TRANSFER_IN' | 'EXTERNAL_ASSET_TRANSFER_OUT' | 'INTERNAL_CASH_TRANSFER_IN' | 'INTERNAL_CASH_TRANSFER_OUT' | 'INTERNAL_ASSET_TRANSFER_IN' | 'INTERNAL_ASSET_TRANSFER_OUT' | 'INTEREST' | 'REBATE' | 'GOV_GRANT' | 'TAX' | 'FEE' | 'REI' | 'FXT';
}) {
  return snapTradeRequest<Array<{
    id: string;
    account: { id: string; name: string };
    symbol?: { symbol: string; raw_symbol?: string; description?: string };
    option_symbol?: unknown;
    price: number | null;
    units: number | null;
    amount: number | null;
    currency: { code: string };
    type: string;
    description?: string;
    trade_date?: string;
    settlement_date?: string;
    fee?: number;
    fx_rate?: number;
    institution?: string;
  }>>({
    method: 'GET',
    path: '/activities',
    query: {
      userId: args.userId,
      userSecret: args.userSecret,
      startDate: args.startDate,
      endDate: args.endDate,
      accounts: args.accounts,
      type: args.type,
    },
  });
}

/** List all accounts for a user. */
export async function snapTradeListAccounts(userId: string, userSecret: string) {
  return snapTradeRequest<Array<{
    id: string;
    name: string;
    institution_name: string;
    balance: { total: { amount: number; currency: string } };
  }>>({
    method: 'GET',
    path: '/accounts',
    query: { userId, userSecret },
  });
}
