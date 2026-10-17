import type { Metadata } from 'next';
import Link from 'next/link';
import CTABand from '../../components/CTABand';

export const metadata: Metadata = {
  title: 'How the Document AI pipeline works',
  description:
    'A guide to Nirmaanco’s Document AI pipeline: upload, worker processing, chunking and embeddings in pgvector, RAG retrieval — and its current limits.',
  alternates: { canonical: '/knowledge/document-ai-pipeline' },
};

export default function DocumentAiPipelineGuide() {
  return (
    <>
      <article className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">Guide</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            How the Document AI pipeline works
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink/65">
            Based on the actual implementation:{' '}
            <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">
              apps/worker/src/processors/document.ts
            </code>
            , <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">packages/rag</code>, and{' '}
            <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">
              docs/architecture.md §6.4–6.5
            </code>
            .
          </p>

          <section aria-labelledby="q" className="mt-10">
            <h2 id="q" className="font-display text-xl font-bold text-ink">
              The question this answers
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              You upload a document — an invoice, a resume, a policy PDF. What does the platform
              actually do with it, step by step, and when does it become searchable and
              summarizable?
            </p>
          </section>

          <section aria-labelledby="steps" className="mt-10">
            <h2 id="steps" className="font-display text-xl font-bold text-ink">
              The pipeline, step by step
            </h2>
            <ol className="mt-4 space-y-5">
              {[
                [
                  'Upload & queue',
                  'The file lands in Supabase Storage and a doc.process job is enqueued for the worker with the tenant and document IDs.',
                ],
                [
                  'Mark PROCESSING',
                  'The worker loads the document, verifies it belongs to the tenant, and marks it PROCESSING.',
                ],
                [
                  'Extract text',
                  'Text is extracted from the upload. Structured extraction (an LLM with pack-specific schemas — e.g. resume fields, GST invoice fields) and summarization follow the architecture spec.',
                ],
                [
                  'Chunk (~800 tokens, 100 overlap)',
                  'The text is split with a token-aware chunker so each piece fits embedding models and stays retrievable in context.',
                ],
                [
                  'Embed → DocumentChunk (pgvector)',
                  'Each chunk is embedded with text-embedding-3-small (1536 dimensions) via OpenRouter/OpenAI, then stored in Postgres with a pgvector embedding column.',
                ],
                [
                  'Mark READY, emit document.ready',
                  'The document is marked READY and the platform emits a document.ready event, which workflows can subscribe to.',
                ],
                [
                  'RAG search',
                  'Queries are embedded the same way and matched with pgvector cosine similarity, strictly scoped by tenant (WHERE tenant_id = $1), top-8 by default, with optional filters on doc type and date.',
                ],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/10 font-display text-sm font-bold text-ember"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/65">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="limits" className="mt-10">
            <h2 id="limits" className="font-display text-xl font-bold text-ink">
              Current limitations
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/70">
              <li className="rounded-xl bg-marigold/10 px-4 py-3">
                <strong>Storage extraction for binary uploads isn’t wired yet.</strong> Today the
                pipeline needs inline text for the document; downloading from storage and running
                pdf-parse or vision OCR for scans is the next step — the pipeline shape is fixed,
                only the extractors are pending.
              </li>
              <li className="rounded-xl bg-marigold/10 px-4 py-3">
                <strong>Embeddings are skipped gracefully without a key.</strong> If no embeddings
                API key is configured, chunks are still stored and can be backfilled once embeddings
                are enabled — but nothing is searchable until then.
              </li>
              <li className="rounded-xl bg-marigold/10 px-4 py-3">
                <strong>Hybrid search is a “later”.</strong> Retrieval today is pure vector
                similarity; combining it with Postgres full-text search (reciprocal rank fusion) is
                planned but not implemented.
              </li>
            </ul>
          </section>

          <section aria-labelledby="related" className="mt-10">
            <h2 id="related" className="font-display text-xl font-bold text-ink">
              Related services
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/services/ai-automation"
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ember hover:text-ember"
              >
                AI & Automation
              </Link>
              <Link
                href="/services/digital-growth"
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ember hover:text-ember"
              >
                Digital Growth
              </Link>
            </div>
          </section>
        </div>
      </article>

      <CTABand />
    </>
  );
}
