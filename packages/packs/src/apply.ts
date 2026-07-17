import type { PrismaClient } from '@dad-ai/db';
import { tenantClient } from '@dad-ai/db';
import type { IndustryPack } from '@dad-ai/shared';
import { loadPack, type PackBundle } from './loader';

export interface ApplyResult {
  pack: string;
  pipelines: number;
  stages: number;
  agents: number;
}

/**
 * The ApplyIndustryPack job (docs/industry-packs.md): seeds a freshly created
 * tenant with the pack's pipelines, default agents, and settings. Idempotent
 * enough to re-run: it skips seeding when the tenant already has pipelines.
 */
export async function applyIndustryPack(
  prisma: PrismaClient,
  tenantId: string,
  templatesRoot: string,
  bundle?: PackBundle,
): Promise<ApplyResult> {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const pack = bundle ?? loadPack(templatesRoot, tenant.industryPack as IndustryPack);
  const db = tenantClient(prisma, tenantId);

  let pipelines = 0;
  let stages = 0;
  const existing = await db.pipeline.count();
  if (existing === 0) {
    for (const def of pack.pipelines.pipelines) {
      const pipeline = await db.pipeline.create({ data: { tenantId, name: def.name } });
      pipelines += 1;
      let order = 0;
      for (const stageName of def.stages) {
        await db.stage.create({
          data: { tenantId, pipelineId: pipeline.id, name: stageName, order: order++ },
        });
        stages += 1;
      }
    }
  }

  let agents = 0;
  const existingAgents = await db.agent.count();
  if (existingAgents === 0 && pack.prompts['receptionist']) {
    await db.agent.create({
      data: {
        tenantId,
        type: 'receptionist',
        name: `${pack.meta.name} Receptionist`,
        systemPrompt: pack.prompts['receptionist'],
        model: 'router:default',
        tools: ['crm.searchContacts', 'crm.createLead', 'crm.addNote', 'crm.createTask'],
        channels: ['webchat', 'whatsapp'],
      },
    });
    agents = 1;
  }

  // Frontend renders nav/terminology/custom-field schemas from settings.
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      settings: {
        ...(tenant.settings as object),
        pack: {
          id: pack.meta.id,
          version: pack.meta.version,
          ui: pack.ui,
          entities: pack.entities,
          connectors: pack.connectors,
        },
      },
    },
  });

  return { pack: pack.meta.id, pipelines, stages, agents };
}
