// RAG: chunking, embedding, retrieval over tenant documents (pgvector).
// See docs/architecture.md §6.5.

export const CHUNKING = {
  targetTokens: 800,
  overlapTokens: 100,
} as const;

export const EMBEDDING = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
} as const;

export interface Chunk {
  content: string;
  metadata: Record<string, unknown>;
}

export interface RetrievedChunk extends Chunk {
  documentId: string;
  similarity: number;
}

export interface Chunker {
  chunk(text: string, metadata?: Record<string, unknown>): Chunk[];
}

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export interface Retriever {
  /** pgvector cosine similarity, always WHERE tenant_id = $1, top-k 8 default. */
  search(
    tenantId: string,
    query: string,
    opts?: { topK?: number; filter?: { docType?: string; after?: Date } },
  ): Promise<RetrievedChunk[]>;
}

export { TokenChunker } from './chunker';
export { OpenAiCompatibleEmbedder } from './embedder';
export { PgVectorRetriever, type RawQueryClient } from './retriever';

// TODO(later): hybrid search — Postgres FTS + reciprocal rank fusion.
