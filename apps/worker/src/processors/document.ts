import type { PrismaClient } from '@dad-ai/db';
import { OpenAiCompatibleEmbedder, TokenChunker } from '@dad-ai/rag';

/**
 * Document AI pipeline (docs/architecture.md §6.4), doc.process queue:
 *   extract → (structured extraction, Phase 1) → chunk → embed → READY.
 *
 * Extraction currently handles text-like uploads; pdf-parse + vision OCR for
 * scans are the next step (they only add extractors, the pipeline is fixed).
 */
export async function processDocument(
  prisma: PrismaClient,
  job: { tenantId: string; documentId: string; text?: string },
): Promise<void> {
  const doc = await prisma.document.findUniqueOrThrow({
    where: { id: job.documentId },
  });
  if (doc.tenantId !== job.tenantId) {
    throw new Error(`Document ${doc.id} does not belong to tenant ${job.tenantId}`);
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: { status: 'PROCESSING' },
  });

  try {
    // 1-2. Extract text. Storage download + pdf-parse/OCR: Phase 1.
    const text = job.text;
    if (!text) {
      throw new Error(
        `No inline text for ${doc.mimeType} — storage extraction not yet implemented`,
      );
    }

    // 3. Chunk (~800 tokens, 100 overlap).
    const chunks = new TokenChunker().chunk(text, {
      filename: doc.filename,
      mimeType: doc.mimeType,
    });

    // 4. Embed (skipped gracefully when no key configured — chunks are still
    // stored and can be backfilled once embeddings are enabled).
    const apiKey = process.env.EMBEDDINGS_API_KEY ?? process.env.OPENAI_API_KEY;
    const embeddings = apiKey
      ? await new OpenAiCompatibleEmbedder(apiKey, process.env.EMBEDDINGS_BASE_URL).embed(
          chunks.map((c) => c.content),
        )
      : [];

    // 5. Store chunks; embedding column is pgvector → raw SQL (reviewed path).
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const created = await prisma.documentChunk.create({
        data: {
          tenantId: doc.tenantId,
          documentId: doc.id,
          content: chunk.content,
          metadata: chunk.metadata as object,
        },
      });
      const embedding = embeddings[i];
      if (embedding) {
        await prisma.$executeRaw`
          UPDATE "DocumentChunk"
          SET embedding = ${`[${embedding.join(',')}]`}::vector
          WHERE id = ${created.id}::uuid`;
      }
    }

    // 6. READY + document.ready platform event (workflow dispatch: Phase 2).
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'READY', summary: text.slice(0, 500) },
    });
  } catch (error) {
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: 'FAILED',
        extraction: { error: error instanceof Error ? error.message : String(error) } as object,
      },
    });
    throw error;
  }
}
