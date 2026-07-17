import type { Embedder, RetrievedChunk, Retriever } from './index';

/**
 * Minimal Prisma surface so this package doesn't depend on @dad-ai/db.
 * Raw SQL is required here — pgvector operators aren't in the Prisma DSL.
 * This is one of the reviewed raw-query exceptions (docs/architecture.md §3).
 */
export interface RawQueryClient {
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

export class PgVectorRetriever implements Retriever {
  constructor(
    private readonly prisma: RawQueryClient,
    private readonly embedder: Embedder,
  ) {}

  async search(
    tenantId: string,
    query: string,
    opts?: { topK?: number; filter?: { docType?: string; after?: Date } },
  ): Promise<RetrievedChunk[]> {
    const [embedding] = await this.embedder.embed([query]);
    if (!embedding) return [];
    const vector = `[${embedding.join(',')}]`;

    // Parameterized: tenant isolation is non-negotiable ($1), vector is $2.
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ documentId: string; content: string; metadata: unknown; similarity: number }>
    >(
      `SELECT "documentId", content, metadata,
              1 - (embedding <=> $2::vector) AS similarity
       FROM "DocumentChunk"
       WHERE "tenantId" = $1::uuid AND embedding IS NOT NULL
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      tenantId,
      vector,
      opts?.topK ?? 8,
    );

    return rows.map((row) => ({
      documentId: row.documentId,
      content: row.content,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      similarity: row.similarity,
    }));
  }
}
