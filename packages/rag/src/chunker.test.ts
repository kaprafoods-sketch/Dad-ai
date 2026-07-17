import { describe, expect, it } from 'vitest';
import { TokenChunker } from './chunker';

describe('TokenChunker', () => {
  it('returns a single chunk for short text', () => {
    const chunks = new TokenChunker().chunk('Hello world. This is short.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain('Hello world');
  });

  it('splits long text into multiple overlapping chunks', () => {
    const para = 'Lorem ipsum dolor sit amet. '.repeat(50);
    const text = Array.from({ length: 6 }, () => para).join('\n\n');
    const chunks = new TokenChunker(200, 40).chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0);
    }
  });

  it('carries metadata and a per-chunk index', () => {
    const para = 'Sentence number one is here. '.repeat(40);
    const text = `${para}\n\n${para}\n\n${para}`;
    const chunks = new TokenChunker(150, 20).chunk(text, { docType: 'faq' });
    expect(chunks[0]?.metadata.docType).toBe('faq');
    expect(chunks[0]?.metadata.index).toBe(0);
    expect(chunks.at(-1)?.metadata.index).toBe(chunks.length - 1);
  });

  it('handles empty input', () => {
    expect(new TokenChunker().chunk('')).toHaveLength(0);
  });
});
