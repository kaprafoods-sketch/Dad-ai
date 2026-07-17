import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  parseWhatsAppInbound,
  verifyWhatsAppSignature,
  verifyWhatsAppSubscription,
} from './whatsapp';

describe('verifyWhatsAppSubscription', () => {
  it('echoes the challenge when the token matches', () => {
    const challenge = verifyWhatsAppSubscription(
      { 'hub.mode': 'subscribe', 'hub.verify_token': 'secret', 'hub.challenge': '12345' },
      'secret',
    );
    expect(challenge).toBe('12345');
  });

  it('returns null on token mismatch', () => {
    expect(
      verifyWhatsAppSubscription(
        { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': '1' },
        'secret',
      ),
    ).toBeNull();
  });
});

describe('verifyWhatsAppSignature', () => {
  const appSecret = 'app_secret';
  const body = JSON.stringify({ hello: 'world' });
  const sig = 'sha256=' + createHmac('sha256', appSecret).update(body).digest('hex');

  it('accepts a valid signature', () => {
    expect(verifyWhatsAppSignature(body, sig, appSecret)).toBe(true);
  });

  it('rejects a tampered body', () => {
    expect(verifyWhatsAppSignature(body + 'x', sig, appSecret)).toBe(false);
  });

  it('rejects a missing/badly-formatted header', () => {
    expect(verifyWhatsAppSignature(body, undefined, appSecret)).toBe(false);
    expect(verifyWhatsAppSignature(body, 'nope', appSecret)).toBe(false);
  });
});

describe('parseWhatsAppInbound', () => {
  it('extracts text messages with contact names', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ wa_id: '919876543210', profile: { name: 'Asha' } }],
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.1',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'Hi, I need a 2BHK' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const messages = parseWhatsAppInbound(payload);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      from: '919876543210',
      text: 'Hi, I need a 2BHK',
      contactName: 'Asha',
    });
  });

  it('ignores non-text messages and empty payloads', () => {
    expect(parseWhatsAppInbound({})).toHaveLength(0);
    expect(
      parseWhatsAppInbound({
        entry: [
          {
            changes: [
              { value: { messages: [{ from: 'x', id: '1', timestamp: '1', type: 'image' }] } },
            ],
          },
        ],
      }),
    ).toHaveLength(0);
  });
});
