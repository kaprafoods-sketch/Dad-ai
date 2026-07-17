import { CHUNKING, type Chunk, type Chunker } from './index';

const CHARS_PER_TOKEN = 4; // cheap approximation, good enough for chunking

/**
 * Paragraph-aware chunker: packs paragraphs up to ~targetTokens, carrying
 * ~overlapTokens of trailing context into the next chunk. Oversized
 * paragraphs are split on sentence boundaries.
 */
export class TokenChunker implements Chunker {
  constructor(
    private readonly targetTokens: number = CHUNKING.targetTokens,
    private readonly overlapTokens: number = CHUNKING.overlapTokens,
  ) {}

  chunk(text: string, metadata: Record<string, unknown> = {}): Chunk[] {
    const targetChars = this.targetTokens * CHARS_PER_TOKEN;
    const overlapChars = this.overlapTokens * CHARS_PER_TOKEN;

    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .flatMap((p) => (p.length > targetChars ? splitSentences(p, targetChars) : [p]));

    const chunks: Chunk[] = [];
    let current = '';
    for (const para of paragraphs) {
      if (current && current.length + para.length + 2 > targetChars) {
        chunks.push({ content: current, metadata: { ...metadata, index: chunks.length } });
        current = current.slice(-overlapChars);
      }
      current = current ? `${current}\n\n${para}` : para;
    }
    if (current.trim()) {
      chunks.push({ content: current, metadata: { ...metadata, index: chunks.length } });
    }
    return chunks;
  }
}

function splitSentences(paragraph: string, targetChars: number): string[] {
  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [paragraph];
  const parts: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > targetChars) {
      parts.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
