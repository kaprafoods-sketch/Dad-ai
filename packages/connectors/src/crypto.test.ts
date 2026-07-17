import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { encryptCredentials, decryptCredentials } from './crypto';

const key = randomBytes(32);

describe('credential encryption', () => {
  it('round-trips an object', () => {
    const secret = { accessToken: 'abc', refreshToken: 'xyz', expiresAt: 123 };
    const wire = encryptCredentials(secret, key);
    expect(decryptCredentials(wire, key)).toEqual(secret);
  });

  it('produces different ciphertext each time (random IV)', () => {
    expect(encryptCredentials({ a: 1 }, key)).not.toBe(encryptCredentials({ a: 1 }, key));
  });

  it('fails to decrypt with the wrong key', () => {
    const wire = encryptCredentials({ a: 1 }, key);
    expect(() => decryptCredentials(wire, randomBytes(32))).toThrow();
  });

  it('fails on tampered ciphertext (GCM auth tag)', () => {
    const wire = encryptCredentials({ a: 1 }, key);
    const [iv, tag, data] = wire.split('.');
    const tampered = [iv, tag, Buffer.from('garbage').toString('base64')].join('.');
    expect(() => decryptCredentials(tampered, key)).toThrow();
  });

  it('rejects malformed input', () => {
    expect(() => decryptCredentials('not-valid', key)).toThrow(/Malformed/);
  });
});
