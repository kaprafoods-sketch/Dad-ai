import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  packMetaSchema,
  packEntitiesSchema,
  packPipelinesSchema,
  packUiSchema,
  packConnectorsSchema,
  type IndustryPack,
  type PackMeta,
  type PackEntities,
  type PackPipelines,
  type PackUi,
  type PackConnectors,
} from '@dad-ai/shared';

export interface PackBundle {
  meta: PackMeta;
  entities: PackEntities;
  pipelines: PackPipelines;
  ui: PackUi;
  connectors: PackConnectors;
  /** prompt name (filename without .md) → template text */
  prompts: Record<string, string>;
}

/** IndustryPack enum value → templates/ directory name. */
export function packDirFor(pack: IndustryPack): string {
  const map: Record<IndustryPack, string> = {
    AGENCY: 'agency',
    REAL_ESTATE: 'real-estate',
    RECRUITMENT: 'recruitment',
    CLINIC: 'clinic',
    CA: 'ca',
    LEGAL: 'legal',
  };
  return map[pack];
}

function readJson(dir: string, file: string): unknown {
  return JSON.parse(readFileSync(join(dir, file), 'utf8'));
}

/**
 * Load and validate a template bundle from templates/{dir}.
 * Throws (with a zod error) if any file is missing or malformed — a broken
 * pack must fail provisioning loudly, never half-apply.
 */
export function loadPack(templatesRoot: string, pack: IndustryPack): PackBundle {
  const dir = join(templatesRoot, packDirFor(pack));
  if (!existsSync(dir)) {
    throw new Error(`Industry pack "${pack}" has no template bundle at ${dir}`);
  }

  const prompts: Record<string, string> = {};
  const promptsDir = join(dir, 'prompts');
  if (existsSync(promptsDir)) {
    for (const file of readdirSync(promptsDir)) {
      if (file.endsWith('.md')) {
        prompts[file.replace(/\.md$/, '')] = readFileSync(join(promptsDir, file), 'utf8');
      }
    }
  }

  return {
    meta: packMetaSchema.parse(readJson(dir, 'pack.json')),
    entities: packEntitiesSchema.parse(readJson(dir, 'entities.json')),
    pipelines: packPipelinesSchema.parse(readJson(dir, 'pipelines.json')),
    ui: packUiSchema.parse(readJson(dir, 'ui.json')),
    connectors: packConnectorsSchema.parse(readJson(dir, 'connectors.json')),
    prompts,
  };
}
