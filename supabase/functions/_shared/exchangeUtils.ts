/**
 * Shared utilities for exchange integrations
 */

// ── Encryption for exchange API credentials ────────────────────────────────
// Previously this used atob/btoa, which is Base64 ENCODING, not encryption —
// trivially reversible by anyone who can read the row (DB dump, RLS
// misconfiguration, log leak). API keys/secrets are live exchange
// credentials and deserve real encryption at rest.
//
// AES-256-GCM via Web Crypto (available natively in the Deno edge runtime,
// no npm dependency), gated behind an optional secret:
//   supabase secrets set EXCHANGE_CREDS_ENCRYPTION_KEY=$(openssl rand -base64 32)
//
// IMPORTANT: this upgrade is designed to require zero coordinated action.
// If EXCHANGE_CREDS_ENCRYPTION_KEY is not set, encrypt()/decrypt() silently
// fall back to the legacy Base64 scheme so every exchange connection (new
// or previously saved) keeps working exactly as before. Once the secret is
// set, new credentials are written with real AES-256-GCM encryption while
// old Base64 rows still decrypt correctly (decrypt() tries AES-GCM first,
// then falls back to plain Base64 — it never hard-fails a legitimate row).
// Ciphertext format when the secret IS set: base64(12-byte IV || AES-GCM ciphertext).

let cachedKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey | null> {
  if (cachedKey) return cachedKey;

  const secret = Deno.env.get('EXCHANGE_CREDS_ENCRYPTION_KEY');
  if (!secret) return null;

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
  if (!key) {
    // No EXCHANGE_CREDS_ENCRYPTION_KEY secret configured yet — fall back to
    // the legacy Base64 scheme so connecting exchanges keeps working.
    return btoa(plaintext);
  }

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
      'These credentials could not be read. Please reconnect this exchange with a fresh API key.'
    );
    this.name = 'LegacyCredentialError';
  }
}

export async function decrypt(payload: string): Promise<string> {
  let combined: Uint8Array;
  try {
    combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  } catch {
    throw new LegacyCredentialError();
  }

  const key = await getEncryptionKey();

  // Try real AES-GCM decryption first (only possible once the secret is
  // set and only correct for rows written after that point).
  if (key && combined.length > 12) {
    try {
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
      return new TextDecoder().decode(decrypted);
    } catch {
      // Falls through to legacy Base64 handling below — this is expected
      // for any row written before the secret was configured.
    }
  }

  // Legacy Base64 scheme (also the only scheme in use while no secret is set).
  try {
    return new TextDecoder().decode(combined);
  } catch {
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
