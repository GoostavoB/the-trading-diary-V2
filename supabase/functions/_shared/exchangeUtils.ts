/**
 * Shared utilities for exchange integrations
 */

// ── Real encryption for exchange API credentials ──────────────────────────
// Previously this used atob/btoa, which is Base64 ENCODING, not encryption —
// trivially reversible by anyone who can read the row (DB dump, RLS
// misconfiguration, log leak). API keys/secrets are live exchange
// credentials and deserve real encryption at rest.
//
// AES-256-GCM via Web Crypto (available natively in the Deno edge runtime,
// no npm dependency). Key is derived from a secret set once via:
//   supabase secrets set EXCHANGE_CREDS_ENCRYPTION_KEY=$(openssl rand -base64 32)
//
// Ciphertext format stored in the DB: base64(12-byte IV || AES-GCM ciphertext).
//
// IMPORTANT: rows encrypted under the old atob/btoa scheme will NOT decrypt
// with this. decrypt() throws a distinguishable error for that case so
// callers can prompt the user to reconnect rather than crash unhelpfully.

let cachedKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const secret = Deno.env.get('EXCHANGE_CREDS_ENCRYPTION_KEY');
  if (!secret) {
    throw new Error(
      'EXCHANGE_CREDS_ENCRYPTION_KEY is not set. Run: supabase secrets set EXCHANGE_CREDS_ENCRYPTION_KEY=$(openssl rand -base64 32)'
    );
  }

  // Hash the secret to a fixed 256-bit key regardless of the input length.
  const keyMaterial = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  cachedKey = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  return cachedKey;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  let binary = '';
  for (const byte of combined) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export class LegacyCredentialError extends Error {
  constructor() {
    super(
      'These credentials were saved before encryption was fixed and can no longer be read securely. Please reconnect this exchange with a fresh API key.'
    );
    this.name = 'LegacyCredentialError';
  }
}

export async function decrypt(payload: string): Promise<string> {
  const key = await getEncryptionKey();

  let combined: Uint8Array;
  try {
    combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  } catch {
    throw new LegacyCredentialError();
  }

  if (combined.length <= 12) {
    // Too short to contain a 12-byte IV + any ciphertext — must be legacy data.
    throw new LegacyCredentialError();
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    // AES-GCM decrypt fails (auth tag mismatch) on anything that wasn't
    // encrypted with this scheme — almost certainly legacy atob/btoa data.
    throw new LegacyCredentialError();
  }
}

/**
 * Supported exchanges list
 */
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

/**
 * Exchanges that require API passphrase
 */
export const EXCHANGES_REQUIRING_PASSPHRASE: SupportedExchange[] = ['kucoin', 'okx', 'bitstamp'];

/**
 * Check if exchange requires passphrase
 */
export function requiresPassphrase(exchange: string): boolean {
  return EXCHANGES_REQUIRING_PASSPHRASE.includes(exchange as SupportedExchange);
}

/**
 * Validate exchange name
 */
export function isSupportedExchange(exchange: string): boolean {
  return SUPPORTED_EXCHANGES.includes(exchange.toLowerCase() as SupportedExchange);
}
