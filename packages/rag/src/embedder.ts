import { EMBEDDING, type Embedder } from './index';

/**
 * Embeddings via the OpenAI-compatible endpoint (OpenRouter or OpenAI —
 * set EMBEDDINGS_BASE_URL/EMBEDDINGS_API_KEY, defaults to OpenAI).
 */
export class OpenAiCompatibleEmbedder implements Embedder {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = 'https://api.openai.com/v1',
    private readonly model = EMBEDDING.model,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) {
      throw new Error(`Embeddings API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as { data: Array<{ index: number; embedding: number[] }> };
    return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}
