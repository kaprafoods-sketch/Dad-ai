import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM encryption for connector credentials at rest
 * (docs/architecture.md §11). Never store plaintext tokens.
 *
 * Key: CREDENTIALS_ENCRYPTION_KEY, a 32-byte value as 64 hex chars
 * (generate with `openssl rand -hex 32`).
 *
 * Wire format (all base64, dot-separated): iv.authTag.ciphertext
 */
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not set');
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  }
  return key;
}

export function encryptCredentials(plaintext: unknown, key: Buffer = getKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), data.toString('base64')].join('.');
}

export function decryptCredentials<T = Record<string, unknown>>(
  wire: string,
  key: Buffer = getKey(),
): T {
  const [ivB64, tagB64, dataB64] = wire.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted credentials');
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext) as T;
}
