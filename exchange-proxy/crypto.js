// Port of supabase/functions/_shared/exchangeUtils.ts's encrypt/decrypt to
// Node's native crypto module. MUST stay byte-for-byte compatible with the
// Deno/Web Crypto version, since both sides read/write the same
// exchange_connections.api_key_encrypted (etc.) columns.
//
// Format (identical to the Deno version): base64(12-byte IV || AES-GCM
// ciphertext), where the AES-GCM ciphertext already has the 16-byte auth
// tag appended at the end (that's how Web Crypto's subtle.encrypt() emits
// it). Node's crypto module wants the tag split out separately via
// setAuthTag(), so we slice it off here.

import crypto from 'node:crypto';

let cachedKey = null;

function getEncryptionKey() {
  if (cachedKey) return cachedKey;

  const secret = process.env.EXCHANGE_CREDS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'EXCHANGE_CREDS_ENCRYPTION_KEY is not set. Use the exact same value as the Supabase secret of the same name.'
    );
  }

  // Same derivation as the Deno side: SHA-256 of the secret string -> 256-bit AES key.
  cachedKey = crypto.createHash('sha256').update(secret, 'utf8').digest();
  return cachedKey;
}

export class LegacyCredentialError extends Error {
  constructor() {
    super(
      'These credentials were saved before encryption was fixed and can no longer be read securely. Please reconnect this exchange with a fresh API key.'
    );
    this.name = 'LegacyCredentialError';
  }
}

export function decrypt(payload) {
  const key = getEncryptionKey();

  let combined;
  try {
    combined = Buffer.from(payload, 'base64');
  } catch {
    throw new LegacyCredentialError();
  }

  if (combined.length <= 12 + 16) {
    // Too short to contain a 12-byte IV + 16-byte auth tag + any ciphertext.
    throw new LegacyCredentialError();
  }

  const iv = combined.subarray(0, 12);
  const rest = combined.subarray(12);
  const authTag = rest.subarray(rest.length - 16);
  const ciphertext = rest.subarray(0, rest.length - 16);

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // Auth tag mismatch — almost certainly legacy (pre-encryption-fix) data.
    throw new LegacyCredentialError();
  }
}

export function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, ciphertext, authTag]);
  return combined.toString('base64');
}
