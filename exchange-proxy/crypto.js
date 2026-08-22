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
